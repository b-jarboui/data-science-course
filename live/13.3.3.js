// 13.3.3 Multilabel prediction at the recycling facility.
// Beat i follows sentence i, starting at zero.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -6.0, 0] : [4.4, -0.3, 0];
  const PHOTO = P ? [0, 0.6] : [-4.55, -0.12];
  const SCORE_X = P ? 0 : -0.3;
  const BAR_W = P ? 5.7 : 4.8;
  const BAR_H = P ? 0.2 : 0.24;
  const BAR_LEFT = SCORE_X - BAR_W / 2;
  const SCORE_Y = P ? [-1.2, -2.75, -4.3] : [0.9, -0.5, -1.9];
  const PHOTO_W = 2.88;
  const PHOTO_H = 1.36;
  const BLUE = '#60a5fa';
  const ORANGE = '#fb923c';
  const THRESHOLD = 50;
  const LABELS = [
    { name: 'Plastic', color: BLUE, width: P ? 1.65 : 1.55 },
    { name: 'Metal', color: ORANGE, width: P ? 1.55 : 1.4 },
    { name: 'Protect hands', color: C.violet, width: P ? 2.7 : 2.45 },
  ];
  const photos = {
    A: { material: 0, sharp: false },
    G: { material: 0, sharp: true, scores: [90, 10, 80] },
    J: { material: 1, sharp: true, scores: [20, 80, 90] },
    K: { material: 1, sharp: false, scores: [10, 90, 20] },
    H: { material: 0, sharp: false },
  };
  const ids = ['A', 'G', 'J', 'K'];
  const galleryPlaces = P
    ? [[-1.68, 0.8], [1.68, 0.8], [-1.68, -3.2], [1.68, -3.2]]
    : [[-4.74, 0.04], [-1.58, 0.04], [1.58, 0.04], [4.74, 0.04]];
  const boxPlace = P ? [0, -1.2] : [CX, -0.3];

  const point = (x, y) => [x, y, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const enter = object => new M.FadeIn(object, { runTime: 0.35 });
  const leave = object => new M.FadeOut(object, { runTime: 0.3 });
  const pulse = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.65 });
  const seq = (animations, runTime = 0.9) => new M.LaggedStart(animations, { lagRatio: 0.24, runTime });

  function textAt(text, x, y, size, color = C.ink, maxWidth = Infinity, mono = false) {
    const label = T(text, size, color, mono, true);
    const width = label.getWidth();
    if (width > maxWidth) label.scale(maxWidth / width);
    return label.moveTo(point(x, y));
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 1) {
    const panel = new M.RoundedRectangle({ width, height, cornerRadius: Math.min(0.14, height / 3), color, strokeWidth: 2 });
    panel.setFill(fill, opacity);
    return panel.moveTo(point(x, y));
  }

  function line(x1, y1, x2, y2, color, strokeWidth = 2) {
    return new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  }

  function polygon(x, y, vertices, color, fill = color) {
    const shape = new M.Polygon({ vertices: vertices.map(([dx, dy]) => point(x + dx, y + dy)), color, strokeWidth: 2 });
    shape.setFill(fill, 0.9);
    return shape;
  }

  function labelTag(index, x, y, checked = false) {
    const { name, color, width } = LABELS[index];
    const markX = x - width / 2 + 0.12;
    let mark;
    if (index === 0) {
      mark = new M.Circle({ radius: 0.047, color });
      mark.setFill(color, 1);
      mark.moveTo(point(markX, y));
    } else if (index === 1) {
      mark = new M.Rectangle({ width: 0.09, height: 0.09, color });
      mark.setFill(color, 1);
      mark.moveTo(point(markX, y));
    } else {
      mark = polygon(markX, y, [[0, 0.058], [-0.05, -0.04], [0.05, -0.04]], color);
    }
    const copy = textAt(checked ? `${name} ✓` : name, x + 0.07, y, P ? 18 : 17, C.ink, width - 0.22);
    return new M.VGroup(rect(x, y, width, P ? 0.42 : 0.4, color, color, checked ? 0.27 : 0.13), mark, copy);
  }

  function materialTag(id, [x, y], checked = false, stack = false) {
    if (P) return labelTag(photos[id].material, stack ? x : x - 1.4, y - 0.95, checked);
    return labelTag(photos[id].material, x, y - 0.98, checked);
  }

  function warningTag([x, y], checked = false, stack = false) {
    if (P) return labelTag(2, stack ? x : x + 1.3, stack ? y - 1.43 : y - 0.95, checked);
    return labelTag(2, x, y - 1.5, checked);
  }

  function photo(id, [x, y]) {
    const item = photos[id];
    const color = LABELS[item.material].color;
    const parts = [
      rect(x, y, PHOTO_W, PHOTO_H, color),
      rect(x, y, PHOTO_W - 0.18, PHOTO_H - 0.18, C.line, C.bg),
      textAt(id, x - 1.09, y + 0.39, 18, C.ink, 0.28, true),
      line(x - 0.91, y - 0.43, x + 0.91, y - 0.43, C.grid),
    ];
    if (item.sharp) {
      parts.push(polygon(x, y, [[-0.73, -0.27], [-0.6, 0.19], [-0.23, 0.28], [0.04, 0.16],
        [0.44, 0.4], [0.35, 0.09], [0.77, 0.23], [0.55, -0.21], [0.12, -0.31]], color,
      item.material === 1 ? '#8e9cb9' : '#284b79'));
      parts.push(line(x - 0.5, y - 0.13, x + 0.29, y + 0.09, color));
    } else if (item.material === 0 && id !== 'H') {
      parts.push(polygon(x, y, [[-0.23, -0.37], [-0.29, -0.29], [-0.29, 0.13], [-0.13, 0.28],
        [-0.13, 0.39], [0.13, 0.39], [0.13, 0.28], [0.29, 0.13], [0.29, -0.29],
        [0.23, -0.37]], color, '#284b79'));
      parts.push(line(x - 0.23, y - 0.02, x + 0.23, y - 0.02, color));
    } else {
      parts.push(rect(x, y, 0.9, 0.75, id === 'H' ? '#b2bdd9' : color, '#677793', 0.92));
      parts.push(line(x - 0.31, y + 0.23, x + 0.31, y + 0.23, C.ink));
      parts.push(line(x - 0.23, y + 0.14, x - 0.23, y - 0.22, C.ink));
    }
    return new M.VGroup(...parts);
  }

  function scoreTrack(index) {
    const y = SCORE_Y[index];
    const { name, color } = LABELS[index];
    return new M.VGroup(
      textAt(name, SCORE_X, y, 22, color, BAR_W),
      rect(SCORE_X, y - 0.31, BAR_W, BAR_H, C.line, C.line),
    );
  }

  function scoreValue(id, index) {
    const value = photos[id].scores[index];
    const width = BAR_W * value / 100;
    const y = SCORE_Y[index];
    const { color } = LABELS[index];
    return new M.VGroup(
      rect(BAR_LEFT + width / 2, y - 0.31, width, BAR_H, color, color, 0.9),
      textAt(`${value}%`, BAR_LEFT + BAR_W - 0.3, y, 20, C.ink, 0.58, true),
    );
  }

  function cutoff() {
    const y = SCORE_Y[2] - 0.31;
    return new M.VGroup(
      line(SCORE_X, y - 0.13, SCORE_X, y + 0.13, C.ink, 3),
      textAt(`${THRESHOLD}%`, SCORE_X, y - 0.34, 19, C.ink, 0.7, true),
    );
  }

  const visible = new Map();
  function put(key, object) {
    const old = visible.get(key);
    visible.set(key, object);
    return old ? [leave(old), enter(object)] : [enter(object)];
  }

  function clear(...keys) {
    const animations = [];
    for (const key of keys) {
      if (visible.has(key)) animations.push(leave(visible.get(key)));
      visible.delete(key);
    }
    return animations;
  }

  function formula(lines, color = C.cyan) {
    const [x, y] = BOXP;
    const width = P ? FW - 1.2 : 4.0;
    const spacing = P ? 0.44 : 0.42;
    const rows = lines.map((row, i) => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return textAt(text, x, y + ((lines.length - 1) / 2 - i) * spacing, P ? 22 : 21, ink, width - 0.45, true);
    });
    return put('formula', new M.VGroup(rect(x, y, width, lines.length * spacing + 0.4, color), ...rows));
  }

  function showScores(id, ...indices) {
    return indices.flatMap(i => put(`score${i}`, scoreValue(id, i)));
  }

  const galleryKeys = ids.flatMap(id => [`photo${id}`, `material${id}`, `warning${id}`]);
  const resultKeys = ['material', 'warning'];
  const valueKeys = ['score0', 'score1', 'score2'];
  const trackKeys = ['track0', 'track1', 'track2'];
  const tracks = () => LABELS.flatMap((_, i) => put(trackKeys[i], scoreTrack(i)));
  const checkMaterial = id => put('material', materialTag(id, PHOTO));
  const checkWarning = () => put('warning', warningTag(PHOTO));
  const example = id => [
    ...clear(...resultKeys, ...valueKeys, 'cutoff'),
    ...put('example', photo(id, PHOTO)),
  ];

  // 0–4 The facility, the two questions, and four checked photos.
  const facilityY = P ? -1.4 : -0.35;
  const belt = rect(0, facilityY - 0.82, P ? 5.6 : 7.8, 0.35, C.muted, C.line);
  const rollers = [-2, -1, 0, 1, 2].map(x => new M.Dot({ point: point(x, facilityY - 0.82), color: C.muted, radius: 0.065 }));
  const facility = new M.VGroup(belt, ...rollers, photo('J', [0, facilityY]));
  if (P) { facility.scale(1.35); facility.moveTo(point(0, facilityY - 0.3)); }
  const question = (text, side, color) => textAt(text, side * (P ? 1.7 : 3.75),
    facilityY + (P ? 1.6 : 0.1), 25, color, P ? 2.8 : 2.9);

  await until(S(0)); await play(...put('facility', facility), ...say('RECYCLING FACILITY'));
  await until(S(1)); await play(...put('left', question('What material?', -1, BLUE)), ...say('RECOGNISE THE MATERIAL', BLUE));
  await until(S(2)); await play(...put('right', question('Sharp edges?', 1, C.violet)), ...say('WARN WORKERS', C.violet));
  await until(S(3)); await play(pulse(facility, C.cyan), ...say('ONE PHOTO, TWO QUESTIONS?'));
  await until(S(4));
  const frames = ids.flatMap((id, i) => {
    const [x, y] = galleryPlaces[i];
    return put(`photo${id}`, new M.VGroup(rect(x, y, PHOTO_W, PHOTO_H, C.muted),
      textAt(id, x, y, 24, C.muted, 0.55, true)));
  });
  await play(...clear('facility', 'left', 'right'), seq(frames), ...say('FOUR PHOTOS CHECKED BY A WORKER'));

  // 5–15 Reveal the photos and add the worker's tags in narration order.
  const reveal = (id, i) => put(`photo${id}`, photo(id, galleryPlaces[i]));
  const knownMaterial = (id, i) => put(`material${id}`, materialTag(id, galleryPlaces[i], true, true));
  const knownWarning = (id, i) => put(`warning${id}`, warningTag(galleryPlaces[i], true, true));

  await until(S(5)); await play(...reveal('A', 0), ...say('A · SMOOTH PLASTIC', BLUE));
  await until(S(6)); await play(...knownMaterial('A', 0), ...say('PLASTIC', BLUE));
  await until(S(7)); await play(...reveal('G', 1), ...say('G · SHARP PLASTIC', BLUE));
  await until(S(8)); await play(...knownMaterial('G', 1), ...say('PLASTIC', BLUE));
  await until(S(9)); await play(...knownWarning('G', 1), ...say('PROTECT HANDS', C.violet));
  await until(S(10)); await play(...reveal('J', 2), ...say('J · SHARP METAL', ORANGE));
  await until(S(11)); await play(seq([...knownMaterial('J', 2), ...knownWarning('J', 2)]), ...say('TWO LABELS', C.violet));
  await until(S(12)); await play(...reveal('K', 3), ...say('K · SMOOTH METAL', ORANGE));
  await until(S(13)); await play(...knownMaterial('K', 3), ...say('METAL', ORANGE));
  await until(S(14));
  const counts = ids.map((id, i) => {
    const [x, y] = galleryPlaces[i];
    return textAt(photos[id].sharp ? '2 labels' : '1 label', x, y - (P ? 1.95 : 2.05), 20, C.ink, 1.6);
  });
  await play(...put('counts', new M.VGroup(...counts)), ...say('ONE LABEL OR TWO'));

  // 15–21 Two stickers can describe the same box.
  const [bx, by] = boxPlace;
  const carton = new M.VGroup(
    rect(bx, by, 3.55, 1.86, C.amber, '#533c2a'),
    polygon(bx, by, [[-1.77, 0.93], [-1.19, 1.25], [1.2, 1.25], [1.77, 0.93]], C.amber, '#765439'),
    line(bx, by + 0.95, bx, by + 1.23, C.amber),
  );
  if (P) { carton.scale(1.6); carton.moveTo(point(bx, by + 0.2)); }
  await until(S(15)); await play(...clear(...galleryKeys, 'counts'), ...put('carton', carton), ...say('STICKERS ON ONE BOX'));
  await until(S(16)); await play(...put('sticker1', labelTag(1, bx - (P ? 1.5 : 0.86), by)), ...say('WHAT IS INSIDE MADE OF?', ORANGE));
  await until(S(17)); await play(...put('sticker2', labelTag(2, bx + (P ? 1.3 : 0.55), by)), ...say('HOW SHOULD YOU HANDLE IT?', C.violet));
  await until(S(18)); await play(pulse(visible.get('sticker1'), ORANGE), pulse(visible.get('sticker2'), C.violet), ...say('BOTH STICKERS STAY'));

  const prompt = (label, x, y, color) => new M.VGroup(
    rect(x, y, 2.84, 0.61, color),
    textAt(label, x, y, 22, color, 2.58),
  );
  const [px, py] = PHOTO;
  const questionY = P ? -2.6 : -0.08;
  const questionX = P ? 1.65 : 0;
  await until(S(19)); await play(...clear('carton', 'sticker1', 'sticker2'), ...example('J'),
    ...put('left', prompt('What material?', P ? -questionX : 0.12, questionY, BLUE)),
    ...put('right', prompt('Protect hands?', P ? questionX : 3.55, questionY, C.violet)),
    ...say('THE COMPUTER ANSWERS BOTH'));
  await until(S(20));
  await play(...clear('left', 'right'),
    ...put('material', materialTag('J', PHOTO)), ...put('warning', warningTag(PHOTO)),
    ...say('MULTILABEL PREDICTION', C.green));
  await until(S(21)); await play(...clear('example', ...resultKeys), ...say('HOW DOES IT CHOOSE?'));

  // 22–35 Photo J. Compare the material pair, then check the warning.
  await until(S(22)); await play(...example('J'), ...say('J · SHARP METAL', ORANGE));
  await until(S(23)); await play(...tracks(), ...say('ONE SCORE PER POSSIBLE LABEL'));
  const guideY = P ? -5.4 : -2.85;
  const guide = new M.VGroup(
    line(BAR_LEFT, guideY, BAR_LEFT + BAR_W - 0.12, guideY, C.cyan),
    polygon(BAR_LEFT + BAR_W - 0.1, guideY, [[0.1, 0], [-0.08, 0.075], [-0.08, -0.075]], C.cyan),
  );
  await until(S(24)); await play(...put('guide', guide), ...say('HIGHER SCORE · MORE LIKELY'));
  await until(S(25)); await play(...clear('guide'), ...showScores('J', 0), ...say('PLASTIC · 20%', BLUE));
  await until(S(26)); await play(...showScores('J', 1), ...say('METAL · 80%', ORANGE));
  await until(S(27)); await play(...showScores('J', 2), ...say('PROTECT HANDS · 90%', C.violet));

  const compare = () => [pulse(visible.get('score0'), BLUE), pulse(visible.get('score1'), ORANGE)];
  await until(S(28)); await play(...compare(), ...say('FIRST · WHAT MATERIAL?'));
  await until(S(29)); await play(...say('CHOOSE ONE MATERIAL', C.amber));
  await until(S(30)); await play(pulse(visible.get('score1'), ORANGE), ...checkMaterial('J'), ...say('80% BEATS 20%', ORANGE));
  await until(S(31)); await play(pulse(visible.get('score2'), C.violet), ...say('NEXT · PROTECT HANDS?', C.violet));
  await until(S(32)); await play(...put('cutoff', cutoff()), ...say('ADD WARNING AT 50% OR MORE', C.violet));
  await until(S(33)); await play(pulse(visible.get('cutoff'), C.amber), ...say('THRESHOLD · THE DIVIDING POINT', C.amber));
  await until(S(34)); await play(pulse(visible.get('score2'), C.violet), ...say('90% IS ABOVE 50%', C.violet));
  await until(S(35)); await play(...checkWarning(), ...say('METAL + PROTECT HANDS', C.green));

  // 36–43 Apply the same decisions to photos G and K.
  await until(S(36)); await play(...example('G'), ...say('G · SHARP PLASTIC', BLUE));
  await until(S(37)); await play(...showScores('G', 0, 1), ...say('PLASTIC 90% · METAL 10%'));
  await until(S(38)); await play(pulse(visible.get('score0'), BLUE), ...checkMaterial('G'), ...say('SELECT PLASTIC', BLUE));
  await until(S(39));
  await play(seq([...showScores('G', 2), ...put('cutoff', cutoff()), ...checkWarning()], 1.2),
    ...say('80% REACHES THE THRESHOLD', C.violet));
  await until(S(40)); await play(...example('K'), ...say('K · SMOOTH METAL', ORANGE));
  await until(S(41)); await play(...showScores('K', 0, 1), ...say('PLASTIC 10% · METAL 90%'));
  await until(S(42)); await play(...showScores('K', 2), ...put('cutoff', cutoff()), ...say('20% IS BELOW 50%', C.violet));
  await until(S(43)); await play(...checkMaterial('K'), ...say('METAL ONLY', ORANGE));

  // 44–47 Write the rules after the worked decisions.
  const materialRule = ['Material = higher score', ORANGE];
  const warningRule = ['Protect hands if score ≥ 50%', C.violet];
  await until(S(44)); await play(...say('TWO DECISION RULES'));
  await until(S(45)); await play(...compare(), ...formula([materialRule]), ...say('CHOOSE THE HIGHER MATERIAL SCORE'));
  await until(S(46)); await play(...formula([materialRule, warningRule]), ...say('CHECK THE WARNING SEPARATELY', C.violet));
  await until(S(47)); await play(...clear('formula', 'example', ...resultKeys, ...trackKeys, ...valueKeys, 'cutoff'),
    ...example('J'), ...checkMaterial('J'), ...checkWarning(), ...say('SEVERAL LABELS CAN APPLY', C.green));

  // 48–53 What the labels communicate, what scores mean, and a recap.
  const useY = P ? -3.3 : 0.12;
  await until(S(48)); await play(
    ...put('left', prompt('Sort by material', P ? -1.65 : 0.1, useY, ORANGE)),
    ...put('right', prompt('Handle with care', P ? 1.65 : 3.55, useY, C.violet)),
    ...say('SORT ITEMS AND WARN WORKERS', C.green));
  await until(S(49)); await play(...clear('left', 'right', ...resultKeys), ...say('A COMMON SCORE TRAP', C.amber));
  await until(S(50));
  await play(...put('track1', scoreTrack(1)), ...put('track2', scoreTrack(2)), ...showScores('J', 1, 2),
    ...say('METAL 80% · PROTECT HANDS 90%'));
  await until(S(51));
  await play(...formula([['Metal 80% · material?', ORANGE], ['Protect hands 90% · warning?', C.violet]]),
    ...say('THE SCORES ANSWER DIFFERENT QUESTIONS', C.amber));

  const checkedH = textAt('Worker checked Plastic', px, py - 1.04, 22, BLUE, PHOTO_W + 0.5);
  const mistake = prompt('High Metal score', P ? 0 : -0.25, P ? -2.8 : -0.12, ORANGE);
  await until(S(52));
  await play(...clear('formula', ...trackKeys, ...valueKeys),
    ...example('H'), ...put('checked', checkedH), ...put('mistake', mistake), ...say('HIGH SCORES CAN BE WRONG', C.amber));
  await until(S(53));
  const recap = ids.map((id, i) => {
    const place = galleryPlaces[i];
    const parts = [photo(id, place), materialTag(id, place, true, true)];
    if (photos[id].sharp) parts.push(warningTag(place, true, true));
    return new M.VGroup(...parts);
  });
  await play(...clear('example', 'checked', 'mistake'),
    ...put('recap', new M.VGroup(...recap)), ...say('ONE MATERIAL · ADD A WARNING IF IT APPLIES', C.green));
}
