// 21.3.2 Image–text alignment. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const Y = P ? -0.25 : -0.4;
  const R = P ? 1.65 : 1.4;
  const ORANGE = '#fb923c';
  const colors = [C.cyan, C.amber, C.green, C.violet];
  const names = ['Library crop', 'the library', 'the lab building', 'the pond'];
  const vectors = [[0.8, 0.6], [0.6, 0.8], [1, 0], [-0.6, 0.8]];
  const scores = ['0.96', '0.8', '0'];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const pt = (x, y) => [x, y, 0];
  const group = (...parts) => new M.VGroup(...parts.flat());
  const line = (a, b, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: a, end: b, color, strokeWidth });
  const dashed = (a, b, color) => new M.DashedLine({ start: a, end: b, color, strokeWidth: 2 });

  function label(text, size, color, x, y, maxWidth = 6.8, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    const width = t.getWidth();
    if (width > maxWidth) t.scale(maxWidth / width);
    t.moveTo(pt(x, y));
    return t;
  }

  function rect(width, height, x, y, color, fill = 0, rounded = false) {
    const Shape = rounded ? M.RoundedRectangle : M.Rectangle;
    const r = new Shape({ width, height, color, strokeWidth: 2, ...(rounded ? { cornerRadius: 0.13 } : {}) });
    if (fill) r.setFill(color, fill);
    r.moveTo(pt(x, y));
    return r;
  }

  function dot(x, y, color, radius = 0.055) {
    const d = new M.Dot({ radius, color });
    d.setFill(color, 1);
    d.moveTo(pt(x, y));
    return d;
  }

  function arrow(a, b, color, width = 4, tip = 0.19, useDashes = false) {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const wing = offset => pt(b[0] - tip * Math.cos(angle + offset), b[1] - tip * Math.sin(angle + offset));
    return group(useDashes ? dashed(a, b, color) : line(a, b, color, width),
      line(b, wing(-0.55), color, width), line(b, wing(0.55), color, width));
  }

  let pictureNow = null, boxNow = null;
  const enter = m => new M.FadeIn(m, { runTime: 0.34 });
  const leave = m => new M.FadeOut(m, { runTime: 0.34 });

  function picture(next) {
    const changes = pictureNow ? [leave(pictureNow)] : [];
    if (next) changes.push(enter(next));
    pictureNow = next;
    return changes;
  }

  function fbox(lines, color = C.cyan) {
    const changes = boxNow ? [leave(boxNow)] : [];
    boxNow = null;
    if (!lines) return changes;
    const lh = P ? 0.38 : 0.42;
    const maxWidth = P ? FW - 1.2 : 4;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([text, ink]) =>
      label(text, P ? 22 : 21, ink, 0, 0, maxWidth - 0.54, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.54;
    const height = rows.length * lh + 0.24;
    const frame = rect(width, height, BOXP[0], BOXP[1], color, 0, true);
    frame.setFill(C.card, 0.96);
    texts.forEach((t, i) => {
      t.moveTo(pt(BOXP[0] - width / 2 + 0.27 + t.getWidth() / 2,
        BOXP[1] + ((rows.length - 1) / 2 - i) * lh));
    });
    boxNow = group(frame, texts);
    changes.push(enter(boxNow));
    return changes;
  }

  const buildings = [
    ['Pond', C.violet], ['Library', C.cyan], ['Lab building', C.green],
    ['Cafeteria', ORANGE], ['Main gate', C.ink], ['Sports hall', C.pink],
  ];

  function landmark(i, x, y, side, showName = true) {
    const [name, color] = buildings[i];
    const cy = y + 0.14 * side;
    let shape;
    if (i === 0) {
      shape = new M.Circle({ radius: side * 0.22, color });
      shape.setFill(color, 0.63);
      shape.moveTo(pt(x, cy));
    } else if (i === 4) {
      shape = group([-1, 1].map(sign =>
        rect(side * 0.055, side * 0.19, x + sign * side * 0.13, y - side * 0.405, color, 0.82)));
    } else {
      shape = rect(side * 0.54, side * 0.33, x, cy, color, 0.62, i === 5);
    }
    return group(shape, showName ? [label(name, 18, C.ink, x, y - side * 0.2, side * 0.91)] : []);
  }

  function campus(topOnly = false) {
    const side = topOnly ? 1.51 : 1.42;
    const mapY = Y + (topOnly ? 0.2 : 0);
    const tiles = buildings.slice(0, topOnly ? 3 : 6).map(([name, color], i) => {
      const x = CX + (i % 3 - 1) * side;
      const y = mapY + (topOnly ? 0 : (i < 3 ? 0.5 : -0.5) * side);
      return group(rect(side, side, x, y, i === 1 ? C.cyan : C.grid, 0.2),
        landmark(i, x, y, side, false));
    });
    const start = mapY - side, end = start + 1.5 * side;
    const route = [];
    const labels = buildings.slice(0, tiles.length).map(([name, color], i) =>
      label(name, 18, C.ink, CX + (i % 3 - 1) * side,
        mapY + (topOnly ? -0.72 : (i < 3 ? 0.5 : -0.5) * side - 0.2 * side), side * 0.91));
    return group(tiles, route, labels);
  }

  function crop(x, y, side) {
    return group(rect(side, side, x, y, C.cyan, 0.13), landmark(1, x, y, side),
      line(pt(x, y - side / 2), pt(x, y), C.amber, 3));
  }

  function captionRows(x, y, highlight = -1) {
    return group(names.slice(1).map((name, i) => {
      const color = colors[i + 1], rowY = y - 0.52 * i;
      return group(rect(2.75, 0.43, x, rowY, color, i === highlight ? 0.3 : 0.08, true),
        label(`“${name}”`, 20, color, x, rowY, 2.45));
    }));
  }

  function inputs(mode = 'captions') {
    const x = CX - 1.62, y = Y + 0.12;
    if (mode === 'crop') return crop(CX, Y, 2.15);
    if (mode === 'pixels') {
      const paint = [
        [C.grid, C.grid, C.grid, C.grid, C.grid],
        [C.grid, C.cyan, C.cyan, C.cyan, C.grid],
        [C.grid, C.cyan, C.cyan, C.cyan, C.grid],
        [C.grid, C.grid, C.amber, C.grid, C.grid],
        [C.grid, C.grid, C.amber, C.grid, C.grid],
      ];
      const pixels = paint.map((row, j) => row.map((color, i) =>
        rect(0.28, 0.28, x + (i - 2) * 0.31, y + (2 - j) * 0.31, color, 0.56)));
      return group(pixels.flat(),
        label('pixels', 20, C.cyan, x, y - 1.05),
        rect(1.8, 0.65, CX + 1.6, y, C.amber, 0.12, true),
        label('the   library', 23, C.amber, CX + 1.6, y, 1.55),
        label('words', 20, C.amber, CX + 1.6, y - 1.05));
    }
    return group(crop(x, y, 1.65), captionRows(CX + 1.25, y + 0.52, mode === 'match' ? 0 : -1));
  }

  function encoders(mode) {
    const yp = Y + 0.65, yt = Y - 0.55;
    const x1 = CX - 2.02, x2 = CX - 0.18, x3 = CX + 1.95;
    const rows = [];
    if (mode !== 'text') rows.push(
      crop(x1, yp, 0.92),
      arrow(pt(x1 + 0.52, yp), pt(x2 - 0.78, yp), C.cyan, 2, 0.11),
      rect(1.46, 0.53, x2, yp, C.cyan, 0.14, true),
      label('Image encoder', 18, C.cyan, x2, yp, 1.29),
    );
    if (mode !== 'image') rows.push(
      ...['the library', 'the lab building', 'the pond'].map((name, i) =>
        label(name, 17, colors[i + 1], x1, yt + (1 - i) * 0.27, 1.4)),
      arrow(pt(x1 + 0.73, yt), pt(x2 - 0.78, yt), C.amber, 2, 0.11),
      rect(1.46, 0.53, x2, yt, C.amber, 0.14, true),
      label('Text encoder', 18, C.amber, x2, yt, 1.29),
    );
    if (mode === 'shared') {
      rows.push(rect(1.57, 2.12, x3, Y + 0.03, C.grid, 0.17),
        arrow(pt(x2 + 0.76, yp), pt(x3 - 0.81, yp), C.cyan, 2, 0.11),
        arrow(pt(x2 + 0.76, yt), pt(x3 - 0.81, yt), C.amber, 2, 0.11));
    }
    const origin = y => pt(x3 + (mode === 'shared' ? -0.08 : -0.34), y);
    const mini = (p, k) => arrow(p,
      pt(p[0] + vectors[k][0] * 0.63, p[1] + vectors[k][1] * 0.63), colors[k], 3, 0.13);
    if (mode === 'shared') rows.push(...vectors.map((_, i) => mini(origin(Y - 0.28), i)));
    if (mode === 'image') rows.push(mini(origin(yp - 0.23), 0));
    if (mode === 'text') rows.push(...[1, 2, 3].map((k, i) => mini(pt(x3 - 0.68 + 0.59 * i, yt - 0.26), k)));
    return group(rows);
  }

  const onBoard = (x, y) => pt(CX + x * R, Y + y * R);
  const origin = onBoard(0, 0);
  const angleOf = ([x, y]) => Math.atan2(y, x);
  const unit = angle => [Math.cos(angle), Math.sin(angle)];
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const cropAngle = angleOf(vectors[0]);
  const active = n => Array.from({ length: n }, (_, i) => i);

  function arc(from, to, radius, color) {
    const gap = wrap(to - from);
    const p = i => onBoard(...unit(from + gap * i / 18).map(v => v * radius));
    return group(Array.from({ length: 18 }, (_, i) => line(p(i), p(i + 1), color, 2.5)));
  }

  function board({
    dirs = vectors, ids = [], guide = true, legend = true, focus = -1,
    components = false, negative = false, unitMark = false, angles = [], corner = false,
    same = false,
  } = {}) {
    const circle = new M.Circle({ radius: R, color: C.grid, strokeWidth: 2 });
    circle.moveTo(origin);
    const parts = [
      line(onBoard(-1.15, 0), onBoard(1.15, 0), C.grid),
      line(onBoard(0, -1.08), onBoard(0, 1.08), C.grid),
    ];
    if (guide) parts.push(circle);
    if (components || negative || unitMark) {
      const [x, y] = dirs[ids[0]];
      parts.push(dashed(origin, onBoard(x, 0), C.amber));
      if (y) parts.push(dashed(onBoard(x, 0), onBoard(x, y), C.green));
      if (components) {
        parts.push(label('0.8 right', 19, C.amber, CX + 0.56, Y - 0.19, 1.22));
        parts.push(label('0.6 up', 19, C.green, CX + x * R + 0.52, Y + y * R / 2, 1.03));
      }
      if (negative) parts.push(label('−0.6', 20, C.violet, CX - 0.61, Y - 0.19, 1.05, true));
      if (unitMark) parts.push(label('1', 22, C.amber, CX + R * x / 2, Y + 0.2, 0.6, true));
    }
    for (const [i, radius] of angles) {
      parts.push(arc(angleOf(dirs[0]), angleOf(dirs[i]), radius, colors[i]));
    }
    if (corner) {
      const [ax, ay] = vectors[0], [bx, by] = vectors[3], d = 0.2;
      const a = onBoard(d * ax, d * ay);
      const b = onBoard(d * bx, d * by);
      const c = onBoard(d * (ax + bx), d * (ay + by));
      parts.push(line(a, c, C.ink, 3), line(c, b, C.ink, 3));
    }
    for (const i of ids) {
      const col = colors[i];
      const width = i === 0 || i === focus ? 5 : 3;
      parts.push(arrow(origin, onBoard(...dirs[i]), col, width, i === 0 ? 0.22 : 0.17, same && i === 1));
    }
    parts.push(dot(CX, Y, C.ink));
    if (legend) ids.forEach(i => {
      const x = CX + (i % 2 ? 1.48 : -1.48);
      const y = (P ? -2.23 : -2.11) - 0.42 * Math.floor(i / 2);
      const color = colors[i];
      parts.push(line(pt(x - 1.06, y), pt(x - 0.78, y), color, 5),
        label(names[i], P ? 21 : 19, color, x + 0.24, y, 1.75, false, i === focus));
    });
    return group(parts);
  }

  function people() {
    const figures = [-1.45, 0, 1.45].map(dx => {
      const x = CX + dx, y = Y - 0.35;
      return group(dot(x, y + 0.55, C.ink, 0.13),
        line(pt(x, y + 0.38), pt(x, y - 0.22), C.ink, 4),
        line(pt(x, y - 0.22), pt(x - 0.19, y - 0.58), C.ink, 3),
        line(pt(x, y - 0.22), pt(x + 0.19, y - 0.58), C.ink, 3),
        arrow(pt(x, y + 0.22), pt(x + 0.52, y + 0.61), C.amber, 3, 0.14));
    });
    return group(figures);
  }

  function scoreBars(winner = false) {
    return group(scores.map((score, i) => {
      const y = Y + 0.75 - 0.71 * i;
      const x = CX - 0.62, w = 2.8, fill = Number(score) * w, color = colors[i + 1];
      return group(label(names[i + 1], 20, color, CX - 1.8, y, 1.95, false, winner && i === 0),
        rect(w, 0.29, x + w / 2, y, C.grid, 0.12, true),
        fill ? rect(fill, 0.27, x + fill / 2, y, color, winner && i === 0 ? 0.92 : 0.53, true)
          : dot(x, y, color),
        label(score, 22, color, CX + 2.65, y, 0.77, true, winner && i === 0));
    }));
  }

  function trainingPairs() {
    return group([-1.54, 0, 1.54].map((dx, i) => {
      const x = CX + dx;
      return group(crop(x, Y + 0.48, 0.97), line(pt(x, Y - 0.03), pt(x, Y - 0.45), C.muted),
        label('the library', 18, C.amber, x, Y - 0.73, 1.43));
    }), label('…', 28, C.muted, CX + 2.62, Y - 0.73, 0.48));
  }

  const starts = vectors.slice(1).map(angleOf);
  const changes = starts.map((a, i) => wrap(cropAngle + (i ? Math.PI : 0) - a));
  const training = Array.from({ length: 4 }, (_, step) => {
    const angles = starts.map((a, i) => a + (1 - 0.75 ** step) * changes[i]);
    const matches = angles.map(a => Math.cos(a - cropAngle));
    return {
      dirs: [vectors[0], ...angles.map(unit)], matches,
      loss: 3 - matches[0] + matches[1] + matches[2],
    };
  });
  const two = n => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2).replace('-', '−');

  function lossCurve(step) {
    const x = P ? -1.7 : 2.55, y = P ? -5.1 : -3.0;
    const w = P ? 3.6 : 3.4, h = P ? 1.6 : 1.3;
    const point = (n, loss) => pt(x + n * w / 3, y + loss * h / 3);
    const nodes = training.slice(0, step + 1).map((d, i) => point(i, d.loss));
    return group(
      line(point(0, 0), point(0, 3), C.muted), line(point(0, 0), point(3, 0), C.muted),
      label('Loss', 19, C.amber, x - 0.1, y + h + 0.22, 0.9),
      label('3', 18, C.muted, x - 0.22, y + h, 0.4, true),
      label('0', 18, C.muted, x - 0.22, y, 0.4, true),
      [0, 1, 2, 3].map(i => label(String(i), 18, C.muted, x + i * w / 3, y - 0.22, 0.4, true)),
      label('Training step', 18, C.muted, x + w / 2, y - 0.5, 2.4),
      nodes.slice(1).map((p, i) => line(nodes[i], p, C.amber, 3)),
      nodes.map(([px, py]) => dot(px, py, C.amber, 0.06)));
  }

  function trainPicture(step) {
    return group(board({ dirs: training[step].dirs, ids: active(4), focus: 1 }), lossCurve(step));
  }

  function searchPicture(chooseCaption = false) {
    if (chooseCaption) return inputs('match');
    return group(rect(3.75, 0.53, CX, Y + 0.99, C.amber, 0.12, true),
      label('Search pictures: library', 22, C.ink, CX, Y + 0.99, 3.35),
      crop(CX - 1.59, Y - 0.39, 1.28),
      rect(1.28, 1.28, CX, Y - 0.39, C.green, 0.11), landmark(2, CX, Y - 0.39, 1.28),
      rect(1.28, 1.28, CX + 1.59, Y - 0.39, C.violet, 0.11), landmark(0, CX + 1.59, Y - 0.39, 1.28),
      label('Best match', 19, C.amber, CX - 1.59, Y - 1.23, 1.35));
  }

  function tokens() {
    const y = Y + 0.17;
    return group(crop(CX - 2.08, y, 1.12),
      arrow(pt(CX - 1.46, y), pt(CX - 1.01, y), C.cyan, 2, 0.11),
      ...[-0.74, -0.45, -0.16, 0.13].map((dx, i) =>
        rect(0.25, 0.32, CX + dx, y, C.cyan, 0.34 + 0.13 * i, true)),
      label('Vision token', 18, C.cyan, CX - 0.3, y - 0.49, 1.33),
      arrow(pt(CX + 0.33, y), pt(CX + 0.89, y), C.cyan, 2, 0.11),
      rect(1.76, 0.62, CX + 1.82, y, C.violet, 0.12, true),
      label('Language model', 19, C.violet, CX + 1.82, y, 1.54));
  }

  const trapCaptions = ['The library is left of the lab', 'The lab is left of the library'];
  const trapScores = ['0.93', '0.92'];
  function trap(revealed, showSharedWords = false) {
    const map = campus(true);
    const rows = trapCaptions.map((text, i) => {
      const y = Y - 1.04 - i * 0.56;
      const col = i === 0 ? C.green : C.pink;
      const scored = i < revealed;
      const row = rect(5.35, 0.49, CX, y, scored ? col : C.grid, 0.11, true);
      const written = showSharedWords
        ? group(label('The', 17, C.ink, CX - 2.28, y, 0.37),
          label(i === 0 ? 'library' : 'lab', 19, C.cyan, CX - 1.74, y, 0.69),
          label('is left of the', 17, C.ink, CX - 0.63, y, 1.41),
          label(i === 0 ? 'lab' : 'library', 19, C.cyan, CX + 0.48, y, 0.69))
        : label(text, 19, scored ? col : C.ink, CX - 0.78, y, 3.52);
      return group(row, written, scored ? [
        label(i === 0 ? 'True' : 'False', 17, col, CX + 1.45, y, 0.65),
        label(trapScores[i], 20, col, CX + 2.18, y, 0.67, true, true),
      ] : []);
    });
    return group(map, rows);
  }

  // Campus map, crop, and captions.
  await until(S(0)); await play(...picture(campus()), ...say('CAMPUS MAP CUT INTO PATCHES'));
  await until(S(1)); await play(...picture(inputs('crop')), ...say('ONE CROP: THE LIBRARY'));
  await until(S(2)); await play(...picture(inputs()), ...say('THREE CAPTIONS'));
  await until(S(3)); await play(...picture(inputs('match')), ...say('WHICH CAPTION FITS?', C.amber));
  await until(S(4)); await play(...picture(inputs('pixels')), ...say('PIXELS AND WORDS'));

  // Coordinates, unit length, and the shared space.
  const simple = { guide: false, legend: false };
  await until(S(5)); await play(...picture(group(
    arrow(pt(CX - 2.05, Y - 0.42), pt(CX - 0.67, Y + 0.61), C.cyan),
    arrow(pt(CX + 0.38, Y - 0.42), pt(CX + 1.41, Y + 0.96), C.amber),
    label('Picture', 22, C.cyan, CX - 1.39, Y - 0.86),
    label('Caption', 22, C.amber, CX + 1.02, Y - 0.86))), ...say('BOTH BECOME ARROWS'));
  await until(S(6)); await play(...picture(board(simple)), ...say('EVERY ARROW STARTS HERE'));
  const coordinateDemo = [[0.8, 0.6]];
  await until(S(7)); await play(...picture(board({
    ...simple, dirs: coordinateDemo, ids: [0], components: true,
  })), ...say('TWO NUMBERS: RIGHT AND UP'));
  await until(S(8)); await play(...picture(board({
    ...simple, dirs: [[-0.6, 0.8]], ids: [0], negative: true,
  })), ...say('MINUS MEANS LEFT', C.violet));
  await until(S(9)); await play(...picture(board({
    dirs: [[1, 0], ...vectors.slice(1)], ids: active(4), legend: false, unitMark: true,
  })), ...say('SAME LENGTH: ONE'));
  await until(S(10)); await play(...picture(encoders('image')), ...say('IMAGE ENCODER'));
  await until(S(11)); await play(...picture(encoders('text')), ...say('TEXT ENCODER', C.amber));
  await until(S(12)); await play(...picture(encoders('shared')), ...say('ONE SHARED SPACE'));
  await until(S(13)); await play(...picture(board({ ids: [0], legend: false })),
    ...say('TWO NUMBERS LET US DRAW IT'), ...fbox(['Real: hundreds of numbers', 'Here: right and up']));
  await until(S(14)); await play(...picture(board({ ids: [0], components: true })),
    ...say('THE LIBRARY CROP'), ...fbox(['Library crop', ['(0.8, 0.6)', C.cyan]]));
  await until(S(15)); await play(...picture(board({ ids: active(2), focus: 1 })),
    ...say('“THE LIBRARY”', C.amber), ...fbox(['the library', ['(0.6, 0.8)', C.amber]], C.amber));
  await until(S(16)); await play(...picture(board({ ids: active(3), focus: 2 })),
    ...say('“THE LAB BUILDING”', C.green), ...fbox(['the lab building', ['(1, 0)', C.green]], C.green));
  await until(S(17)); await play(...picture(board({ ids: active(4), focus: 3 })),
    ...say('“THE POND”', C.violet), ...fbox(['the pond', ['(−0.6, 0.8)', C.violet]], C.violet));
  await until(S(18)); await play(...picture(board({ ids: active(4), focus: 1, angles: [[1, 0.65]] })),
    ...fbox(null), ...say('ALMOST THE SAME DIRECTION', C.amber));
  await until(S(19)); await play(...picture(board({ ids: active(4), angles: [[2, 0.49], [3, 0.71]] })),
    ...say('TURNED FURTHER AWAY', C.violet));
  await until(S(20)); await play(...picture(people()), ...say('POINTING THE SAME WAY', C.amber));

  // Compute each product and sum as the narration says it.
  const compare = i => board({ ids: [0, i], focus: i, angles: [[i, 0.6]] });
  await until(S(21)); await play(...picture(compare(1)), ...say('HOW MUCH DO THEY AGREE?'));
  await until(S(22)); await play(...say('MULTIPLY IN PAIRS, THEN ADD'),
    ...fbox(['right × right', '+ up × up']));
  await until(S(23)); await play(...say('LIBRARY: RIGHT NUMBERS', C.amber),
    ...fbox([['0.8 × 0.6 = 0.48', C.amber]], C.amber));
  await until(S(24)); await play(...say('LIBRARY: UP NUMBERS', C.amber),
    ...fbox(['0.8 × 0.6 = 0.48', ['0.6 × 0.8 = 0.48', C.amber]], C.amber));
  await until(S(25)); await play(...say('LIBRARY SCORE', C.amber),
    ...fbox(['0.8 × 0.6 = 0.48', '0.6 × 0.8 = 0.48', ['0.48 + 0.48 = 0.96', C.amber]], C.amber));
  await until(S(26)); await play(...picture(compare(2)), ...say('LAB: RIGHT NUMBERS', C.green),
    ...fbox([['0.8 × 1 = 0.8', C.green]], C.green));
  await until(S(27)); await play(...say('LAB: UP NUMBERS', C.green),
    ...fbox(['0.8 × 1 = 0.8', ['0.6 × 0 = 0', C.green]], C.green));
  await until(S(27) + 2.65); await play(...say('LAB SCORE', C.green),
    ...fbox(['0.8 × 1 = 0.8', '0.6 × 0 = 0', ['0.8 + 0 = 0.8', C.green]], C.green));
  await until(S(28)); await play(...picture(compare(3)), ...say('POND: RIGHT NUMBERS', C.violet),
    ...fbox([['0.8 × (−0.6) = −0.48', C.violet]], C.violet));
  await until(S(29)); await play(...say('POND: UP NUMBERS', C.violet),
    ...fbox(['0.8 × (−0.6) = −0.48', ['0.6 × 0.8 = 0.48', C.violet]], C.violet));
  await until(S(29) + 3.1); await play(...say('POND SCORE', C.violet),
    ...fbox(['0.8 × (−0.6) = −0.48', '0.6 × 0.8 = 0.48', ['−0.48 + 0.48 = 0', C.violet]], C.violet));
  await until(S(30)); await play(...picture(scoreBars()), ...fbox(null), ...say('THE THREE SCORES'));
  await until(S(31)); await play(...picture(scoreBars(true)), ...say('BEST MATCH: THE LIBRARY', C.amber));
  await until(S(32)); await play(...say('COSINE SIMILARITY'), ...fbox(['A score for arrow agreement', ['You met it in 21.1.4', C.muted]]));

  // Same, perpendicular, and opposite unit arrows.
  await until(S(33)); await play(...picture(board({ dirs: [vectors[0], vectors[0]], ids: [0, 1], same: true })),
    ...say('EXACTLY THE SAME WAY', C.amber), ...fbox([['Score = 1', C.amber]], C.amber));
  await until(S(34)); await play(...picture(board({ ids: [0, 3], focus: 3, corner: true })),
    ...say('AT A RIGHT ANGLE', C.violet), ...fbox([['Score = 0', C.violet]], C.violet));
  await until(S(35)); await play(...picture(board({
    dirs: [vectors[0], vectors[0].map(x => -x)], ids: [0, 1], focus: 1,
  })), ...say('OPPOSITE WAYS', C.pink), ...fbox([['Score = −1', C.pink]], C.pink));
  await until(S(36)); await play(...picture(compare(1)), ...fbox(null), ...say('IMAGE–TEXT ALIGNMENT'));
  await until(S(37)); await play(...say('FOR ARROWS OF LENGTH ONE'),
    ...fbox(['score = right × right', '      + up × up']));
  await until(S(38)); await play(...picture(trainingPairs()), ...fbox(['Contrastive learning', ['You met it in 18.1.4', C.muted]]), ...say('TRAIN ON MANY MATCHING PAIRS'));

  // Toy training: with the crop fixed, close a quarter of each caption's
  // remaining turn toward its target. The two wrong captions aim away.
  await until(S(39));
  await play(...picture(trainPicture(0)), ...say('TRUE PAIR CLOSER · WRONG PAIRS APART'),
    ...fbox(['Toy training · Start', 'Loss (total error) = 2.84']));
  for (let step = 1; step <= 3; step++) {
    await until(S(39) + [0, 1.25, 2.82, 4.39][step]);
    const { matches, loss } = training[step];
    await play(...picture(trainPicture(step)), ...fbox([
      `Step ${step} · Loss ${two(training[step - 1].loss)} → ${two(loss)}`,
      [`Library score   ${two(matches[0])}`, C.amber],
      `Lab ${two(matches[1])} · Pond ${two(matches[2])}`,
    ]));
  }

  // Uses, the word-order trap, and recap.
  await until(S(40)); await play(...picture(searchPicture()), ...fbox(null), ...say('SEARCH PICTURES WITH WORDS'));
  await until(S(40) + 2.65); await play(...picture(searchPicture(true)), ...say('PICK THE BEST CAPTION', C.amber));
  await until(S(41)); await play(...picture(tokens()), ...say('GIVE THE PATCH A VISION TOKEN'));
  await until(S(42)); await play(...picture(trap(0, true)), ...say('SAME WORDS, DIFFERENT ORDER', C.amber));
  await until(S(43)); await play(...picture(trap(1)), ...say('LIBRARY LEFT OF LAB', C.green));
  await until(S(44)); await play(...picture(trap(2)), ...say('LAB LEFT OF LIBRARY', C.pink));
  await until(S(45)); await play(...say('TRUE AND FALSE, ALMOST TIED', C.amber),
    ...fbox([['0.93 and 0.92', C.amber]]));
  await until(S(46)); await play(...picture(trap(2, true)), ...fbox(null), ...say('NAMES ARE EASIER THAN ARRANGEMENT'));
  await until(S(47)); await play(...say('CHECK THE DETAIL AGAINST THE MAP', C.pink));
  await until(S(48)); await play(...picture(compare(1)), ...say('SHARED SPACE · DIRECTION AGREEMENT'),
    ...fbox(['Pictures and captions → arrows', ['More agreement → higher score', C.amber]]));
}
