// 14.1.4 Initialization: why the starting point matters.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const stations = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const blue = C.cyan, orange = C.amber;
  const first = [129, 53.6, 35.75, 20, 20], second = [84, 41.6, 41.6];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  let BOXP = P ? [0, 3.55, 0] : [3.85, -0.9, 0];
  const U = P ? 0.66 : 0.59;
  const GX = P ? -3.3 : -5.95, BASE = P ? -6.0 : -3.1;

  const text = (s, x, y, color = C.ink, size = 20) =>
    T(String(s), size, color, true).moveTo([x, y, 0]);
  let sayAt = PILL;
  const say = (s, color = blue) => showA(s, color, sayAt);
  const line = (start, end, color, width = 2) =>
    new M.Line({ start, end, color, strokeWidth: width });
  const point = ([x, y]) => [GX + x * U, BASE + y * U, 0];
  const letter = i => String.fromCharCode(65 + i);
  const fade = m => new M.FadeIn(m, { runTime: 0.45 });
  const out = m => new M.FadeOut(m, { runTime: 0.35 });
  const draw = m => new M.Create(m, { runTime: 0.55 });
  const mark = (m, color = orange) => new M.Indicate(m, { color, runTime: 0.8 });
  const cascade = animations => new M.LaggedStart(animations, { lagRatio: 0.15, runTime: 1.2 });

  // Each slot owns one independently animated screen element.
  const slots = new Map();
  function replace(slot, next) {
    const previous = slots.get(slot);
    slots.delete(slot);
    if (next) slots.set(slot, next);
    return [...(previous ? [out(previous)] : []), ...(next ? [fade(next)] : [])];
  }

  function fbox(rows, color = blue) {
    const size = P ? 23 : 21, lh = P ? 0.42 : 0.36;
    const labels = rows.map(row => Array.isArray(row) ? T(row[0], size, row[1], true) : T(row, size, C.ink, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.65;
    const height = rows.length * lh + 0.28;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    labels.forEach((label, i) => label.moveTo([
      BOXP[0] - width / 2 + 0.325 + label.getWidth() / 2,
      BOXP[1] + ((labels.length - 1) / 2 - i) * lh, 0,
    ]));
    const box = new M.VGroup(frame, ...labels);
    const maxWidth = P ? FW - 0.85 : 5.55;
    if (width > maxWidth) box.scale(maxWidth / width);
    box.moveTo(BOXP);
    return replace('box', box);
  }

  const gridParts = [];
  for (let x = 0; x <= 10; x++) {
    gridParts.push(line(point([x, 0]), point([x, 7]), x ? C.grid : C.muted, x ? 1 : 2));
    if (x % 2 === 0) gridParts.push(text(x, GX + x * U, BASE - (P ? 0.27 : 0.23), C.muted, P ? 21 : 16));
  }
  for (let y = 0; y <= 7; y++) {
    gridParts.push(line(point([0, y]), point([10, y]), y ? C.grid : C.muted, y ? 1 : 2));
    if (y > 0 && y < 7) gridParts.push(text(y, GX - (P ? 0.27 : 0.24), BASE + y * U, C.muted, P ? 21 : 16));
  }
  gridParts.push(text('Returns ↑', GX + 0.8, BASE + 7 * U + 0.22, C.ink, P ? 20 : 17),
    text('Departures →', GX + 5 * U, BASE - 0.52, C.ink, P ? 20 : 17));
  const grid = new M.VGroup(...gridParts);

  function station(i, color) {
    const p = point(stations[i]);
    const halo = new M.Dot({ point: p, radius: 0.155, color });
    halo.setFill(color, 0.19);
    const dot = new M.Dot({ point: p, radius: 0.082, color });
    dot.setFill(color, 1);
    return new M.VGroup(halo, dot, text(letter(i), p[0] - 0.21, p[1] + 0.24, C.ink, P ? 22 : 20));
  }

  const dots = stations.map((_, i) => station(i, i < 3 ? blue : orange));
  let dotColors = stations.map((_, i) => i < 3 ? blue : orange);
  function recolor(groups) {
    const colors = stations.map((_, i) => groups ? groups[i] === 0 ? blue : orange : C.ink);
    const animations = colors.flatMap((color, i) => color === dotColors[i] ? [] :
      [new M.Transform(dots[i], station(i, color), { runTime: 0.55 })]);
    dotColors = colors;
    return animations;
  }

  function diamond(coords, color) {
    const [x, y] = point(coords), r = 0.21;
    const corners = [[x, y + r, 0], [x + r, y, 0], [x, y - r, 0], [x - r, y, 0]];
    return new M.VGroup(...corners.map((p, i) => line(p, corners[(i + 1) % 4], color, 3)));
  }
  const centres = [diamond([2, 2], blue), diamond([8, 3], orange)];
  const colors = [blue, orange];
  const moveCentre = (i, coords) => new M.Transform(centres[i], diamond(coords, colors[i]), { runTime: 0.85 });
  function placeCentres(positions) {
    positions.forEach((coords, i) => centres[i].moveTo(point(coords)));
    return centres.map(fade);
  }

  function links(pairs) {
    const segments = [];
    for (const [i, target, color] of pairs) {
      const [x, y] = point(stations[i]), [tx, ty] = point(target);
      const length = Math.hypot(tx - x, ty - y);
      if (length < 0.34) continue;
      const dx = (tx - x) / length, dy = (ty - y) / length;
      const segment = new M.DashedLine({
        start: [x + dx * 0.14, y + dy * 0.14, -0.01],
        end: [tx - dx * 0.22, ty - dy * 0.22, -0.01],
        color, strokeWidth: 2,
      });
      segment.setStrokeOpacity(0.6);
      segments.push(segment);
    }
    return replace('links', segments.length ? new M.VGroup(...segments) : null);
  }
  const assigned = (groups, positions) => links(groups.map((g, i) => [i, positions[g], colors[g]]));
  const compare = (indices, positions) => links(indices.flatMap(i => positions.map((c, j) => [i, c, colors[j]])));
  const clearLinks = () => replace('links', null);
  const ping = (i, color) => new M.Flash(dots[i].submobjects[1], {
    color, flashRadius: 0.16, lineLength: 0.11, runTime: 0.7,
  });

  function flags(indices) {
    const parts = indices.flatMap((i, j) => {
      const [x, y] = point(stations[i]), color = colors[j];
      const foot = [x + 0.11, y + 0.04, 0], top = [x + 0.11, y + 0.36, 0];
      const tip = [x + 0.37, y + 0.28, 0], fold = [x + 0.11, y + 0.21, 0];
      return [line(foot, top, color), line(top, tip, color), line(tip, fold, color)];
    });
    return replace('flags', new M.VGroup(...parts));
  }

  function chartGeometry(cx, base, width, height) {
    const left = cx - width / 2, right = cx + width / 2;
    return {
      left, right, base, height,
      p: (round, error) => [left + width * round / 4, base + height * error / 140, 0],
    };
  }

  function axes(g, title, color, small = false) {
    const size = small ? (P ? 20 : 17) : (P ? 20 : 18);
    const parts = [line(g.p(0, 0), g.p(0, 140), C.muted),
      text(title, (g.left + g.right) / 2, g.base + g.height + 0.24, color, size)];
    for (const value of [0, 70, 140]) {
      parts.push(line(g.p(0, value), g.p(4, value), value === 0 ? C.muted : C.grid, 1));
      parts.push(text(value, g.left - 0.32, g.p(0, value)[1], C.muted, size));
    }
    for (let round = 0; round <= 4; round++) {
      parts.push(text(round, g.p(round, 0)[0], g.base - 0.18, C.muted, size));
    }
    return new M.VGroup(...parts);
  }

  function sample(g, values, round, color) {
    const p = g.p(round, values[round]);
    const dot = new M.Dot({ point: p, radius: 0.064, color });
    dot.setFill(color, 1);
    return round ? new M.VGroup(line(g.p(round - 1, values[round - 1]), p, color, 3), dot) : dot;
  }

  // laptop: keep the small chart well below the slide title
  const live = chartGeometry(P ? -1.35 : 3.95, P ? -0.3 : 0.25, P ? 3.4 : 4.1, P ? 1.55 : 1.25);
  let liveParts = [];
  function startCurve(values, color) {
    liveParts = [axes(live, 'INERTIA BY ROUND', color, true), sample(live, values, 0, color)];
    return liveParts.map(fade);
  }
  function extendCurve(values, round, color) {
    const part = sample(live, values, round, color);
    liveParts.push(part);
    return draw(part);
  }
  function clearCurve() {
    const animations = liveParts.map(out);
    liveParts = [];
    return animations;
  }

  function result(cx, y, name, groups, error, color) {
    const parts = [text(name, cx, y + 0.48, color, P ? 21 : 19), text(`Inertia ${error}`, cx, y - 0.42, C.ink, P ? 21 : 19)];
    const order = groups.flatMap((ids, g) => [...ids].map(id => [id, colors[g]]));
    order.forEach(([id, fill], i) => {
      const x = cx + (i - 2.5) * (P ? 0.46 : 0.38) + (i < groups[0].length ? -0.08 : 0.08);
      const d = new M.Dot({ point: [x, y, 0], radius: P ? 0.21 : 0.16, color: fill });
      d.setFill(fill, 0.33);
      parts.push(d, text(id, x, y, C.ink, P ? 20 : 17));
    });
    return new M.VGroup(...parts);
  }

  const a = [[1, 1], [2, 2]], b = [[1, 1], [5.8, 2.8]];
  const c = [[1.5, 1.5], [6.75, 3]], d = [[2, 2], [8, 3]];
  const e = [[7, 1], [9, 6]], f = [[4.2, 1.8], [9, 6]];
  const aOnly = [0, 1, 1, 1, 1, 1], ab = [0, 0, 1, 1, 1, 1];
  const abc = [0, 0, 0, 1, 1, 1], abcde = [0, 0, 0, 0, 0, 1];

  // 0–9: the finished picture, then two possible starts on the same grid.
  await until(S(0)); await play(fade(grid), cascade(dots.map(fade)));
  await until(S(1)); await play(...centres.map(fade), ...say('CENTRES HAVE STOPPED', C.green),
    ...fbox(['The centres stopped moving.', 'Every station has a group.'], C.green));
  await until(S(2)); await play(...say('ARE THESE THE GROUPS TO KEEP?', orange));
  await until(S(3)); await play(...centres.map(out), ...recolor(null), ...say('SAME SIX STATIONS'));
  await until(S(4)); await play(...say('TWO RUNS · TWO GROUPS EACH'), ...fbox(['Run 1 and run 2', 'Two groups each time']));
  await until(S(5)); await play(...say('CHANGE ONLY THE STARTING CENTRES'),
    ...fbox(['Same six stations', ['Only the start changes', orange]], orange));
  await until(S(6)); await play(...flags([0, 1]), ...say('TWO MEETING FLAGS'));
  await until(S(7)); await play(...flags([3, 5]), ...say('DIFFERENT PLACES, DIFFERENT NEAREST FLAGS'));
  await until(S(8)); await play(...say('INITIALIZATION = CHOOSING WHERE TO START', C.green),
    ...fbox(['Initialization =', 'choosing where the centres start'], C.green));
  await until(S(9)); await play(...replace('flags', null), ...placeCentres(a), ...say('RUN 1 · START AT A AND B'));

  // 10–28: run one, including the assignment and the two centre updates.
  await until(S(10)); await play(...assigned(aOnly, a), cascade(recolor(aOnly)));
  await until(S(11)); await play(...fbox([['Blue     A', blue], ['Orange   B C D E F', orange]]));
  await until(S(12)); await play(...fbox(['Squared distances, A to F', '0 + 0 + 2 + 26 + 36 + 65']));
  await until(S(13)); await play(...say('INERTIA = TOTAL SQUARED DISTANCE', C.green));
  await until(S(14)); await play(...fbox([['Starting inertia = 129', blue]]), ...startCurve(first, blue));
  await until(S(15)); await play(...clearLinks(), mark(centres[0], blue), ...say('RUN 1 · ROUND 1'),
    ...fbox([['Blue stays at (1, 1)', blue]]));
  await until(S(16)); await play(moveCentre(1, b[1]), ...fbox(['Departures: 29 ÷ 5 = 5.8', 'Returns:    14 ÷ 5 = 2.8'], orange));
  await until(S(17)); await play(extendCurve(first, 1, blue), ...fbox(['Inertia', ['129 → 53.6', blue]]));
  await until(S(18)); await play(...compare([1], b), ...recolor(ab), ping(1, blue), ...say('RUN 1 · ROUND 2'),
    ...fbox(['B switches to blue', 'Squared distances', 'Blue 2   Orange 15.08']));
  await until(S(19)); await play(...fbox([['Blue     A B', blue], ['Orange   C D E F', orange]]));
  await until(S(20)); await play(...clearLinks(), moveCentre(0, c[0]), ...fbox([['Blue → (1.5, 1.5)', blue]]));
  await until(S(21)); await play(moveCentre(1, c[1]), ...fbox([['Orange → (6.75, 3)', orange]], orange));
  await until(S(22)); await play(extendCurve(first, 2, blue), ...fbox(['Inertia', ['53.6 → 35.75', blue]]));
  await until(S(23)); await play(...compare([2], c), ...recolor(abc), ping(2, blue), ...say('RUN 1 · ROUND 3'),
    ...fbox(['C switches to blue', ['Blue     A B C', blue], ['Orange   D E F', orange]]));
  await until(S(24)); await play(...clearLinks(), moveCentre(0, d[0]), ...fbox([['Blue → (2, 2)', blue]]));
  await until(S(25)); await play(moveCentre(1, d[1]), ...fbox([['Orange → (8, 3)', orange]], orange));
  await until(S(26)); await play(extendCurve(first, 3, blue), ...fbox(['Inertia', ['35.75 → 20', blue]]));
  await until(S(27)); await play(extendCurve(first, 4, blue), ...say('ROUND 4 · NO CHANGE', C.green),
    ...fbox(['Centres and groups stay', ['Inertia = 20', blue]]));
  await until(S(28)); await play(...replace('box', null),
    ...replace('saved', result(P ? 2.05 : 3.95, P ? 0.25 : -2.55, 'RUN 1 SAVED', ['ABC', 'DEF'], 20, blue)));

  // 29–42: keep the stations fixed and run again from D and F.
  await until(S(29)); await play(...clearCurve(), ...centres.map(out), ...recolor(null), ...say('SAME STATIONS, NEW START'));
  await until(S(30)); await play(...placeCentres(e), ...say('RUN 2 · START AT D AND F', orange));
  await until(S(31)); await play(...assigned(abcde, e), cascade(recolor(abcde)));
  await until(S(32)); await play(...fbox([['Blue     A B C D E', blue], ['Orange   F', orange]]));
  await until(S(33)); await play(...startCurve(second, orange),
    ...fbox(['Starting inertia', ['Run 2: 84', orange], ['Run 1: 129', blue]], orange));
  await until(S(34)); await play(...clearLinks(), ...say('RUN 2 · ROUND 1', orange),
    ...fbox(['Blue: A + B + C + D + E', 'Departures: 1+2+3+7+8 = 21', 'Returns:    1+2+3+1+2 = 9']));
  await until(S(35)); await play(...fbox(['Share among 5 stations', '21 ÷ 5 = 4.2', ' 9 ÷ 5 = 1.8']));
  await until(S(36)); await play(moveCentre(0, f[0]), ...fbox([['Blue → (4.2, 1.8)', blue]]));
  await until(S(37)); await play(mark(centres[1], orange), ping(5, orange),
    ...fbox(['F is alone', ['Orange stays at (9, 6)', orange]], orange));
  await until(S(38)); await play(extendCurve(second, 1, orange), ...fbox(['Inertia', ['84 → 41.6', orange]], orange));
  await until(S(39)); await play(...compare([0, 1, 2, 3, 4, 5], f), ...say('RUN 2 · ROUND 2', orange),
    ...fbox(['Compare both centres', 'for each station'], orange));
  await until(S(40)); await play(...assigned(abcde, f), ...fbox([['Blue     A B C D E', blue], ['Orange   F', orange]]));
  await until(S(41)); await play(...clearLinks(), extendCurve(second, 2, orange),
    ...fbox(['Both centres stay', ['Inertia = 41.6', orange]], orange));
  await until(S(42)); await play(...say('BOTH RUNS HAVE FINISHED', C.green), mark(slots.get('saved'), blue));

  // 43–53: compare group membership on two small grids, then compare the two curves on the same scale.
  function mini(cx, oy, u, groups, title, color) {
    const q = ([x, y]) => [cx - 5 * u + x * u, oy + y * u, 0];
    const parts = [];
    for (let x = 0; x <= 10; x += 2) parts.push(line(q([x, 0]), q([x, 7]), x ? C.grid : C.muted, x ? 1 : 2));
    for (let y = 0; y <= 7; y++) parts.push(line(q([0, y]), q([10, y]), y ? C.grid : C.muted, y ? 1 : 2));
    stations.forEach((s, i) => {
      const p = q(s), fill = colors[groups[i]];
      const halo = new M.Dot({ point: p, radius: 0.15, color: fill });
      halo.setFill(fill, 0.22);
      const dot = new M.Dot({ point: p, radius: 0.08, color: fill });
      dot.setFill(fill, 1);
      parts.push(halo, dot, text(letter(i), p[0] - 0.21, p[1] + 0.24, C.ink, P ? 21 : 19));
    });
    parts.push(text(title, cx, oy + 7 * u + 0.32, color, P ? 22 : 20));
    return parts;
  }
  const summaries = P
    ? [mini(0, -0.85, 0.6, abc, 'RUN 1 · A B C / D E F · inertia 20', blue),
      mini(0, -5.95, 0.6, abcde, 'RUN 2 · A B C D E / F · inertia 41.6', orange)]
    : [mini(-3.4, -2.75, 0.5, abc, 'RUN 1 · inertia 20', blue),
      mini(3.4, -2.75, 0.5, abcde, 'RUN 2 · inertia 41.6', orange)];
  if (P) sayAt = [0, 4.25, 0];
  await until(S(43)); await play(out(grid), ...dots.map(out), ...centres.map(out), ...clearCurve(),
    ...replace('saved', null), ...replace('box', null), ...summaries[0].map(fade), ...summaries[1].map(fade), ...say('TWO RUNS · TWO DIFFERENT GROUPINGS', C.green));
  await until(S(44)); await play(mark(summaries[1][summaries[1].length - 1], orange), ...say('RUN 2 · A B C D E  /  F', orange));

  const plots = P ? [chartGeometry(0.2, -0.8, 5.6, 2.45), chartGeometry(0.2, -5.1, 5.6, 2.45)]
    : [chartGeometry(-3.7, -3.1, 4.05, 2.55), chartGeometry(2.55, -3.1, 4.05, 2.55)];
  const curveParts = [first, second].map((values, j) => values.map((_, i) => sample(plots[j], values, i, colors[j])));
  const chartCaption = new M.VGroup(...plots.map(g => text('Round', (g.left + g.right) / 2, g.base - 0.5, C.muted, P ? 19 : 17)));
  function endpointLabels(atStart) {
    const labels = [first, second].map((values, j) => {
      const i = atStart ? 0 : values.length - 1, error = values[i];
      const [x, y] = plots[j].p(i, error);
      return text(error, x + (atStart ? 0.30 : 0), y + (atStart ? 0.16 : 0.26), colors[j], 19);
    });
    return replace(atStart ? 'start labels' : 'end labels', new M.VGroup(...labels));
  }

  BOXP = P ? [0, 3.6, 0] : [0, 0.95, 0];
  sayAt = P ? [0, 2.65, 0] : [0, 1.85, 0];
  await until(S(45)); await play(...summaries.flat().map(out), fade(chartCaption),
    fade(axes(plots[0], 'RUN 1 INERTIA', blue)), fade(axes(plots[1], 'RUN 2 INERTIA', orange)),
    ...curveParts.map(parts => cascade(parts.map(fade))), ...say('ERROR AFTER EACH ROUND'));
  await until(S(46)); await play(...endpointLabels(true), ...endpointLabels(false), ...say('RUN 2 STARTS LOWER, ENDS HIGHER', orange));
  await until(S(47)); await play(mark(slots.get('end labels'), C.green), ...say('FINAL INERTIA · 20 AND 41.6'));
  await until(S(48)); await play(...fbox(['Inertia = sum of squared distances', 'to assigned centres']));
  await until(S(49)); await play(mark(curveParts[0][4], C.green), ...say('SAME DATA AND K · PREFER LOWER FINAL INERTIA', C.green));

  await until(S(50)); await play(...fbox(['Try different starting stations', 'A + B     D + F     C + E']),
    ...say('TRY SEVERAL STARTS'));
  await until(S(51)); await play(...fbox(['Of the two runs shown', [`Keep A + B · final inertia ${first[4]}`, C.green]], C.green),
    mark(curveParts[0][4], C.green), ...say('KEEP THE SMALLEST FINAL INERTIA', C.green));
  await until(S(52)); await play(...fbox(['Other starts can give other groups', 'An untried start might score lower'], orange),
    ...say('SEVERAL STARTS GIVE NO GUARANTEE', orange));
  await until(S(53)); await play(...replace('box', null), ...say('COMPARE STARTS BEFORE CHOOSING GROUPS', C.green),
    mark(slots.get('end labels'), C.green));
}
