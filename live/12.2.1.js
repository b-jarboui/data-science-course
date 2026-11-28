// 12.2.1 Standardization: one shared ruler.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, LINE_Y } = L;
  const bikes = [
    ['Falcon', 1, 1000, 'Excellent', 'March', 700],
    ['Ridge', 2, 2000, 'Good', 'June', 400],
    ['Swift', 3, 3000, 'Good', 'December', 300],
    ['Falcon', 1, 3000, 'Good', 'January', 500],
    ['Ridge', 6, 3000, 'Fair', 'July', 200],
    ['Swift', 4, 4000, 'Poor', 'November', 200],
    ['Falcon', 1, 4000, 'Good', 'February', 600],
    ['Ridge', 2, 4000, 'Fair', 'September', 300],
  ];
  const n1 = ['Comet', 3, 6000, 'Good', 'December'];
  const mileage = bikes.map(bike => bike[2]);
  const distances = mileage.map(km => km - 3000);
  const steps = distances.map(km => km / 1000);
  const squares = steps.map(value => value ** 2);
  const brandColor = { Falcon: C.cyan, Ridge: C.amber, Swift: C.pink, Comet: C.muted };

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const WIDTH = P ? 6.8 : 6.5;
  const TOP = P ? 0.85 : 1.05;
  const AXIS = LINE_Y - (P ? 2.05 : 1.2);
  const DX = P ? 0.84 : 0.89;
  const fmt = n => n.toLocaleString('en-US');
  const signed = n => n < 0 ? `−${fmt(-n)}` : n > 0 ? `+${fmt(n)}` : '0';

  // Flatten lists of new shapes before passing them to Manim.
  const group = (...items) => new M.VGroup(...items.flat(Infinity));

  function text(s, x, y, size = 21, color = C.ink, width = WIDTH, mono = false) {
    const label = T(String(s), size, color, mono);
    const measured = label.getWidth();
    if (measured > width) label.scale(width / measured);
    label.moveTo([x, y, 0]);
    return label;
  }

  function card(x, y, width, height, color = C.line) {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.14, color, strokeWidth: 2 });
    shape.setFill(C.card, 0.94);
    shape.moveTo([x, y, 0]);
    return shape;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  function dot(x, y, color, radius = 0.115) {
    const point = new M.Dot({ point: [x, y, 0], radius, color });
    point.setFill(color, 0.94);
    return point;
  }

  const fadeIn = item => new M.FadeIn(item, { runTime: 0.28 });
  const fadeOut = item => new M.FadeOut(item, { runTime: 0.22 });
  let visible = [];
  let boxNow = null;

  function formula(lines, color) {
    const leaving = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    if (lines) {
      const width = P ? FW - 1.2 : 4.0;
      const spacing = P ? 0.32 : 0.41;
      const height = lines.length * spacing + 0.2;
      const labels = lines.map((row, i) => {
        const [value, ink] = Array.isArray(row) ? row : [row, C.ink];
        const y = BOXP[1] + ((lines.length - 1) / 2 - i) * spacing;
        return text(value, BOXP[0], y, P ? 20 : 19, ink, width - 0.42, true);
      });
      boxNow = group(card(BOXP[0], BOXP[1], width, height, color), labels);
    }
    return [leaving, boxNow ? [fadeIn(boxNow)] : []];
  }

  // Undefined keeps the picture or formula. Null clears it.
  async function beat(label, picture, math, color = C.cyan, extra = []) {
    const leaving = [], entering = [];
    if (picture !== undefined) {
      const next = picture == null ? [] : [picture].flat();
      leaving.push(...visible.filter(item => !next.includes(item)).map(fadeOut));
      entering.push(...next.filter(item => !visible.includes(item)).map(fadeIn));
      visible = next;
    }
    if (math !== undefined) {
      const [oldBox, newBox] = formula(math, color);
      leaving.push(...oldBox);
      entering.push(...newBox);
    }
    const [newPill, oldPill] = showA(label, color, PILL, P ? 18 : 17);
    newPill.duration = 0.28;
    if (oldPill) {
      oldPill.duration = 0.22;
      leaving.push(oldPill);
    }
    if (leaving.length) await play(...leaving);
    await play(newPill, ...entering, ...extra);
  }

  function table(rows, options = {}) {
    const { widths = Array(rows[0].length).fill(1), focus = [], colors = [], focusRow = -1 } = options;
    const unit = WIDTH / widths.reduce((sum, width) => sum + width, 0);
    const rowHeight = P ? 0.59 : 0.53;
    const left = CX - WIDTH / 2;
    const center = TOP - (rows.length - 1) * rowHeight / 2;
    const elements = [card(CX, center, WIDTH, rows.length * rowHeight + 0.12)];
    rows.forEach((row, r) => {
      const y = TOP - r * rowHeight;
      let edge = left;
      if (r > 0) elements.push(line(left + 0.13, y + rowHeight / 2,
        left + WIDTH - 0.13, y + rowHeight / 2, C.line));
      row.forEach((value, c) => {
        const w = widths[c] * unit;
        const ink = focus.includes(c) || r === focusRow ? C.amber : colors[c] || (r === 0 ? C.cyan : C.ink);
        elements.push(text(value, edge + w / 2, y, r === 0 ? 19 : 20, ink, w - 0.16));
        edge += w;
      });
    });
    return group(elements);
  }

  function bikeCard(bike, id, x, y, status = 'sold') {
    const color = brandColor[bike[0]];
    return group(card(x, y, 1.47, 0.99, color),
      text(`${id}  ${bike[0]}`, x, y + 0.24, 16, color, 1.3, true),
      text(status === 'new' ? 'New listing' : `${fmt(bike[2])} km`, x, y - 0.04, 18, C.ink, 1.3),
      text(status === 'sold' ? `$${bike[5]}` : 'For sale', x, y - 0.31, 16, C.muted, 1.3));
  }

  function listings(count, status) {
    const columns = count === 3 ? 3 : 4;
    return group(bikes.slice(0, count).map((bike, i) => {
      const x = CX + (i % columns - (columns - 1) / 2) * 1.61;
      return bikeCard(bike, `B${i + 1}`, x, 0.59 - Math.floor(i / columns) * 1.19, status);
    }));
  }

  function listingFeatures(highlightMileage = false) {
    const [brand, age, km, condition, month] = bikes[0];
    return table([
      ['Bike 1 listing', 'What it says'], ['Brand', brand], ['Age', `${age} year`],
      ['Mileage', `${fmt(km)} km`], ['Condition', condition], ['Month posted', month],
    ], { colors: [C.cyan, C.ink], focusRow: highlightMileage ? 3 : -1 });
  }

  function flow(labels) {
    const colors = [C.cyan, C.violet, C.green];
    const w = 1.78, spacing = 2.25, y = P ? -0.6 : -0.45;
    const items = [];
    labels.forEach((label, i) => {
      const x = CX + (i - (labels.length - 1) / 2) * spacing;
      items.push(card(x, y, w, 0.83, colors[i]), text(label, x, y, 19, colors[i], w - 0.15));
      if (i < labels.length - 1) items.push(text('→', x + spacing / 2, y, 22, C.muted, 0.4));
    });
    return group(items);
  }

  function gapBars(leftLabel, rightLabel, leftValue, rightValue, leftLength, rightLength) {
    const start = CX - WIDTH / 2 + 0.28;
    const rows = [[leftLabel, leftValue, leftLength, C.violet], [rightLabel, rightValue, rightLength, C.cyan]];
    const items = [];
    rows.forEach(([label, value, length, color], i) => {
      const y = 0.64 - i * 1.32;
      items.push(text(label, CX - 1.57, y, 22, color, 2.7),
        text(value, CX + 1.69, y, 22, color, 2.8, true));
      items.push(line(start, y - 0.49, start + 5.8, y - 0.49, C.line, 5));
      if (length < 0.18) {
        items.push(line(start, y - 0.59, start, y - 0.39, color, 3));
      } else {
        items.push(line(start, y - 0.49, start + length, y - 0.49, color, 6));
      }
    });
    return group(items);
  }

  function tests(stage) {
    const items = [];
    const left = CX - 2.75, right = CX + 2.75;
    for (let i = 0; i < 2; i++) {
      const y = 0.48 - i * 1.58;
      const color = i ? C.violet : C.cyan;
      const max = i ? 1000 : 10;
      items.push(text(`Test ${i ? 'B' : 'A'}`, CX - 1.86, y + 0.36, 21, color));
      if (stage === 0) {
        items.push(card(CX, y - 0.27, 5.5, 0.5, color), text('Mark sheet', CX, y - 0.27, 18));
        continue;
      }
      items.push(line(left, y - 0.12, right, y - 0.12, color),
        text('0', left, y - 0.47, 18, color, 0.45, true),
        text(fmt(max), right, y - 0.47, 18, color, 0.85, true));
      if (stage >= 2) {
        const usual = left + 0.7 * (right - left);
        const mark = left + 0.8 * (right - left);
        items.push(dot(mark, y - 0.12, color),
          text(`Mark: ${fmt(max * 0.8)}`, CX + 1.63, y + 0.36, 19, color, 2.45));
        if (stage === 3) {
          items.push(line(usual, y - 0.22, usual, y + 0.08, C.amber),
            line(usual, y + 0.14, mark, y + 0.14, C.amber),
            text(`Usual: ${fmt(max * 0.7)}`, usual - 0.6, y - 0.47, 18, C.amber, 2.0));
        }
      }
    }
    return group(items);
  }

  function ruler(mode, options = {}) {
    const { highlight = [], zero = false, newcomers = [], arrows = [], title,
      mileages = mileage, rawMean = 3 } = options;
    const raw = mode === 'raw';
    const start = raw ? 0 : -3;
    const x = v => CX + (v - (raw ? 4 : 0)) * DX;
    const values = raw ? mileages.map(km => km / 1000) : steps;
    const ticks = Array.from({ length: 8 }, (_, i) => start + i);
    const axis = [line(x(start), AXIS, x(start + 7), AXIS)];
    // Phone + long labels: alternate two rows so labels never touch.
    const stagger = P && (mode === 'km' || raw);
    ticks.forEach((v, i) => {
      const color = zero && v === (raw ? rawMean : 0) ? C.amber : C.muted;
      const label = raw ? fmt(v * 1000) : mode === 'km' ? signed(v * 1000) : signed(v);
      const ly = AXIS - (stagger && i % 2 ? 0.58 : 0.30);
      axis.push(line(x(v), AXIS - 0.075, x(v), AXIS + 0.075, color),
        text(label, x(v), ly, 17, color, stagger ? 1.2 : 0.84, true));
    });
    const units = {
      raw: 'Mileage (km)',
      km: 'Distance from the mean (km)',
      thousands: 'Distance from the mean (thousands of km)',
      scores: 'Typical steps from the training mean',
    };
    axis.push(text(title || units[mode], CX, AXIS - (stagger ? 1.02 : 0.77), 21));
    if (zero) {
      const mid = x(raw ? rawMean : 0);
      axis.push(new M.DashedLine({ start: [mid, AXIS, 0], end: [mid, AXIS + 1.43, 0],
        color: C.amber, strokeWidth: 2 }));
    }

    const levels = new Map();
    const points = values.map(v => {
      const level = levels.get(v) || 0;
      levels.set(v, level + 1);
      const color = highlight.includes(v) ? C.amber : C.cyan;
      return dot(x(v), AXIS + 0.27 + 0.36 * level, color);
    });
    const other = [];
    newcomers.forEach(([value, label]) => {
      other.push(dot(x(value), AXIS + 0.31, C.violet, 0.14),
        text(label, x(value), AXIS + 0.68, 17, C.violet, 0.83, true));
    });
    arrows.forEach(([value, label, color], i) => {
      const y = AXIS + 1.36 + i * 0.45;
      other.push(line(x(0), y, x(value), y, color, 3),
        line(x(value), y - 0.09, x(value), y + 0.09, color),
        text(label, (x(0) + x(value)) / 2, y + 0.20, 16, color, 2.7));
    });
    const axisGroup = group(axis);
    return { axis: axisGroup, points, layers: [axisGroup, ...points, ...(other.length ? [group(other)] : [])], x };
  }

  const blockX = i => CX + (i - 3.5) * 0.79;
  function block(i, j) {
    const tile = new M.Rectangle({ width: 0.56, height: 0.28, color: C.cyan, strokeWidth: 1 });
    tile.setFill(C.cyan, 0.78);
    tile.moveTo([blockX(i), AXIS + 0.17 + 0.31 * j, 0]);
    return tile;
  }

  function shareLabels(values) {
    return group(line(blockX(0) - 0.38, AXIS, blockX(7) + 0.38, AXIS),
      values.map((value, i) => text(value, blockX(i), AXIS - 0.27, 18, C.ink, 0.76, true)),
      text('1 block = 1,000 km', CX, AXIS - 0.72, 18, C.muted));
  }

  function numberRows(rows, focus = [], rowFocus = -1) {
    const h = 0.65;
    const center = TOP - 0.85;
    const items = [card(CX, center - (rows.length - 1) * h / 2, WIDTH, rows.length * h + 0.45)];
    rows.forEach(([label, values], r) => {
      const y = center - r * h;
      items.push(text(label, CX, y + 0.22, P ? 19 : 17, C.muted));
      values.forEach((value, i) => {
        const color = focus.includes(i) && (rowFocus < 0 || r === rowFocus) ? C.amber : r ? C.green : C.cyan;
        items.push(text(value, blockX(i), y - 0.08, 22, color, 0.75, true));
      });
    });
    return group(items);
  }

  const distanceRow = ['Distance (thousands of km)', steps.map(signed)];
  const squareRow = ['Distance squared', squares.map(String)];
  const scoreRow = ['Standard score', steps.map(signed)];
  const trainingRule = [['Training mean: 3,000 km', C.amber], ['Training SD: 1,000 km', C.green]];
  const scoreRule = ['Standard score =', '(mileage − 3,000) ÷ 1,000'];
  const batch = [['New bike', 'Mileage (km)'], ['Bike A', '5,000'], ['N1', '6,000'], ['Bike C', '7,000']];

  // 0–7 Listings, training examples, and features.
  await until(S(0)); await beat('USED BIKES FOR SALE', listings(3, 'for sale'));
  await until(S(1)); await beat('WHAT IS A FAIR PRICE?', group(
    bikeCard(n1, 'New', CX - 1.15, -0.34, 'new'),
    card(CX + 1.14, -0.34, 1.47, 0.99, C.amber),
    text('Price?', CX + 1.14, -0.34, 24, C.amber)), null, C.amber);
  await until(S(2)); await beat('8 TRAINING BIKES', listings(8));
  await until(S(3)); await beat('A MODEL MAKES A GUESS', flow(['Listing', 'Model', 'Price guess']));
  await until(S(4)); await beat('THE RULE LEARNS FROM EXAMPLES', listings(8));
  const features = listingFeatures();
  await until(S(5)); await beat('WHAT A LISTING TELLS US', features);
  await until(S(6)); await beat('EACH PIECE IS A FEATURE');
  await until(S(7)); await beat('FOCUS ON MILEAGE', listingFeatures(true), null, C.amber);

  // 8–14 The mileage dots and the raw gap comparison.
  const firstRuler = ruler('raw');
  await until(S(8)); await beat('ONE DOT PER TRAINING BIKE', firstRuler.layers);
  await until(S(9));
  await beat('REPEATED MILEAGES STACK UP', undefined, undefined, C.cyan, [
    new M.LaggedStart([1, 2, 3, 4].map(v =>
      new M.Flash(dot(firstRuler.x(v), AXIS + (v > 2 ? 0.63 : 0.27), C.amber), {
        color: C.amber, flashRadius: v > 2 ? 0.44 : 0.2, lineLength: 0.1, runTime: 0.7,
      })), { lagRatio: 1, runTime: 5.4 }),
  ]);
  await until(S(10)); await beat('AGE IS COUNTED IN YEARS', table([
    ['Bike', 'Age'], ['1', '1 year'], ['2', '2 years'], ['5', '6 years'],
  ], { focus: [1] }));
  await until(S(11)); await beat('MILEAGE IS COUNTED IN KILOMETRES', table([
    ['Bike', 'Age (years)', 'Mileage (km)'], ['1', '1', '1,000'], ['2', '2', '2,000'], ['5', '6', '3,000'],
  ], { widths: [0.7, 1, 1.4], focus: [2] }));
  await until(S(12)); await beat('MODELS CAN ADD OR MEASURE GAPS', table([
    ['Bike', 'Age (years)', 'Mileage (km)'], ['1', '1', '1,000'], ['2', '2', '2,000'],
    ['Gap', '1', '1,000'],
  ], { widths: [0.7, 1, 1.4] }), ['One bike compared with another']);
  await until(S(13)); await beat('THE RAW GAPS LOOK UNEQUAL',
    gapBars('Age gap', 'Mileage gap', '1 year', '1,000 km', 5.8 / 1000, 5.8),
    ['1,000 ÷ 1 = 1,000'], C.amber);
  await until(S(14)); await beat('THE UNIT MAKES THE NUMBER BIG',
    gapBars('Age gap', 'Same mileage gap', '1 year', '1 thousand km', 5.8, 5.8),
    ['1,000 km = 1 thousand km'], C.amber);

  // 15–20 Compare marks on two scales, then return to the bikes.
  await until(S(15)); await beat('TWO SCHOOL TESTS', tests(0), null);
  await until(S(16)); await beat('TWO DIFFERENT SCALES', tests(1));
  await until(S(17)); await beat('COMPARE THE MARKS FAIRLY', tests(2), undefined, C.amber);
  await until(S(18)); await beat('HOW MANY USUAL-SIZE STEPS?', tests(3), [
    'Test A: (8 − 7) ÷ 1 = 1', 'Test B: (800 − 700) ÷ 100 = 1', ['Each is one usual-size step', C.amber],
  ], C.amber);
  await until(S(19)); await beat('ASK THE SAME THING ABOUT MILEAGE', ruler('raw').layers, null);
  await until(S(20)); await beat('FIND THE MEAN', undefined, undefined, C.amber);

  // 21–24 Share 24 blocks among eight bikes, preserving every block.
  await until(S(21));
  const stacks = mileage.map((km, i) => Array.from({ length: km / 1000 }, (_, j) => block(i, j)));
  const originalLabels = shareLabels(mileage.map(fmt));
  await beat('SHARE THE KILOMETRES EQUALLY', [...stacks.flat(), originalLabels]);
  await until(S(22)); await beat('24,000 KILOMETRES IN TOTAL', undefined, [
    '1,000 + 2,000 + 3 × 3,000', '+ 3 × 4,000', ['Total = 24,000 km', C.amber],
  ], C.amber);
  await until(S(23));
  await beat('THE SAME SHARE FOR 8 BIKES', undefined, [
    '24,000 km ÷ 8 bikes', ['= 3,000 km each', C.amber],
  ], C.amber);
  const moves = [[5, 0, 1], [6, 0, 2], [7, 1, 2]];
  await play(new M.LaggedStart(moves.map(([from, to, level]) =>
    new M.Transform(stacks[from][3], block(to, level), { pathArc: -0.65, runTime: 0.7 })),
  { lagRatio: 0.35 }));
  const equalLabels = shareLabels(Array(8).fill('3,000'));
  await play(fadeOut(originalLabels));
  await play(fadeIn(equalLabels));
  visible = [...stacks.flat(), equalLabels];

  const uncentered = ruler('raw', { zero: true, highlight: [3] });
  await until(S(24)); await beat('MEAN = 3,000 KM', uncentered.layers, [['Mean = 3,000 km', C.amber]], C.amber);

  // 25–33 Center the ruler and read the signed distances.
  await until(S(25));
  const centered = ruler('km', { zero: true, highlight: [0] });
  await beat('MOVE 3,000 KM TO ZERO', undefined, ['3,000 − 3,000 = 0 km'], C.amber, [
    ...uncentered.points.map((point, i) => new M.Transform(point, centered.points[i], { runTime: 0.65 })),
    fadeOut(uncentered.axis), fadeIn(centered.axis),
  ]);
  visible = [centered.axis, ...uncentered.points];
  await until(S(26)); await beat('READ DISTANCES FROM THE MEAN', undefined, ['Mileage − 3,000 km']);
  await until(S(27)); await beat('TWO BIKES BELOW THE MEAN',
    ruler('km', { zero: true, highlight: [-2, -1] }).layers, [
      '1,000 − 3,000 = −2,000', '2,000 − 3,000 = −1,000',
    ], C.amber);
  await until(S(28)); await beat('THREE BIKES AT ZERO',
    ruler('km', { zero: true, highlight: [0] }).layers, ['3,000 − 3,000 = 0'], C.amber);
  await until(S(29)); await beat('THREE BIKES ABOVE THE MEAN',
    ruler('km', { zero: true, highlight: [1] }).layers, ['4,000 − 3,000 = +1,000'], C.amber);
  await until(S(30)); await beat('HOW BIG IS A TYPICAL STEP?',
    ruler('km', { zero: true, arrows: [[-2, '2,000 km', C.violet], [1, '1,000 km', C.amber]] }).layers,
    null, C.amber);
  await until(S(31)); await beat('COUNT IN THOUSANDS OF KM', ruler('thousands', { zero: true }).layers,
    ['−2,000 km = −2 thousand km']);
  await until(S(32)); await beat('READ ALL EIGHT DISTANCES', numberRows([distanceRow]), null);
  await until(S(33)); await beat('THE MINUSES AND PLUSES CANCEL',
    numberRows([distanceRow], [0, 1, 5, 6, 7]), [
      'Below the mean: −3', 'Above the mean: +3', ['−3 + 3 = 0', C.amber],
    ], C.amber);

  // 34–43 Square, average, and take the square root.
  await until(S(34)); await beat('MULTIPLY EACH DISTANCE BY ITSELF',
    numberRows([distanceRow]), ['Distance × the same distance'], C.amber);
  await until(S(35)); await beat('SQUARE THE NEGATIVE DISTANCES', numberRows([
    distanceRow, [squareRow[0], ['4', '1', '·', '·', '·', '·', '·', '·']],
  ], [0, 1]), ['(−2) × (−2) = 4', '(−1) × (−1) = 1'], C.amber);
  await until(S(36)); await beat('SQUARE ZERO AND ONE', numberRows(
    [distanceRow, squareRow], [2, 3, 4, 5, 6, 7], 1), ['0 × 0 = 0', '1 × 1 = 1'], C.amber);
  await until(S(37)); await beat('READ ALL EIGHT SQUARES', numberRows([distanceRow, squareRow]), null);
  await until(S(38)); await beat('ADD THE SQUARES AND SHARE BY 8', numberRows([squareRow]), [
    '4 + 1 + 0 + 0 + 0 + 1 + 1 + 1 = 8', ['8 ÷ 8 = 1', C.amber],
  ], C.amber);
  await until(S(39)); await beat('UNDO THE SQUARING', flow(['Square first', 'Average', 'Square root']),
    ['Average of the squares = 1']);
  await until(S(40)); await beat('WHAT NUMBER TIMES ITSELF?', table([
    ['Number', 'Times itself', 'Result'], ['?', '? × ?', '1'],
  ], { focus: [0] }), ['Square root of 1 = ?'], C.amber);
  await until(S(41)); await beat('THE SQUARE ROOT OF 1 IS 1', table([
    ['Number', 'Times itself', 'Result'], ['1', '1 × 1', '1'],
  ], { focus: [0] }), [['√1 = 1', C.amber]], C.amber);
  await until(S(42)); await beat('ONE TYPICAL STEP IS 1,000 KM',
    ruler('km', { zero: true, arrows: [[1, '1,000 km', C.amber]] }).layers,
    ['1 thousand km = 1,000 km'], C.amber);
  await until(S(43)); await beat('STANDARD DEVIATION',
    undefined, [['Typical step = 1,000 km', C.green]], C.green);

  // 44–53 Change units and read the standard score formula.
  await until(S(44)); await beat('COUNT IN TYPICAL STEPS',
    ruler('scores', { zero: true, arrows: [[1, '1 step', C.green]] }).layers, [
      'Old unit: kilometres', ['New unit: typical steps', C.green],
    ], C.green);
  await until(S(45)); await beat('DIVIDE EACH DISTANCE BY 1,000 KM', numberRows([
    ['Distance (km)', distances.map(signed)], ['Typical steps', steps.map(signed)],
  ]), ['Distance ÷ 1,000 km'], C.green);
  await until(S(46)); await beat('EIGHT VALUES IN TYPICAL STEPS',
    numberRows([['Typical steps', steps.map(signed)]]), null);
  await until(S(47)); await beat('STANDARDIZATION GIVES STANDARD SCORES',
    numberRows([scoreRow]), undefined, C.green);
  await until(S(48)); await beat('ZERO IS THE AVERAGE MILEAGE',
    ruler('scores', { zero: true, highlight: [0] }).layers, ['3,000 km → 0'], C.amber);
  await until(S(49)); await beat('READ HOW FAR AND WHICH WAY',
    ruler('scores', { zero: true, highlight: [-2, 1],
      arrows: [[-2, '2 below', C.violet], [1, '1 above', C.green]] }).layers,
    ['+1 is one step above', '−2 is two steps below']);
  await until(S(50)); await beat('THE TWO STEPS IN ONE RULE', flow(['Mileage', 'Subtract', 'Divide']), null);
  await until(S(51)); await beat('THE STANDARD SCORE', undefined, [
    ['Standard score =', C.green], '(value − mean)', '÷ standard deviation',
  ], C.green);
  await until(S(52)); await beat('HOW FAR FROM THE MIDDLE?',
    ruler('scores', { zero: true, arrows: [[1, '1 typical step', C.green]] }).layers,
    ['Distance from the middle', '÷ size of a typical step']);
  await until(S(53)); await beat('USE THE NUMBERS FOR OUR BIKES', undefined, scoreRule, C.green);

  // 54–66 Score N1 with the saved training ruler and compare features.
  await until(S(54)); await beat('A NEW BIKE ARRIVES', table([
    ['New listing', 'Name'], ['Bike', 'N1'],
  ]), null, C.violet);
  await until(S(55)); await beat('N1 HAS 6,000 KM',
    ruler('raw', { newcomers: [[6, 'N1']] }).layers, undefined, C.violet);
  await until(S(56)); await beat('WHICH RULER DO WE USE?', undefined, [
    'Which mean?', 'Which standard deviation?',
  ], C.amber);
  await until(S(57)); await beat('USE THE TRAINING RULER',
    ruler('raw', { zero: true, newcomers: [[6, 'N1']] }).layers, trainingRule, C.green);
  await until(S(58)); await beat('SUBTRACT THE TRAINING MEAN',
    ruler('km', { zero: true, newcomers: [[3, 'N1']], arrows: [[3, '3,000 km', C.violet]] }).layers,
    ['6,000 − 3,000 = 3,000 km'], C.violet);
  await until(S(59)); await beat('DIVIDE BY THE TRAINING STEP',
    ruler('scores', { zero: true, newcomers: [[3, 'N1']], arrows: [[3, '3 typical steps', C.violet]] }).layers,
    ['3,000 km ÷ 1,000 km = 3'], C.violet);
  await until(S(60)); await beat('N1 SCORES +3', ruler('scores', {
    zero: true, highlight: [1], newcomers: [[3, 'N1']],
  }).layers, ['Highest training score: +1', ['N1: +3', C.violet]], C.violet);
  await until(S(61)); await beat('LEARN THE RULER ONCE', ruler('scores', {
    zero: true, title: 'Ruler fitted on the 8 training bikes',
  }).layers, trainingRule, C.green);
  await until(S(62)); await beat('KEEP THAT RULER WITH THE MODEL', flow(['New listing', 'Saved ruler', 'Model']),
    trainingRule, C.green);
  await until(S(63)); await beat('AGE HAS ITS OWN MEAN AND STEP', table([
    ['Training feature', 'Mean', 'Standard deviation'],
    ['Mileage', '3,000 km', '1,000 km'], ['Age', '2.5 years', '≈ 1.66 years'],
  ], { widths: [1.15, 0.9, 1.4], focus: [2] }), null, C.amber);
  await until(S(64)); await beat('ONE SHARED UNIT: TYPICAL STEPS', table([
    ['Bike', 'Age score', 'Mileage score'],
    ['1', '≈ −0.90', '−2'], ['2', '≈ −0.30', '−1'],
  ], { widths: [0.65, 1, 1.25] }), ['Each feature uses its own ruler'], C.green);
  await until(S(65)); await beat('BOTH GAPS NOW USE TYPICAL STEPS', gapBars(
    'Age gap', 'Mileage gap', '≈ 0.60 steps', '1 step', 3.48, 5.8),
    ['Bike 1 compared with bike 2'], C.green);
  await until(S(66)); await beat('SCALE THE FEATURES BEFORE THE MODEL',
    flow(['Age and mileage', 'Standardize', 'Model']), ['Before adding or measuring gaps']);

  // 67–72 Show what goes wrong when the new bikes set zero.
  await until(S(67)); await beat('THE TRAP: THREE NEW BIKES', table([
    ['This week', 'Arriving bikes'], ['1', 'Bike A'], ['2', 'N1'], ['3', 'Bike C'],
  ]), null, C.pink);
  const batchTable = table(batch, { focus: [1] });
  await until(S(68)); await beat('THREE NEW MILEAGES', batchTable, undefined, C.pink);
  await until(S(69)); await beat('A FRESH MEAN WOULD BE 6,000 KM', undefined, [
    '5,000 + 6,000 + 7,000 = 18,000', ['18,000 ÷ 3 = 6,000 km', C.pink],
  ], C.pink);
  await until(S(70)); await beat('REFITTING WOULD PUT N1 AT ZERO', table([
    ['New-batch ruler', 'Mileage (km)'], ['New-batch mean', '6,000'], ['N1', '6,000'],
  ], { focus: [1] }), ['6,000 − 6,000 = 0 km', ['New-batch score: 0', C.pink]], C.pink);
  await until(S(71)); await beat('N1 IS ABOVE EVERY TRAINING BIKE', ruler('raw', {
    zero: true, highlight: [4], newcomers: [[6, 'N1']],
  }).layers, ['Training max: 4,000 km', ['N1: 6,000 km', C.violet]], C.violet);
  await until(S(72)); await beat('ZERO STAYS AT THE TRAINING MEAN', ruler('scores', {
    zero: true, newcomers: [[2, 'A'], [3, 'N1'], [4, 'C']],
  }).layers, trainingRule, C.green);

  // 73–75 Preview Try it, then recap the fixed training rule.
  await until(S(73));
  const beforeDrag = ruler('raw', { zero: true, highlight: [1], title: 'Drag a training dot in Try it' });
  await beat('TRY IT: DRAG A TRAINING BIKE', beforeDrag.layers, trainingRule);
  const dragged = [1800, ...mileage.slice(1)];
  const afterDrag = ruler('raw', {
    zero: true, highlight: [1.8], title: 'Drag a training dot in Try it',
    mileages: dragged, rawMean: 3.1,
  });
  await until(S(73) + 1.0);
  const [beforeBox, afterBox] = formula([
    ['Training mean: 3,100 km', C.amber], ['Training SD: ≈ 819 km', C.green],
  ], C.green);
  await play(...beforeBox, fadeOut(beforeDrag.axis),
    new M.Transform(beforeDrag.points[0], afterDrag.points[0], { runTime: 0.65 }));
  await play(fadeIn(afterDrag.axis), ...afterBox);
  visible = [afterDrag.axis, ...beforeDrag.points];

  await until(S(74)); await beat('ADD NEW BIKES TO THE TRAINING RULER', ruler('scores', {
    zero: true, newcomers: [[-2.4, 'N2'], [3, 'N1']],
  }).layers, ['Original training ruler', 'N2: 600 km → −2.4', 'N1: 6,000 km → +3'], C.violet);
  await until(S(75)); await beat('REUSE THE TRAINING RULER FOR EVERY BIKE',
    flow(['Subtract mean', 'Divide by step', 'Reuse the rule']), [
      ['Training mean: 3,000 km', C.amber], ['Training SD: 1,000 km', C.green],
      '(mileage − 3,000) ÷ 1,000',
    ], C.green);
}
