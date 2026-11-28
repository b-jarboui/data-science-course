// 13.3.5 Active learning: asking the most useful questions.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.48, 0] : [4.3, -0.3, 0];
  const PLASTIC = '#60a5fa', METAL = '#fb923c';
  const groups = ['Matte', 'Mixed', 'Shiny'];
  const learning = {
    Matte: Array.from('ABCDEFG', id => [id, 0]),
    Mixed: [['I', 0], ['L', 1]],
    Shiny: [['H', 0], ['J', 1], ['K', 1]]
  };
  // Store a worker's answer only when the narration reveals it.
  const photos = [
    { id: 'U1', group: 'Matte' }, { id: 'U2', group: 'Mixed' },
    { id: 'U3', group: 'Mixed' }, { id: 'U4', group: 'Shiny' },
    { id: 'U5', group: 'Shiny' }
  ];
  const validation = [
    ['V1', 'Matte', 0], ['V2', 'Matte', 0], ['V3', 'Mixed', 0], ['V4', 'Shiny', 1]
  ];
  const metalCount = group => learning[group].filter(([, answer]) => answer === 1).length;
  const probability = group => metalCount(group) / learning[group].length;
  const percent = value => `${Math.round(value * 100)}%`;
  const approx = group => group === 'Matte' ? '0%' : group === 'Mixed' ? '50%' : '≈67%';
  const material = answer => answer === 1 ? 'Metal' : 'Plastic';
  const colorOf = answer => answer === 1 ? METAL : PLASTIC;
  const position = (x, y) => [CX + x, y, 0];
  const poolY = P ? -4.7 : -1.95, SC = P ? 1.15 : 1.2;
  const trainY = i => P ? 0.15 - i * 1.35 : 0.85 - i * 0.62;
  const poolX = i => (i - 2) * (P ? 1.5 : 1.55);
  const trainX = i => P ? -3.0 + i * 0.86 : -1.75 + i * 0.58;
  const PW = P ? 0.74 : 0.52, PH = P ? 0.5 : 0.42;
  const label = (value, x, y, size = 20, color = C.ink, mono = false) =>
    T(String(value), size, color, mono).moveTo(position(x, y));
  const rect = (x, y, width, height, color, fill = C.card, opacity = 1) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    shape.moveTo(position(x, y));
    return shape;
  };
  const line = (x1, y1, x2, y2, color = C.grid, strokeWidth = 2) =>
    new M.Line({ start: position(x1, y1), end: position(x2, y2), color, strokeWidth });
  const dot = (x, y, radius, color) => {
    const shape = new M.Dot({ point: position(x, y), radius, color });
    shape.setFill(color, 1);
    return shape;
  };
  const group = parts => new M.VGroup(...parts);
  const mark = (answer, x, y) => answer === 1
    ? rect(x, y, 0.15, 0.15, METAL, METAL)
    : dot(x, y, 0.078, PLASTIC);

  let pictureNow = null, boxNow = null;
  function formula(rows, color) {
    const font = P ? 21 : 20, lh = P ? 0.38 : 0.4;
    const texts = rows.map(row => {
      const [value, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(value, font, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.54;
    const height = rows.length * lh + 0.34;
    const border = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    border.setFill(C.card, 0.96);
    border.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo([
      BOXP[0] - width / 2 + 0.27 + t.getWidth() / 2,
      BOXP[1] + ((texts.length - 1) / 2 - i) * lh, 0
    ]));
    const box = group([border, ...texts]);
    const maxWidth = P ? FW - 0.9 : 4.55;
    if (width > maxWidth) box.scale(maxWidth / width);
    box.moveTo(BOXP);
    return box;
  }

  async function frame(title, { art, rows, color = C.cyan, animate = [] } = {}) {
    const animations = [...showA(title, color, PILL), ...animate];
    if (art !== undefined) {
      if (pictureNow) animations.push(new M.FadeOut(pictureNow, { runTime: 0.22 }));
      pictureNow = art;
      if (art) animations.push(new M.FadeIn(art, { runTime: 0.4 }));
    }
    if (rows !== undefined) {
      if (boxNow) animations.push(new M.FadeOut(boxNow, { runTime: 0.22 }));
      boxNow = rows ? formula(rows, color) : null;
      if (boxNow) animations.push(new M.FadeIn(boxNow, { runTime: 0.4 }));
    }
    await play(...animations);
  }

  function photoCard(photo, i, { appearance, predictions, selected, tied }) {
    const x = 0, y = 0;
    const active = selected === photo.id;
    const border = active ? C.amber : tied.includes(photo.id) ? C.violet : C.muted;
    const parts = [
      rect(x, y, 1.22, 1.07, border, C.card, 0.94),
      label(photo.id, x - 0.34, y + 0.33, 16, border, true),
      label(photo.answer === undefined ? '?' : '✓', x + 0.36, y + 0.33, 17,
        photo.answer === undefined ? C.muted : colorOf(photo.answer))
    ];
    // Small photo thumbnails distinguish the surfaces as they are named.
    if (appearance) {
      parts.push(rect(x, y + 0.02, 0.63, 0.33, border, '#334155'));
      if (photo.group !== 'Matte') {
        parts.push(line(x - 0.17, y - 0.09, x + 0.02, y + 0.13, C.ink));
      }
      if (photo.group === 'Shiny') {
        parts.push(line(x + 0.04, y - 0.09, x + 0.23, y + 0.13, C.ink));
      }
      parts.push(label(photo.group, x, y - 0.31, 15, C.ink));
    } else {
      parts.push(rect(x, y - 0.1, 0.66, 0.42, C.muted, '#27344f'));
    }
    if (photo.answer !== undefined) {
      parts.push(mark(photo.answer, x - 0.41, y - 0.78),
        label(material(photo.answer), x + 0.1, y - 0.78, 18, colorOf(photo.answer)));
    } else if (predictions.includes(photo.group)) {
      const value = probability(photo.group);
      const barY = y - 0.72;
      parts.push(line(x - 0.49, barY, x + 0.49, barY, C.grid, 4));
      if (value > 0) parts.push(line(x - 0.49, barY, x - 0.49 + 0.98 * value, barY, C.cyan, 4));
      parts.push(line(x, barY - 0.075, x, barY + 0.075, C.amber, 2),
        label(percent(value), x, y - 1.04, 18, C.cyan, true));
    }
    return parts;
  }

  function board({
    train = false, pool = true, appearance = false, counts = false, labelled = [],
    predictions = [], selected, tied = [], arriving
  } = {}) {
    const parts = [];
    if (train) {
      parts.push(label('HUMAN-LABELLED LEARNING PHOTOS', 0, P ? 1.45 : 1.28, 20, C.muted, true));
      if (!labelled.length) {
        Array.from('ABCDEFGHIJKL').forEach((id, i) => {
          const x = (i % 6 - 2.5) * (P ? 1.2 : 0.88);
          const y = trainY(Math.floor(i / 6));
          parts.push(rect(x, y, P ? 1.0 : 0.74, P ? 0.6 : 0.39, C.muted), label(`${id} ✓`, x, y, P ? 20 : 17, C.ink, true));
        });
      } else {
        groups.forEach((name, i) => {
          if (!labelled.includes(name)) return;
          const y = trainY(i);
          parts.push(label(name, P ? -2.9 : -2.66, P ? y + 0.55 : y, 21));
          learning[name].forEach(([id, answer], j) => {
            if (id === arriving) return;
            const x = trainX(j);
            const tag = counts || labelled.length > 1 ? colorOf(answer) : C.muted;
            parts.push(rect(x, y, PW, PH, tag),
              label(id, x, y + 0.015, id.length > 1 ? (P ? 15 : 16) : (P ? 19 : 19), tag, true));
          });
          if (counts) parts.push(label(`${metalCount(name)} / ${learning[name].length} metal`, P ? 2.5 : 2.95, P ? y + 0.55 : y, 17, METAL, true));
        });
      }
    }
    if (pool) {
      parts.push(label('PHOTOS TO ASK ABOUT', 0, poolY + 0.81, 20, C.muted, true));
      photos.forEach((photo, i) => {
        if (photo.added) return;
        const card = photoCard(photo, i, { appearance, predictions, selected, tied });
        const ghost = new M.Line({ start: position(-0.62, 0.6), end: position(0.62, -1.25), color: C.bg, strokeWidth: 0 });
        const g = group([ghost, ...card]);
        g.scale(SC);
        g.moveTo(position(poolX(i), poolY - 0.325 * SC));
        parts.push(g);
      });
    }
    return group(parts);
  }

  function analogy(priority) {
    const y0 = P ? -1.0 : -0.43;
    const parts = [label('Student with two questions', 0, y0 + 1.24, 23)];
    const spot = i => P ? [0, i ? -3.4 : -1.0] : [i === 0 ? -2.0 : 2.0, y0];
    ['I understand this', 'I’m unsure about this'].forEach((text, i) => {
      const [x, y] = spot(i);
      const color = i === priority ? C.amber : C.muted;
      parts.push(rect(x, y, P ? 4.6 : 3.7, P ? 1.22 : 1.5, color), label(text, x, y + 0.2, P ? 19 : 22, color),
        label(i === 0 ? '✓' : '?', x, y - 0.3, 25, color));
    });
    if (priority >= 0) parts.push(label('Ask the teacher', spot(priority)[0], spot(priority)[1] - (P ? 0.95 : 1), 19, C.amber));
    return group(parts);
  }

  const trainGroups = { train: true, appearance: true, counts: true, labelled: groups };
  const model = { ...trainGroups, predictions: groups };
  const errors = [];
  const loss = guesses => validation.reduce((sum, [, name, answer]) => sum + (guesses[name] - answer) ** 2, 0) / validation.length;
  const guesses = () => Object.fromEntries(groups.map(name => [name, probability(name)]));
  const baseline = guesses();
  errors.push(loss(baseline));
  let transfer = null;

  async function addPhoto(photo, title, rows) {
    const index = photos.indexOf(photo);
    const members = learning[photo.group];
    const targetX = trainX(members.length), targetY = trainY(groups.indexOf(photo.group));
    members.push([photo.id, photo.answer]);
    photo.added = true;
    function token(x, y) {
      return group([rect(x, y, PW, PH, colorOf(photo.answer)),
        label(photo.id, x, y + 0.015, P ? 15 : 16, colorOf(photo.answer), true)]);
    }
    transfer = token(poolX(index), poolY);
    const target = token(targetX, targetY);
    await frame(title, {
      art: board({ ...model, arriving: photo.id }), rows, color: colorOf(photo.answer),
      animate: [new M.Transform(transfer, target, { runTime: 0.66, pathArc: 0.35 })]
    });
    errors.push(loss(guesses()));
  }

  async function finishTransfer(title, options) {
    const animate = [new M.FadeOut(transfer, { runTime: 0.22 })];
    transfer = null;
    await frame(title, { ...options, animate });
  }

  function checkingTable(stage) {
    const top = P ? 0.9 : 0.96, step = P ? 1.05 : 0.55;
    const columns = stage < 2
      ? [['Photo', -2.63], ['Surface', -1.25], ['Answer', 0.39], ['Guess', 2.28]]
      : [['Photo', -2.75], ['Answer', -1.46], ['Guess', -0.16], ['Distance', 1.18], ['Squared', 2.59]];
    const parts = columns.map(([text, x]) => label(text, x, top, 17, C.muted));
    validation.forEach(([id, name, answer], i) => {
      const y = top - step * (i + 1);
      const p = baseline[name];
      const distance = Math.abs(p - answer);
      parts.push(line(-3.27, y + step * 0.5, 3.27, y + step * 0.5), label(id, columns[0][1], y, 18, C.ink, true));
      if (stage < 2) {
        parts.push(label(name, columns[1][1], y, 18),
          label(material(answer), columns[2][1], y, 18, colorOf(answer)));
        if (stage === 1) parts.push(label(percent(p), columns[3][1], y, 18, C.cyan, true));
      } else {
        parts.push(label(answer, columns[1][1], y, 18, colorOf(answer), true),
          label(p.toFixed(2), columns[2][1], y, 18, C.cyan, true),
          label(distance.toFixed(2), columns[3][1], y, 18, C.amber, true));
        if (stage === 3) parts.push(label((distance ** 2).toFixed(3), columns[4][1], y, 18, C.green, true));
      }
    });
    return group(parts);
  }

  function curve(count) {
    const x = i => -2.16 + i * 1.58;
    const base = P ? -5.6 : -2.04, top = P ? 0.5 : 0.68;
    const y = value => base + value / 0.16 * (top - base);
    const parts = [label('ERROR ON THE SAME FOUR CHECKING PHOTOS', 0, top + 0.52, 17, C.muted, true)];
    for (const value of [0, 0.04, 0.08, 0.12, 0.16]) {
      parts.push(line(-2.63, y(value), 3.19, y(value)), label(value.toFixed(2), -3.16, y(value), 15, C.muted, true));
    }
    for (let i = 0; i <= 3; i++) parts.push(label(i, x(i), base - 0.29, 16, C.muted, true));
    parts.push(label('Worker answers added', 0.54, base - 0.66, 18, C.muted));
    errors.slice(0, count).forEach((value, i) => {
      if (i) parts.push(line(x(i - 1), y(errors[i - 1]), x(i), y(value), C.cyan, 3));
      parts.push(dot(x(i), y(value), 0.075, C.cyan),
        i === 0 ? label(value.toFixed(3), x(i), y(value) - (P ? 0.62 : 0.34), 16, C.cyan, true)
        : label(value.toFixed(3), x(i), y(value) + 0.34, 16, C.cyan, true));
    });
    return group(parts);
  }

  function distanceRuler() {
    const y = P ? -2.6 : -0.75;
    const x = value => -2.75 + 5.5 * value;
    const parts = [line(x(0), y, x(1), y, C.muted)];
    for (const [value, text, color] of [[0, '0%', C.muted], [0.5, '50%', C.amber], [2 / 3, '≈67%', C.cyan], [1, '100%', C.muted]]) {
      parts.push(line(x(value), y - 0.11, x(value), y + 0.11, color),
        label(text, x(value), y - (value === 2 / 3 ? 0.64 : 0.29), 18, color, true));
    }
    parts.push(line(x(0.5), y + 0.23, x(2 / 3), y + 0.23, C.amber, 4),
      label('≈17 percentage points', (x(0.5) + x(2 / 3)) / 2, y + 0.58, 18, C.amber));
    return group(parts);
  }

  await until(S(0)); await frame('5 UNLABELLED PHOTOS', { art: board() });
  await until(S(1)); await frame('THE WORKER CAN CHECK 3', { rows: [['□    □    □', C.amber], '3 checks available'], color: C.amber });
  await until(S(2)); await frame('WHICH THREE SHOULD WE ASK ABOUT?', { rows: ['Choose 3 of 5', ['?    ?    ?', C.amber]], color: C.amber });
  await until(S(3)); await frame('12 PHOTOS ALREADY LABELLED', { art: board({ train: true, pool: false }), rows: null });
  await until(S(4)); await frame('7 MATTE PHOTOS', { art: board({ train: true, pool: false, labelled: ['Matte'] }) });
  await until(S(5)); await frame('ALL 7 ARE PLASTIC', {
    art: board({ train: true, pool: false, labelled: ['Matte'], counts: true }), rows: [['7 plastic', PLASTIC]], color: PLASTIC
  });
  await until(S(6)); await frame('2 OF 3 SHINY ITEMS ARE METAL', {
    art: board({ train: true, pool: false, labelled: ['Matte', 'Shiny'], counts: true }),
    rows: [['2 metal', METAL], ['1 plastic', PLASTIC]], color: METAL
  });
  await until(S(7)); await frame('2 MIXED PHOTOS', {
    art: board({ ...trainGroups, pool: false }), rows: [['1 plastic', PLASTIC], ['1 metal', METAL]]
  });
  await until(S(8)); await frame('BACK TO THE 5 NEW PHOTOS', { art: board(), rows: null });
  await until(S(9)); await frame('1 MATTE · 2 MIXED · 2 SHINY', { art: board({ appearance: true }) });
  await until(S(10)); await frame('WHICH QUESTION SHOULD A STUDENT ASK?', { art: analogy(-1) });
  await until(S(11)); await frame('ASK ABOUT SOMETHING YOU KNOW?', { art: analogy(0) });
  await until(S(12)); await frame('ASK WHERE YOU ARE UNSURE', { art: analogy(1), color: C.amber });
  await until(S(13)); await frame('THE WORKER CAN ANSWER OUR QUESTIONS', { art: board({ appearance: true }) });
  await until(S(14)); await frame('ACTIVE LEARNING', { rows: ['Choose a photo', 'Ask a human for its label'] });
  await until(S(15)); await frame('WHICH PHOTO GOES FIRST?', { art: board(trainGroups), rows: null });
  await until(S(16)); await frame('LOOK AT PHOTOS WITH THE SAME SURFACE', { rows: ['Chance of metal =', 'metal labels ÷ all labels'] });
  await until(S(17)); await frame('MATTE', {
    art: board({ ...model, predictions: ['Matte'] }), rows: [['0 ÷ 7 = 0%', C.cyan]]
  });
  await until(S(18)); await frame('SHINY', {
    art: board({ ...model, predictions: ['Matte', 'Shiny'] }), rows: [['2 ÷ 3 ≈ 67%', C.cyan]]
  });
  await until(S(19)); await frame('MIXED', { art: board(model), rows: [['1 ÷ 2 = 50%', C.cyan]] });
  await until(S(20)); await frame('EQUALLY LIKELY', {
    art: board({ ...model, tied: ['U2', 'U3'] }), rows: [['50% plastic', PLASTIC], ['50% metal', METAL]]
  });
  await until(S(21)); await frame('MOST UNSURE AT 50%', { rows: [['50% is the midpoint', C.amber]], color: C.amber });
  await until(S(22)); await frame('CHOOSE THE CLOSEST TO 50%', {
    rows: ['U1      50 points away', 'U2, U3   0 points away', 'U4, U5 ≈17 points away'], color: C.amber
  });
  await until(S(23)); await frame('TIE: FIRST IN THE LIST', { rows: [['U2 comes before U3', C.amber]], color: C.amber });
  await until(S(24)); await frame('ROUND 1 · CHOOSE U2', {
    art: board({ ...model, selected: 'U2', tied: ['U3'] }), rows: ['Mixed prediction: 50%', 'Checked: 0 / 3'], color: C.amber
  });
  photos[1].answer = 1;
  await until(S(25)); await frame('THE WORKER CONFIRMS METAL', {
    art: board({ ...model, selected: 'U2' }), rows: [['U2 ✓ Metal', METAL], 'Checked: 1 / 3'], color: METAL
  });
  await until(S(26)); await addPhoto(photos[1], 'ADD U2 TO THE LEARNING PHOTOS', [['U2 joins Mixed', METAL]]);
  await until(S(27)); await finishTransfer('MIXED NOW HAS 2 METAL OUT OF 3', {
    art: board(model), rows: [['2 metal / 3 labelled', METAL]], color: METAL
  });
  await until(S(28)); await frame('MIXED RISES TO ABOUT 67%', { rows: ['Before: 1 ÷ 2 = 50%', ['Now:    2 ÷ 3 ≈ 67%', C.cyan]] });
  await until(S(29)); await frame('ROUND 2 · THREE PHOTOS TIE', {
    art: board({ ...model, tied: ['U3', 'U4', 'U5'] }), rows: ['U3, U4, U5: 2 ÷ 3', 'Same distance from 50%'], color: C.violet
  });
  await until(S(30)); await frame('CHOOSE U3', {
    art: board({ ...model, selected: 'U3', tied: ['U4', 'U5'] }), rows: ['U3 comes first', 'Checked: 1 / 3'], color: C.amber
  });
  photos[2].answer = 0;
  await until(S(31)); await frame('THE WORKER CONFIRMS PLASTIC', {
    art: board({ ...model, selected: 'U3' }), rows: [['U3 ✓ Plastic', PLASTIC], 'Checked: 2 / 3'], color: PLASTIC
  });
  await until(S(32)); await addPhoto(photos[2], 'MIXED NOW HAS 2 METAL OUT OF 4', [['2 metal / 4 labelled', METAL]]);
  await until(S(33)); await finishTransfer('MIXED RETURNS TO 50%', {
    art: board(model), rows: ['Before: 2 ÷ 3 ≈ 67%', ['Now:    2 ÷ 4 = 50%', C.cyan]]
  });
  await until(S(34)); await frame('ROUND 3 · THE TWO SHINY PHOTOS TIE', {
    art: board({ ...model, tied: ['U4', 'U5'] }), rows: ['U4 and U5: 2 ÷ 3', 'Same distance from 50%'], color: C.violet
  });
  photos[3].answer = 1;
  await until(S(35)); await frame('U4 FIRST · THE WORKER CONFIRMS METAL', {
    art: board({ ...model, selected: 'U4', tied: ['U5'] }), rows: ['U4 comes before U5', ['U4 ✓ Metal', METAL]], color: METAL
  });
  await until(S(36)); await addPhoto(photos[3], 'SHINY NOW HAS 3 METAL OUT OF 4', [['3 metal / 4 labelled', METAL]]);
  await until(S(37)); await finishTransfer('SHINY RISES TO 75%', {
    art: board(model), rows: [`Before: 2 ÷ 3 ${approx('Shiny')}`, ['Now:    3 ÷ 4 = 75%', C.cyan]]
  });
  await until(S(38)); await frame('THE WORKER HAS USED ALL 3 CHECKS', { rows: [['✓    ✓    ✓', C.green], 'Checked: 3 / 3'], color: C.green });
  await until(S(39)); await frame('15 LABELLED · 2 STILL UNLABELLED', {
    rows: [['10 plastic', PLASTIC], ['5 metal', METAL], 'U1 and U5 still unlabelled']
  });
  await until(S(40)); await frame('DID EACH ANSWER HELP?', { rows: null, color: C.amber });
  await until(S(41)); await frame('4 SEPARATE CHECKING PHOTOS', { art: checkingTable(0), rows: ['Used only to check predictions'] });
  await until(S(42)); await frame('DISTANCE FROM THE CORRECT ANSWER', {
    art: checkingTable(2), rows: ['Plastic = 0  Metal = 1', ['V3: |0.50 − 0| = 0.50', C.amber]], color: C.amber
  });
  await until(S(43)); await frame('SQUARE EACH DISTANCE, THEN TAKE THE MEAN', {
    art: checkingTable(3), rows: ['V3: 0.50 × 0.50 = 0.25', 'Add the 4 squares', 'Divide by 4'], color: C.green
  });
  await until(S(44)); await frame('MEAN SQUARED PREDICTION ERROR', {
    rows: ['Mean of squared distances', ['Smaller is better', C.green]], color: C.green
  });
  await until(S(45)); await frame('BEFORE ASKING: ABOUT 0.09', { art: curve(1), rows: ['0 answers · error 0.090'] });
  await until(S(46)); await frame('AFTER U2: ERROR RISES TO ABOUT 0.14', {
    art: curve(2), rows: ['U2 ✓ Metal', ['0.090 → 0.139', C.amber]], color: C.amber
  });
  await until(S(47)); await frame('AFTER U3: BACK TO ABOUT 0.09', {
    art: curve(3), rows: ['U3 ✓ Plastic', ['0.139 → 0.090', C.green]], color: C.green
  });
  await until(S(48)); await frame('AFTER U4: DOWN TO ABOUT 0.08', {
    art: curve(4), rows: ['U4 ✓ Metal', ['0.090 → 0.078', C.green]], color: C.green
  });
  await until(S(49)); await frame('A CORRECT LABEL CAN RAISE CHECKING ERROR', {
    rows: ['U2 really was metal', ['Checking error rose', C.amber]], color: C.amber
  });
  await until(S(50)); await frame('THE RULE FOR CHOOSING A QUESTION', { art: distanceRuler(), rows: null });
  await until(S(51)); await frame('UNCERTAINTY DISTANCE', {
    rows: ['|chance of metal − 50%|', ['Example: |67% − 50%|', C.amber]], color: C.amber
  });
  await until(S(52)); await frame('CHOOSE THE SMALLEST DISTANCE', {
    rows: ['Measure how far from 50%', ['Either direction counts', C.amber]], color: C.amber
  });
  await until(S(53)); await frame('CONFIDENT PREDICTIONS CAN STILL BE WRONG', {
    art: board(model), rows: ['U5: 75% chance of metal', 'Still waiting for a label'], color: C.violet
  });
  await until(S(54)); await frame('ACTIVE LEARNING', {
    rows: ['Choose examples to ask about', 'Get labels from a human', ['3 checks used on U2, U3, U4', C.green]], color: C.green
  });
}
