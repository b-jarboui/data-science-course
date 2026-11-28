// 12.3.2 The bias–variance tradeoff. Beat i = narration sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const prices = [10, 6, 8, 7, 3, 5];
  const guesses = [[4, 5, 5, 6], [5, 6, 6, 7], [3, 5, 7, 9]];
  const names = ['Yellow line', 'Green curve', 'Pink curve'];
  const colors = [C.amber, C.green, C.pink];
  const training = [2, 1.9, 0];
  const bias2 = [1, 0, 0];
  const variance = [0.5, 0.5, 5];
  const test = bias2.map((b, i) => b + variance[i] + 1);
  const target = 6;
  const point = (x, y) => [x, y, 0];

  function text(value, x, y, color = C.ink, size = 21) {
    const label = T(String(value), size, color, true);
    label.moveTo(point(x, y));
    return label;
  }

  function line(x1, y1, x2, y2, color = C.muted, width = 2, dashed = false) {
    const Shape = dashed ? M.DashedLine : M.Line;
    return new Shape({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth: width });
  }

  function rect(x, y, width, height, color, opacity = 0.85) {
    const shape = new M.Rectangle({ width, height, color, strokeWidth: 1 });
    shape.setFill(color, opacity);
    shape.moveTo(point(x, y));
    return shape;
  }

  function dot(x, y, color = C.cyan, cargo = false) {
    if (cargo) return new M.VGroup(rect(x, y, 0.33, 0.33, color, 0.15), rect(x, y, 0.17, 0.17, color));
    const p = point(x, y);
    const halo = new M.Dot({ point: p, radius: 0.15, color });
    halo.setFill(color, 0.18);
    const core = new M.Dot({ point: p, radius: 0.085, color });
    core.setFill(color, 1);
    return new M.VGroup(halo, core);
  }

  let currentPicture = null;
  let currentBox = null;
  let currentTitle = '';
  let pictureKey = '';
  let boxKey = '';

  function formula(rows, color) {
    const labels = rows.map(row => T(row, P ? 22 : 21, C.ink, true));
    const width = Math.min(P ? FW - 1.2 : 4.0, Math.max(...labels.map(t => t.getWidth())) + 0.62);
    const pitch = 0.39;
    const height = labels.length * pitch + 0.17;
    const card = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    card.setFill(C.card, 0.95);
    card.moveTo(BOXP);
    labels.forEach((t, i) => {
      const scale = Math.min(1, (width - 0.5) / t.getWidth());
      if (scale < 1) t.scale(scale);
      t.moveTo(point(BOXP[0] - width / 2 + 0.25 + t.getWidth() / 2,
        BOXP[1] + (labels.length - 1 - 2 * i) * pitch / 2));
    });
    return new M.VGroup(card, ...labels);
  }

  // Each picture owns its objects from creation through removal.
  async function frame(title, picture, rows = [], color = C.cyan) {
    const animations = [];
    if (picture && picture.key !== pictureKey) {
      if (currentPicture) animations.push(new M.FadeOut(currentPicture, { runTime: 0.25 }));
      currentPicture = picture.draw();
      pictureKey = picture.key;
      animations.push(new M.FadeIn(currentPicture, { runTime: 0.45 }));
    }
    const nextBoxKey = rows.length ? JSON.stringify([rows, color]) : '';
    if (nextBoxKey !== boxKey) {
      if (currentBox) animations.push(new M.FadeOut(currentBox, { runTime: 0.25 }));
      currentBox = rows.length ? formula(rows, color) : null;
      boxKey = nextBoxKey;
      if (currentBox) animations.push(new M.FadeIn(currentBox, { runTime: 0.45 }));
    }
    const nextTitle = `${color}:${title}`;
    if (nextTitle !== currentTitle) {
      animations.push(...showA(title, color, PILL));
      currentTitle = nextTitle;
    }
    if (animations.length) await play(...animations);
  }

  const picture = (key, draw) => ({ key, draw });
  const placed = (shape, x, y) => {
    shape.moveTo(point(x, y));
    return shape;
  };
  const ring = (x, y, radius, color) =>
    placed(new M.Circle({ radius, color, strokeWidth: 2 }), x, y);

  function bike(x, y, scale, color) {
    const xy = (a, b) => [x + a * scale, y + b * scale];
    const spoke = (a, b, c, d) => line(...xy(a, b), ...xy(c, d), color, 3);
    return new M.VGroup(
      ring(...xy(-0.65, 0), 0.32 * scale, color),
      ring(...xy(0.65, 0), 0.32 * scale, color),
      spoke(-0.65, 0, 0, 0), spoke(0, 0, -0.3, 0.51), spoke(-0.3, 0.51, -0.65, 0),
      spoke(-0.3, 0.51, 0.46, 0.51), spoke(0, 0, 0.46, 0.51),
      spoke(0.46, 0.51, 0.65, 0), spoke(0.46, 0.51, 0.39, 0.77),
      spoke(0.39, 0.77, 0.66, 0.77), spoke(-0.54, 0.57, -0.22, 0.57)
    );
  }

  const shop = customer => picture(`shop-${customer}`, () => {
    const y = BASE + 1.8;
    const canopy = Array.from({ length: 7 }, (_, i) =>
      rect(CX + (i - 3) * 0.54, y + 1.05, 0.53, 0.26, i % 2 ? C.card : C.cyan));
    return new M.VGroup(
      rect(CX, y + 0.1, 3.8, 1.85, C.muted, 0.08), ...canopy,
      text('USED BIKES', CX, y + 1.5, C.cyan, 23),
      bike(CX, y - 0.36, 1.08, C.cyan),
      ...(customer ? [text('?', CX + 2.48, y + 0.1, C.amber, 38)] : [])
    );
  });

  const receipts = values => picture(`receipts-${values}`, () => new M.VGroup(
    ...prices.map((v, i) => {
      const x = CX + (i % 3 - 1) * 1.97;
      const y = BASE + 2.9 - Math.floor(i / 3) * 1.45;
      return new M.VGroup(rect(x, y, 1.7, 1.22, C.cyan, 0.10),
        text(`Bike ${i + 1}`, x, y + (values ? 0.36 : 0), C.cyan, 18),
        ...(values ? [text(`${i + 1} yr`, x, y, C.ink, 17),
          text(`$${v * 100}`, x, y - 0.35, C.ink, 17)] : []));
    })
  ));

  const gx = x => CX - 2.65 + (x - 1) * 1.04;
  const gy = y => BASE + 0.67 + y * 0.235;
  const yellow = x => 10 - x;
  // Least-squares quadratic on the six bikes: 11 - 1.75x + (3/28)x^2, training MSE 81/42 = 1.93 (chapters/12.3.md).
  const green = x => 11 - 1.75 * x + 3 / 28 * x * x;
  const pink = x => prices.reduce((total, v, i) => total + v * prices.reduce(
    (weight, _, j) => i === j ? weight : weight * (x - j - 1) / (i - j), 1), 0);
  const curves = [yellow, green, pink];

  function plot(rules = [], mark = '') {
    return picture(`plot-${rules.join()}-${mark}`, () => {
      const x0 = gx(1) - 0.38, right = gx(6) + 0.23;
      const parts = [
        line(x0, gy(0), right, gy(0)), line(x0, gy(0), x0, gy(11)),
        text('Age (years)', CX, BASE + 0.06, C.muted, 19),
        text(mark === 'dollars' ? 'Price (hundreds of dollars)' : 'Sale price ($100s)',
          CX, gy(11) + 0.37, C.muted, 19)
      ];
      for (const v of [0, 5, 10]) {
        parts.push(line(x0 - 0.08, gy(v), right, gy(v), C.line, 1));
        parts.push(text(v, x0 - 0.28, gy(v), mark === 'dollars' && v === 10 ? C.amber : C.muted, 17));
      }
      prices.forEach((_, i) => parts.push(text(i + 1, gx(i + 1), gy(0) - 0.25, C.muted, 18)));
      rules.forEach(rule => {
        const n = rule === 0 ? 1 : 40;
        for (let k = 0; k < n; k++) {
          const a = 1 + 5 * k / n, b = 1 + 5 * (k + 1) / n;
          parts.push(line(gx(a), gy(curves[rule](a)), gx(b), gy(curves[rule](b)), colors[rule], 3));
        }
      });
      if (mark === 'gaps') {
        prices.forEach((v, i) => {
          const x = gx(i + 1);
          parts.push(line(x, gy(v), x, gy(yellow(i + 1)), C.violet, 3, true));
          parts.push(line(x - 0.09, gy(yellow(i + 1)), x + 0.09, gy(yellow(i + 1)), C.amber, 2));
        });
      }
      if (mark === 'age4') parts.push(line(gx(4), gy(0), gx(4), gy(11), C.amber, 2, true));
      prices.forEach((v, i) => parts.push(dot(gx(i + 1), gy(v), C.cyan, i === 2 || i === 5)));
      return new M.VGroup(...parts);
    });
  }

  const samples = (n, stage = '') => picture(`samples-${n}-${stage}`, () => {
    const parts = [];
    for (let r = 0; r < n; r++) {
      const y = BASE + 3.18 - r * 0.8;
      parts.push(text(n === 1 ? 'Sample' : `Sample ${r + 1}`, CX - 2.39, y, C.ink, 18));
      for (let k = 0; k < 6; k++) {
        const x = CX - 1.24 + k * 0.4;
        parts.push(dot(x, y, stage === 'town' || (stage === 'new' && (r + k) % 3 === 0) ? C.violet : C.cyan));
      }
      if (stage === 'rules' || stage === 'age4') {
        colors.forEach((color, i) => parts.push(rect(CX + 1.65 + i * 0.49, y, 0.30, 0.11, color)));
      }
    }
    if (stage === 'age4') parts.push(text('One question for every rule: age 4?', CX, BASE + 0.36, C.amber, 19));
    return new M.VGroup(...parts);
  });

  const bullseye = mode => picture(`dart-${mode}`, () => {
    const y = BASE + 1.85;
    const marks = [
      [],
      [[-0.91, 0.28], [-0.67, 0.43], [-0.74, 0.07], [-0.52, 0.25]],
      [[-1.02, 0.54], [-0.42, -0.82], [0.66, -0.51], [0.78, 0.79]]
    ][mode];
    return new M.VGroup(...[0.3, 0.67, 1.05, 1.4].map(r => ring(CX, y, r, C.muted)),
      dot(CX, y, C.cyan), ...marks.map(([dx, dy]) => dot(CX + dx, y + dy, mode === 1 ? C.amber : C.pink)));
  });

  const px = v => CX + (v - target) * 0.59;
  const stripY = BASE + 0.63;

  function strips(ids, means = false, gaps = '') {
    return picture(`strips-${ids.join()}-${means}-${gaps}`, () => {
      const parts = [line(px(2), stripY, px(10), stripY),
        line(px(target), stripY + 0.16, px(target), BASE + 3.37, C.cyan, 2, true),
        text('Target 6', px(target), BASE + 3.61, C.cyan, 18),
        text('Guess ($100s)', CX, BASE + 0.04, C.muted, 18)];
      for (let value = 2; value <= 10; value++) {
        parts.push(text(value, px(value), stripY - 0.27, value === target ? C.cyan : C.muted, 17));
      }
      ids.forEach((i, row) => {
        const y = BASE + (ids.length === 1 ? 1.97 : 2.93 - row * 0.83);
        const entries = i === 3 ? [5, 7] : i === 4 ? [] : guesses[i];
        const color = colors[i] ?? C.violet;
        const mean = i === 0 ? 5 : 6;
        const name = names[i] ?? (i === 3 ? 'Real sales' : 'Perfect guess');
        parts.push(text(name, CX - 2.78, y + 0.16, color, 17));
        if (means || gaps) {
          parts.push(rect(px(mean), y - 0.23, 0.10, 0.19, color));
          if (gaps === 'bias' && mean !== target) {
            parts.push(line(px(mean), y - 0.36, px(target), y - 0.36, C.amber, 3));
          }
          if (gaps === 'mean' || gaps === 'target') {
            const ref = gaps === 'mean' ? mean : target;
            entries.forEach((v, k) => {
              if (v !== ref) parts.push(line(px(v), y - 0.25 - k * 0.1, px(ref), y - 0.25 - k * 0.1, color, 2));
            });
          }
        }
        entries.forEach((v, k) => {
          const prior = entries.slice(0, k).filter(x => x === v).length;
          parts.push(dot(px(v), y + 0.21 + prior * 0.24, color));
        });
      });
      return new M.VGroup(...parts);
    });
  }

  function table(key, headers, rows, rowColors = []) {
    return picture(`table-${key}`, () => {
      const xs = headers.length === 5
        ? [-2.42, -0.92, 0.30, 1.52, 2.74]
        : [-2.16, 0.03, 2.12];
      const top = BASE + 3.31;
      const parts = headers.map((header, i) => text(header, CX + xs[i], top, C.muted, 18));
      rows.forEach((row, i) => {
        const y = top - (i + 1) * 0.75;
        parts.push(line(CX - 3.22, y + 0.37, CX + 3.25, y + 0.37, C.line, 1));
        row.forEach((value, col) => parts.push(text(value, CX + xs[col], y, rowColors[i] ?? C.ink, 20)));
      });
      return new M.VGroup(...parts);
    });
  }

  const summary = n => table(`bias-${n}`, ['Rule', 'Bias²', 'Variance'],
    names.slice(0, n).map((name, i) => [name, bias2[i], variance[i]]), colors);

  function errorParts(n) {
    return picture(`parts-${n}`, () => {
      const left = CX - 1.7, unit = 0.69;
      const partColors = [C.amber, C.violet, C.cyan];
      const parts = ['Bias²', 'Variance', 'Noise'].map((label, i) =>
        text(label, CX + (i - 1) * 1.85, BASE + 3.43, partColors[i], 19));
      for (let i = 0; i < n; i++) {
        const y = BASE + 2.68 - i * 0.94;
        parts.push(text(names[i].split(' ')[0], CX - 2.56, y, colors[i], 19));
        let offset = 0;
        [bias2[i], variance[i], 1].forEach((v, j) => {
          if (v > 0) parts.push(rect(left + (offset + v / 2) * unit, y, v * unit - 0.025, 0.31, partColors[j]));
          offset += v;
        });
        parts.push(text(test[i], left + offset * unit + 0.31, y, colors[i], 20));
      }
      return new M.VGroup(...parts);
    });
  }

  function compare(mode, focus = -1) {
    return picture(`compare-${mode}-${focus}`, () => {
      const labels = { train: 'Training', test: 'New age 4', both: 'Training     New age 4' };
      const parts = [text(labels[mode], CX + 0.45, BASE + 3.45, C.ink, 20)];
      names.forEach((name, i) => {
        const y = BASE + 2.73 - i * 0.95, x = CX - 1.24, width = 0.62;
        const nameColor = focus === -1 || focus === i ? colors[i] : C.muted;
        parts.push(text(name.split(' ')[0], CX - 2.42, y, nameColor, 20));
        const bar = (v, at, color) => {
          if (v) parts.push(rect(x + v * width / 2, at, v * width, 0.24, color, 0.82));
          parts.push(text(v, x + v * width + 0.28, at, color, 18));
        };
        if (mode !== 'test') bar(training[i], y + (mode === 'both' ? 0.18 : 0), C.cyan);
        if (mode !== 'train') bar(test[i], y - (mode === 'both' ? 0.18 : 0), C.violet);
      });
      return new M.VGroup(...parts);
    });
  }

  // The shop, its six records, and the three candidate rules.
  await until(S(0)); await frame('USED BIKE SHOP', shop(false));
  await until(S(1)); await frame('WHAT IS A FAIR PRICE?', shop(true), [], C.amber);
  await until(S(2)); await frame('SIX BIKES ALREADY SOLD', receipts(false));
  await until(S(3)); await frame('AGE AND SALE PRICE', receipts(true));
  await until(S(4)); await frame('ONE DOT PER BIKE', plot());
  await until(S(5)); await frame('OLDER →     HIGHER PRICE ↑', plot());
  await until(S(6)); await frame('PRICES IN HUNDREDS', plot([], 'dollars'), ['10 × $100 = $1,000'], C.amber);
  await until(S(7)); await frame('OLDER BIKES MOSTLY SELL FOR LESS', plot());
  await until(S(8)); await frame('AGE → PRICE GUESS', plot([], 'age4'), [], C.amber);
  await until(S(9)); await frame('THE RULE IS A MODEL', plot([], 'age4'));
  await until(S(10)); await frame('HOW BENDY SHOULD IT BE?', plot(), [], C.amber);
  await until(S(11)); await frame('THREE RULES TO TRY', plot());
  await until(S(12)); await frame('YELLOW: STRAIGHT LINE', plot([0]), [], C.amber);
  await until(S(13)); await frame('GREEN: GENTLE BEND', plot([0, 1]), [], C.green);
  await until(S(14)); await frame('PINK: THROUGH EVERY DOT', plot([0, 1, 2]), [], C.pink);

  // Training misses, then fresh samples and the age-four target.
  await until(S(15)); await frame('TRAINING ERROR', plot([0]), [], C.amber);
  await until(S(16)); await frame('MISS = TRUE PRICE − GUESS', plot([0], 'gaps'), ['Bike 2: 6 − 8 = −2'], C.violet);
  await until(S(17)); await frame('SQUARE EACH MISS', plot([0], 'gaps'), ['Bike 2: (−2) × (−2) = 4'], C.violet);
  await until(S(18)); await frame('ADD, THEN DIVIDE BY SIX', plot([0], 'gaps'), ['1 + 4 + 1 + 1 + 4 + 1', 'Divide the total by 6']);
  await until(S(19)); await frame('YELLOW TRAINING ERROR', plot([0], 'gaps'), ['12 ÷ 6 = 2'], C.amber);
  await until(S(20)); await frame('GREEN TRAINING ERROR', plot([1]), ['Training error ≈ 1.9', 'Just below 2'], C.green);
  await until(S(21)); await frame('PINK TRAINING ERROR', plot([2]), ['Every miss is 0', 'Training error = 0'], C.pink);
  await until(S(22)); await frame('DOES PINK WIN?', compare('train', 2), [], C.pink);
  await until(S(23)); await frame('SIX BIKES ARE ONE SAMPLE', samples(1));
  await until(S(24)); await frame('A DIFFERENT HANDFUL', samples(1, 'new'));
  await until(S(25)); await frame('SIX FRESH BIKES, THREE NEW FITS', samples(1, 'rules'));
  await until(S(26)); await frame('FOUR SAMPLES', samples(4, 'rules'), ['4 versions of each rule']);
  await until(S(27)); await frame('ASK EVERY RULE ABOUT AGE FOUR', samples(4, 'age4'), [], C.amber);
  await until(S(28)); await frame('HUNDREDS OF TOWN SALES AT AGE 4', samples(4, 'town'));
  await until(S(29)); await frame('THE TARGET IS SIX', strips([]), ['Town average:', '6 × $100 = $600']);
  await until(S(30)); await frame('THE TARGET IS SIX', strips([]), ['Age 4 target = 6']);

  // Darts, guess distributions, then the bias and variance calculations.
  await until(S(31)); await frame('TWO WAYS TO MISS THE BULLSEYE', bullseye(0));
  await until(S(32)); await frame('AIM OFF TO ONE SIDE', bullseye(1), [], C.amber);
  await until(S(33)); await frame('A SHAKY HAND SCATTERS DARTS', bullseye(2), [], C.pink);
  await until(S(34)); await frame('YELLOW’S FOUR GUESSES', strips([0]), ['4, 5, 5, 6'], C.amber);
  await until(S(35)); await frame('YELLOW AVERAGE: FIVE', strips([0], true, 'bias'), ['20 ÷ 4 = 5', '1 below the target'], C.amber);
  await until(S(36)); await frame('CLOSE TOGETHER, MOSTLY LOW', strips([0], true, 'bias'), [], C.amber);
  await until(S(37)); await frame('GREEN’S FOUR GUESSES', strips([1]), ['5, 6, 6, 7'], C.green);
  await until(S(38)); await frame('CLOSE TOGETHER, RIGHT ON TARGET', strips([1], true), ['24 ÷ 4 = 6'], C.green);
  await until(S(39)); await frame('PINK’S FOUR GUESSES', strips([2]), ['3, 5, 7, 9'], C.pink);
  await until(S(40)); await frame('ON TARGET ON AVERAGE, WIDE SCATTER', strips([2], true, 'mean'), ['24 ÷ 4 = 6'], C.pink);
  await until(S(41)); await frame('OFF-CENTRE AIM AND SCATTER', strips([0, 1, 2], true));
  await until(S(42)); await frame('BIAS: AVERAGE VS TARGET', strips([0], true, 'bias'), [], C.amber);
  await until(S(43)); await frame('VARIANCE: SPREAD ABOUT THE AVERAGE', strips([2], true, 'mean'), [], C.pink);
  await until(S(44)); await frame('ONE RULE AT A TIME', strips([0, 1, 2], true));
  await until(S(45)); await frame('YELLOW BIAS', strips([0], true, 'bias'), ['Average = 5, target = 6', 'Bias = −1 (1 below)'], C.amber);
  await until(S(46)); await frame('SQUARE THE BIAS', strips([0], true, 'bias'), ['(−1) × (−1) = 1'], C.amber);
  await until(S(47)); await frame('DISTANCE FROM YELLOW’S OWN AVERAGE', strips([0], true, 'mean'), ['Measure from 5'], C.amber);
  await until(S(48)); await frame('SQUARE THE FOUR DISTANCES', strips([0], true, 'mean'), ['Distances: 1, 0, 0, 1', 'Squared:   1, 0, 0, 1'], C.amber);
  await until(S(49)); await frame('YELLOW VARIANCE', strips([0], true, 'mean'), ['1 + 0 + 0 + 1 = 2', '2 ÷ 4 = 0.5'], C.amber);
  await until(S(50)); await frame('GREEN BIAS', strips([1], true, 'bias'), ['6 − 6 = 0'], C.green);
  await until(S(51)); await frame('SAME SPREAD AROUND ITS OWN MEAN', strips([0, 1], true, 'mean'), ['Green: 2 ÷ 4 = 0.5', 'Yellow: 2 ÷ 4 = 0.5'], C.green);
  await until(S(52)); await frame('PINK BIAS', strips([2], true, 'bias'), ['6 − 6 = 0'], C.pink);
  await until(S(53)); await frame('PINK DISTANCES FROM SIX', strips([2], true, 'mean'), ['3, 1, 1, 3'], C.pink);
  await until(S(54)); await frame('PINK SQUARED DISTANCES', strips([2], true, 'mean'), ['9 + 1 + 1 + 9 = 20'], C.pink);
  await until(S(55)); await frame('PINK VARIANCE', strips([2], true, 'mean'), ['20 ÷ 4 = 5', '5 ÷ 0.5 = 10'], C.pink);
  await until(S(56)); await frame('WHICH RULE PRICES NEW BIKES BEST?', summary(3));
  await until(S(57)); await frame('PINK HAS THE WIDEST SCATTER', strips([0, 1, 2], true), [], C.pink);

  // Bring back the three rules, then add the spread in actual sale prices.
  await until(S(58)); await frame('THREE RULES FOR USED BIKES', plot([0, 1, 2]));
  await until(S(59)); await frame('FOUR FRESH SAMPLES OF SIX', samples(4, 'rules'));
  await until(S(60)); await frame('AGE FOUR: TARGET SIX', strips([0, 1, 2]));
  await until(S(61)); await frame('WHAT WE FOUND', summary(0));
  await until(S(62)); await frame('YELLOW', summary(1), [], C.amber);
  await until(S(63)); await frame('GREEN', summary(2), [], C.green);
  await until(S(64)); await frame('PINK', summary(3), [], C.pink);
  await until(S(65)); await frame('WHICH RULE PRICES NEW AGE-FOUR BIKES?', summary(3));
  await until(S(66)); await frame('ONE MORE PIECE', strips([]));
  await until(S(67)); await frame('EVEN A PERFECT RULE CAN MISS', strips([4], true));
  await until(S(68)); await frame('PERFECT RULE: ALWAYS GUESS SIX', strips([4], true), ['Age 4 → $600']);
  await until(S(69)); await frame('SAME AGE, DIFFERENT SALE PRICES', strips([3, 4], true), [], C.violet);
  await until(S(70)); await frame('EACH REAL SALE MISSES BY ONE', strips([3, 4], true, 'target'), ['|5 − 6| = 1', '|7 − 6| = 1'], C.violet);
  await until(S(71)); await frame('PERFECT RULE’S AVERAGE SQUARED MISS', strips([3, 4], true, 'target'), ['1² = 1', '(1 + 1) ÷ 2 = 1'], C.violet);
  await until(S(72)); await frame('THE LEFTOVER MISS IS NOISE', strips([3, 4], true, 'target'), ['Noise = 1'], C.violet);
  await until(S(73)); await frame('THREE PARTS OF NEW-BIKE ERROR', errorParts(0));
  await until(S(74)); await frame('ADD THE THREE PARTS', errorParts(0), ['Bias² + variance + noise']);

  // Check the decomposition against the four yellow predictions.
  await until(S(75)); await frame('CHECK YELLOW AGAINST THE TARGET', strips([0]), [], C.amber);
  await until(S(76)); await frame('YELLOW GUESSES AND TARGET', strips([0]), ['Guesses: 4, 5, 5, 6', 'Target: 6'], C.amber);
  await until(S(77)); await frame('DISTANCES FROM SIX', strips([0], false, 'target'), ['2, 1, 1, 0'], C.amber);
  await until(S(78)); await frame('SQUARE AND ADD', strips([0], false, 'target'), ['4 + 1 + 1 + 0 = 6'], C.amber);
  await until(S(79)); await frame('AVERAGE THE FOUR SQUARED MISSES', strips([0], false, 'target'), ['6 ÷ 4 = 1.5'], C.amber);
  await until(S(80)); await frame('BIAS SQUARED PLUS VARIANCE MATCHES', summary(1), ['1 + 0.5 = 1.5'], C.amber);
  await until(S(81)); await frame('REAL PRICES ADD NOISE', strips([3, 4], true, 'target'), ['Add 1 for noise'], C.violet);
  await until(S(82)); await frame('ADD THE PARTS FOR EACH RULE', errorParts(0));
  await until(S(83)); await frame('YELLOW NEW-BIKE ERROR', errorParts(1), ['1 + 0.5 + 1 = 2.5'], C.amber);
  await until(S(84)); await frame('GREEN HAS THE LOWEST ERROR', errorParts(2), ['0 + 0.5 + 1 = 1.5'], C.green);
  await until(S(85)); await frame('PINK HAS THE HIGHEST ERROR', errorParts(3), ['0 + 5 + 1 = 6'], C.pink);
  await until(S(86)); await frame('FROM THE BARS TO ONE RULE', errorParts(3));
  await until(S(87)); await frame('AVERAGE ERROR ON NEW BIKES', errorParts(3), ['New-bike error =', 'bias² + variance + noise']);

  // Diagnose the two extremes, then compare training and new-bike errors.
  await until(S(88)); await frame('TWO WAYS A MODEL CAN MISS', plot([0, 2]));
  await until(S(89)); await frame('TOO STIFF: YELLOW GUESSES LOW', strips([0], true, 'bias'), [], C.amber);
  await until(S(90)); await frame('UNDERFITTING', plot([0], 'gaps'), ['Too stiff → high bias'], C.amber);
  await until(S(91)); await frame('PINK CHASES EVERY SALE', plot([2]), [], C.pink);
  await until(S(92)); await frame('OVERFITTING', strips([2], true, 'mean'), ['Too bendy → high variance'], C.pink);
  await until(S(93)); await frame('BENDIER: BIAS DOWN, VARIANCE UP', summary(3));
  await until(S(94)); await frame('YELLOW AND GREEN HAVE EQUAL SPREAD', summary(2), ['0.5 = 0.5'], C.green);
  await until(S(95)); await frame('THE BIAS–VARIANCE TRADEOFF', summary(3));
  await until(S(96)); await frame('GREEN IS BEST IN THIS EXAMPLE', compare('test', 1), ['Lowest age-4 error: 1.5'], C.green);
  await until(S(97)); await frame('HOW BENDY SHOULD YOUR MODEL BE?', plot([0, 1, 2]));
  await until(S(98)); await frame('COMPARE TWO ERRORS', compare('both'));
  await until(S(99)); await frame('TRAINING: BIKES USED TO FIT THE RULE', plot([1]), ['Check on these bikes']);
  await until(S(100)); await frame('NEW: BIKES THE RULE NEVER SAW', strips([3, 4], true), ['Check on fresh bikes'], C.violet);
  await until(S(101)); await frame('TRAINING MISSES LARGE? TRY BENDIER', plot([0, 1], 'gaps'), ['Large training misses', 'can signal underfitting'], C.amber);
  await until(S(102)); await frame('CLOSE FIT, LARGE NEW-BIKE ERROR', compare('both', 2), ['Training: 0', 'New age 4: 6'], C.pink);
  await until(S(103)); await frame('TRY STIFFER OR COLLECT MORE BIKES', plot([1, 2]), ['One odd sale pulls less'], C.green);
  await until(S(104)); await frame('THE TRAP: TRAINING ERROR ALONE', compare('train', 2), [], C.amber);
  await until(S(105)); await frame('TRAINING ERROR KEEPS FALLING', compare('train'), ['2 → 1.9 → 0']);
  await until(S(106)); await frame('NEW-BIKE ERROR FALLS, THEN JUMPS', compare('test'), ['2.5 → 1.5 → 6'], C.violet);
  await until(S(107)); await frame('WHICH AGES DOES EACH ERROR COVER?', compare('both'), ['Training: ages 1 to 6', 'New bikes: age 4 only']);
  await until(S(108)); await frame('PINK: LOWEST TRAINING, HIGHEST NEW', compare('both', 2), [], C.pink);
  await until(S(109)); await frame('NEXT: ADD MORE BIKES', samples(4, 'new'));
  await until(S(110)); await frame('RIGHT ON AVERAGE, STEADY ACROSS SAMPLES', strips([1], true), ['Green average = 6', 'Green variance = 0.5'], C.green);
}
