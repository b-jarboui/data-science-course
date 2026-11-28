// 14.1.1 Distance choices: what does similar mean?
// Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const stations = [
    ['A', 1, 1], ['B', 2, 2], ['C', 3, 3],
    ['D', 7, 1], ['E', 8, 2], ['F', 9, 6],
  ];
  const CX = P ? 0 : -3.05;
  const PILL = P ? [0, 1.05, 0] : [CX, 1.94, 0];
  const BOXP = P ? [0, 3.15, 0] : [4.05, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, x, y, size = 20, color = C.ink) =>
    T(text, size, color, true).moveTo([x, y, 0]);
  const line = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const fade = object => new M.FadeIn(object, { runTime: 0.45 });
  const out = (...objects) => objects.map(object => new M.FadeOut(object, { runTime: 0.4 }));
  const draw = object => new M.Create(object, { runTime: 0.6 });
  const pulse = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.75 });
  const reveal = objects => new M.LaggedStart(objects.map(fade), { lagRatio: 0.15, runTime: 1.1 });

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const previous = boxNow;
    boxNow = null;
    const animations = previous ? out(previous) : [];
    if (!lines.length) return animations;

    const size = P ? 25 : 22;
    const lh = P ? 0.5 : 0.44;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.65;
    const height = rows.length * lh + 0.36;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.18, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    texts.forEach((text, index) => {
      text.moveTo([
        BOXP[0] - width / 2 + 0.325 + text.getWidth() / 2,
        BOXP[1] + (rows.length - 1) * lh / 2 - index * lh,
        0,
      ]);
    });
    boxNow = new M.VGroup(frame, ...texts);
    const maxw = P ? FW - 1 : 4.65;
    if (width > maxw) boxNow.scale(maxw / width);
    return [...animations, fade(boxNow)];
  }

  // A city map with six bicycle station signs.
  const mapCenter = P ? -2.9 : -0.43;
  const mapX = P ? 2.1 : 1.68;
  const mapY = P ? 1.7 : 1.02;
  const mapPoints = stations.map((_, index) => [
    CX + (index % 3 - 1) * mapX,
    mapCenter + (index < 3 ? mapY : -mapY),
    0,
  ]);
  const roads = new M.VGroup(
    ...[0, 3].map(i => line(mapPoints[i], mapPoints[i + 2], C.grid, 5)),
    ...[0, 1, 2].map(i => line(mapPoints[i], mapPoints[i + 3], C.grid, 5)),
  );
  const signs = stations.map(([name], index) => {
    const [x, y] = mapPoints[index];
    const card = new M.RoundedRectangle({ width: 1.13, height: 0.89, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
    card.setFill(C.card, 1);
    card.moveTo([x, y, 0]);
    const q = (dx, dy) => [x + dx, y + dy, 0];
    const left = q(-0.25, -0.04);
    const right = q(0.25, -0.04);
    const wheels = [left, right].map(point =>
      new M.Circle({ radius: 0.12, color: C.cyan, strokeWidth: 2 }).moveTo(point));
    const seat = q(-0.13, 0.19);
    const crank = q(0.04, -0.04);
    const handle = q(0.15, 0.23);
    return new M.VGroup(card, ...wheels,
      line(left, seat, C.cyan), line(seat, crank, C.cyan), line(crank, left, C.cyan),
      line(seat, q(0.18, 0.15), C.cyan), line(q(0.18, 0.15), crank, C.cyan),
      line(handle, right, C.cyan), line(handle, q(0.27, 0.23), C.cyan),
      label(name, x, y - 0.29, 17)).scale(P ? 1.4 : 1);
  });

  await until(S(0)); await play(fade(roads), reveal(signs), ...say('CITY BICYCLE STATIONS'));
  await until(S(1)); await play(pulse(signs[0]), pulse(signs[1]), ...say('WHICH STATIONS ARE SIMILAR?', C.amber));
  await until(S(2)); await play(...say('COUNT FOR ONE MORNING HOUR'),
    ...fbox(['6 bicycle stations', 'Count bicycles leaving', 'Count bicycles returning']));

  // The plot uses the same scale on both axes.
  const ox = P ? -3.05 : -6.3;
  const oy = P ? -5.75 : -3.05;
  const unit = P ? 0.66 : 0.6;
  const point = (x, y) => [ox + x * unit, oy + y * unit, 0];
  const origin = point(0, 0);
  const gridParts = [];
  for (let x = 0; x <= 10; x++) {
    gridParts.push(line(point(x, 0), point(x, 7), x === 0 ? C.muted : C.grid));
    const [px, py] = point(x, 0);
    gridParts.push(label(String(x), px, py - (P ? 0.28 : 0.25), P ? 21 : 15, C.muted));
  }
  for (let y = 1; y <= 7; y++) {
    gridParts.push(line(point(0, y), point(10, y), C.grid));
    const [px, py] = point(0, y);
    gridParts.push(label(String(y), px - (P ? 0.3 : 0.26), py, P ? 21 : 15, C.muted));
  }
  gridParts.push(
    line(origin, point(10, 0)),
    label('Bicycles leaving →', point(5, 0)[0], oy - 0.68, P ? 22 : 18),
    label('↑ Bicycles returning', point(2, 7)[0], point(0, 7)[1] + 0.3, P ? 22 : 18),
  );
  const grid = new M.VGroup(...gridParts);
  const points = stations.map(([, x, y]) => point(x, y));
  const cores = points.map(p => new M.Dot({ point: p, radius: P ? 0.087 : 0.072, color: C.ink }));
  const dots = points.map((p, i) => {
    const halo = new M.Dot({ point: p, radius: P ? 0.16 : 0.14, color: C.ink });
    halo.setFill(C.ink, 0.15);
    return new M.VGroup(halo, cores[i], label(stations[i][0], p[0] - 0.2, p[1] + 0.25, P ? 23 : 18));
  });
  const string = (i, j, color = C.amber) => line(points[i], points[j], color, 3);

  await until(S(3)); await play(...out(roads, ...signs), fade(grid),
    ...fbox([]), ...say('LEAVING ACROSS · RETURNING UP'));
  const stationBeats = [S(4), S(5), S(6), S(7), S(8), S(9)];
  for (let i = 0; i < stations.length; i++) {
    await until(stationBeats[i]);
    const [name, leaving, returning] = stations[i];
    await play(fade(dots[i]), new M.Flash(cores[i], { color: C.ink, flashRadius: 0.15, lineLength: 0.09, runTime: 0.55 }),
      ...fbox([`Station ${name}`, `Leaving   ${leaving}`, `Returning ${returning}`]));
  }
  await until(S(10)); await play(...fbox(['Each dot shows one station', 'during the same hour.']), ...say('ONE DOT PER STATION'));
  await until(S(11)); await play(...fbox([]), ...say('WHAT DOES SIMILAR MEAN?', C.amber));
  const shortString = string(1, 2);
  const longString = string(2, 5, C.violet);
  const ad = string(0, 3);
  const ac = string(0, 2);
  await until(S(12)); await play(draw(shortString), ...say('STRETCH A STRING BETWEEN TWO DOTS'));
  await until(S(13)); await play(pulse(shortString), ...fbox([['B to C', C.amber], 'Short string · close counts'], C.amber));
  await until(S(14)); await play(draw(longString), ...fbox([['C to F', C.violet], 'Long string · far apart'], C.violet));
  await until(S(15)); await play(...fbox(['Euclidean distance', 'Length of the straight string']), ...say('EUCLIDEAN DISTANCE'));
  await until(S(16)); await play(...out(shortString, longString), draw(ad), ...fbox(['A and D', 'Both have 1 return']));
  const adTicks = new M.VGroup(...Array.from({ length: 7 }, (_, i) => {
    const [x, y] = point(1 + i, 1);
    return line([x, y - 0.1, 0], [x, y + 0.1, 0], C.amber, 2);
  }));
  await until(S(17)); await play(fade(adTicks), ...fbox(['7 − 1 = 6', ['A to D = 6 units', C.amber]], C.amber));
  await until(S(18)); await play(...out(ad, adTicks), draw(ac), ...fbox(['A to C', 'A diagonal string']), ...say('A TO C'));

  // Enlarge just A and C so the three squares stay clear of the station plot.
  const gx = P ? -0.75 : -3.78;
  const gy = P ? -3.3 : -0.73;
  const gUnit = P ? 0.95 : 0.45;
  const g = (x, y) => [gx + x * gUnit, gy + y * gUnit, 0];
  const hyp = line(g(0, 0), g(2, 2), C.amber, 4);
  const across = line(g(0, 0), g(2, 0), C.cyan, 3);
  const up = line(g(2, 0), g(2, 2), C.violet, 3);
  const triangleLabels = new M.VGroup(
    new M.Dot({ point: g(0, 0), radius: 0.07, color: C.ink }),
    new M.Dot({ point: g(2, 2), radius: 0.07, color: C.ink }),
    label('A', gx - 0.23, gy - 0.17, 19),
    label('C', gx + 2 * gUnit + 0.23, gy + 2 * gUnit + 0.19, 19),
  );
  const tile = (vertices, color, fill = 0) => {
    const polygon = new M.Polygon({ vertices: vertices.map(([x, y]) => g(x, y)), color, strokeWidth: 2 });
    polygon.setFill(color, fill);
    return polygon;
  };
  const corners = (x, y, size = 1) => [[x, y], [x + size, y], [x + size, y + size], [x, y + size]];
  const legSquares = new M.VGroup(
    tile(corners(0, -2, 2), C.cyan),
    tile(corners(2, 0, 2), C.violet),
  );
  const legTiles = [0, 1, 2, 3].map(i => tile(corners(i % 2, -2 + Math.floor(i / 2)), C.cyan, 0.22))
    .concat([0, 1, 2, 3].map(i => tile(corners(2 + i % 2, Math.floor(i / 2)), C.violet, 0.22)));
  const diagonalSquare = tile([[0, 0], [2, 2], [0, 4], [-2, 2]], C.amber);
  const diagonalTiles = [];
  for (let x = -2; x < 2; x++) {
    for (let y = 0; y < 4; y++) {
      const inside = corners(x, y).filter(([px, py]) => Math.abs(px) + Math.abs(py - 2) <= 2);
      if (inside.length >= 3) diagonalTiles.push(tile(inside, C.amber, inside.length === 4 ? 0.26 : 0.12));
    }
  }

  await until(S(19)); await play(...out(grid, ...dots, ac), fade(hyp), fade(triangleLabels), draw(across), draw(up),
    ...fbox([['2 across', C.cyan], ['2 up', C.violet]]));
  await until(S(20)); await play(draw(legSquares), ...say('A SQUARE ON EACH MOVEMENT'));
  await until(S(21)); await play(reveal(legTiles), ...fbox([['2 × 2 = 4', C.cyan], ['2 × 2 = 4', C.violet]]));
  await until(S(22)); await play(...fbox([['4 + 4 = 8 small squares', C.amber]], C.amber));
  await until(S(23)); await play(draw(diagonalSquare), reveal(diagonalTiles),
    ...fbox(['Diagonal square', '4 whole + 8 halves', ['Area = 8', C.amber]], C.amber));
  await until(S(24)); await play(pulse(hyp), ...fbox(['Which side length works?', ['side × side = 8', C.amber]], C.amber));
  await until(S(25)); await play(...say('TAKE THE SQUARE ROOT', C.amber),
    ...fbox(['side × side = 8', ['side = √8', C.amber]], C.amber));
  await until(S(26)); await play(...fbox([['√8 ≈ 2.83', C.amber]], C.amber));
  await until(S(27)); await play(...out(hyp, triangleLabels, across, up, legSquares, ...legTiles, diagonalSquare, ...diagonalTiles),
    fade(grid), ...dots.map(fade), draw(ac), ...fbox([['A to C ≈ 2.83 units', C.amber]], C.amber));
  await until(S(28)); await play(...say('EUCLIDEAN DISTANCE'),
    ...fbox(['distance = √(across² + up²)', 'across = difference in leaving', 'up = difference in returning']));
  await until(S(29)); await play(...fbox(['distance = √(2² + 2²)', '2² means 2 × 2', ['√(4 + 4) = √8', C.amber]]));

  // Draw arrowheads just short of the dots so each station stays visible.
  function ray(index, color = C.muted, width = 2) {
    const [x, y] = points[index];
    const length = Math.hypot(x - ox, y - oy);
    const ux = (x - ox) / length;
    const uy = (y - oy) / length;
    const tip = [x - ux * 0.11, y - uy * 0.11, 0];
    const wing = side => [
      tip[0] - ux * 0.16 - side * uy * 0.075,
      tip[1] - uy * 0.16 + side * ux * 0.075,
      0,
    ];
    return new M.VGroup(line(origin, tip, color, width), line(wing(-1), tip, color, width), line(tip, wing(1), color, width));
  }
  function angleMark(i, j, radius, color) {
    const angle = index => Math.atan2(stations[index][2], stations[index][1]);
    const a = angle(i);
    const b = angle(j);
    const p = step => {
      const theta = a + (b - a) * step / 12;
      return [ox + radius * Math.cos(theta), oy + radius * Math.sin(theta), 0];
    };
    return new M.VGroup(...Array.from({ length: 12 }, (_, step) => line(p(step), p(step + 1), color, 3)));
  }

  const rays = stations.map((_, i) => ray(i));
  const equalRays = [ray(2, C.cyan, 3), ray(1, C.cyan, 3), ray(0, C.cyan, 3)];
  const aRay = ray(0, C.cyan, 3);
  const dRay = ray(3, C.amber, 3);
  const adAngle = angleMark(3, 0, unit * 1.05, C.violet);

  await until(S(30)); await play(...out(ac), ...fbox([]), ...say('WHAT ABOUT THE BALANCE?', C.amber));
  await until(S(31)); await play(reveal(rays), ...say('ARROWS FROM ZERO'));
  await until(S(32)); await play(...out(rays[0], rays[1], rays[2]), reveal(equalRays),
    ...fbox(['A, B and C', 'Different lengths', ['Same direction', C.cyan]]));
  await until(S(33)); await play(...fbox(['     Leaving  Returning', 'A       1         1', 'B       2         2', 'C       3         3']));
  await until(S(34)); await play(...out(rays[3]), fade(dRay), pulse(dots[3]), ...fbox(['Station D', ['7 leave · 1 returns', C.amber]], C.amber));
  await until(S(35)); await play(fade(adAngle), ...fbox(['A and D', ['Different directions', C.violet]], C.violet));
  await until(S(36)); await play(...say('COMPARE THE DIRECTIONS'), ...fbox(['Compare where arrows point', 'Use their direction']));
  await until(S(37)); await play(...say('COSINE DISTANCE', C.violet), ...fbox(['Cosine distance', 'Difference in direction'], C.violet));
  await until(S(38)); await play(...out(dRay, adAngle), pulse(equalRays[0], C.cyan),
    ...fbox(['A, B and C', 'Same direction', ['Cosine distance = 0', C.cyan]]));
  await until(S(39)); await play(...out(...equalRays, rays[4], rays[5]), fade(aRay), fade(dRay), fade(adAngle),
    ...say('COSINE DISTANCE FROM A TO D', C.violet), ...fbox(['     Leaving  Returning', 'A       1         1', 'D       7         1'], C.violet));
  await until(S(40)); await play(...fbox(['Leaving', ['1 × 7 = 7', C.cyan]], C.cyan));
  await until(S(41)); await play(...fbox([['Leaving:   1 × 7 = 7', C.cyan], ['Returning: 1 × 1 = 1', C.violet]], C.violet));
  await until(S(42)); await play(...fbox(['Add the two products', ['7 + 1 = 8', C.amber]], C.amber));
  await until(S(43)); await play(pulse(aRay, C.cyan), pulse(dRay),
    ...fbox([['A: √(1² + 1²) = √2', C.cyan], ['D: √(7² + 1²) = √50', C.amber]]));
  await until(S(44)); await play(...fbox(['Multiply the lengths', ['√2 × √50 = √100 = 10', C.amber]], C.amber));
  await until(S(45)); await play(...fbox(['Direction agreement', ['8 ÷ 10 = 0.8', C.violet]], C.violet));
  await until(S(46)); await play(...fbox(['Cosine distance', ['1 − 0.8 = 0.20', C.violet]], C.violet));
  await until(S(47)); await play(...fbox(['cosine distance = 1 − (sum ÷ product)', 'sum = matching products added', 'product = arrow lengths multiplied'], C.violet));

  // The same candidates win under different rules.
  const ce = string(2, 4, C.amber);
  const cf = string(2, 5, C.violet);
  const cRay = ray(2, C.cyan, 3);
  const eRay = ray(4, C.amber, 3);
  const fRay = ray(5, C.violet, 3);
  const ceAngle = angleMark(4, 2, unit * 1.65, C.amber);
  const cfAngle = angleMark(5, 2, unit * 2.35, C.violet);
  const positionRows = ['Euclidean distance', ['C to E ≈ 5.10', C.amber], ['C to F ≈ 6.71', C.violet]];
  const directionRows = ['Cosine distance', ['C to E ≈ 0.143', C.amber], ['C to F ≈ 0.019', C.violet]];

  await until(S(48)); await play(...out(aRay, dRay, adAngle), draw(ce), draw(cf), ...fbox([]), ...say('STRINGS FROM C TO E AND F'));
  await until(S(49)); await play(pulse(ce), ...fbox(positionRows, C.amber), ...say('E IS CLOSER IN POSITION', C.amber));
  await until(S(49) + 2.55);
  await play(...out(ce, cf), fade(cRay), fade(eRay), fade(fRay), fade(ceAngle), fade(cfAngle),
    ...fbox(directionRows, C.violet), ...say('F IS CLOSER IN DIRECTION', C.violet));
  await until(S(50)); await play(...out(cRay, eRay, fRay, ceAngle, cfAngle), draw(ce), draw(cf),
    ...fbox(positionRows, C.amber), ...say('EUCLIDEAN: SIMILAR COUNTS', C.amber));
  await until(S(51)); await play(...out(ce, cf), fade(cRay), fade(eRay), fade(fRay), fade(ceAngle), fade(cfAngle),
    ...fbox(directionRows, C.violet), ...say('COSINE: SIMILAR BALANCE', C.violet));

  const zero = new M.Circle({ radius: 0.16, color: C.pink, strokeWidth: 3 }).moveTo(origin);
  await until(S(52)); await play(...out(eRay, fRay, ceAngle, cfAngle), fade(aRay),
    ...fbox(['A: 1 leaves, 1 returns', 'C: 3 leave, 3 return', ['Same balance → distance 0', C.violet]], C.violet),
    ...say('LOWER AND HIGHER ACTIVITY'));
  await until(S(53)); await play(...out(aRay, cRay), fade(zero),
    ...fbox(['0 leave · 0 return', 'Arrow length = 0', ['No direction to compare', C.pink]], C.pink),
    ...say('COSINE NEEDS TWO DIRECTIONS', C.pink));
  await until(S(54)); await play(...out(zero), draw(ce), draw(cf),
    ...fbox([['Euclidean: dot position', C.amber], ['Cosine: arrow direction', C.violet]]),
    ...say('EUCLIDEAN COMPARES POSITIONS', C.amber));
  await until(S(54) + 3.1);
  await play(...out(ce, cf), fade(cRay), fade(eRay), fade(fRay), fade(ceAngle), fade(cfAngle),
    ...say('COSINE COMPARES DIRECTIONS', C.violet));
}
