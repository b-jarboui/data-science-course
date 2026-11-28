// 12.3.1 Empirical risk. Beat i is narration sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const price = [10, 6, 8, 7, 3, 5];
  const guess = price.map((_, i) => 9 - i);
  const miss = price.map((y, i) => y - guess[i]);
  const squared = miss.map(d => d * d);
  const absolute = miss.map(Math.abs);
  const sum = values => values.reduce((a, b) => a + b, 0);
  const signed = v => v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
  const missColor = v => v < 0 ? C.pink : C.cyan;

  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 2.25 : 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const BASE = P ? -4.2 : -2.27;
  const X0 = CX - 3.05;
  const X1 = CX + 3.35;
  const span = P ? 5.3 : 3.2;
  const x = age => X0 + 0.62 + (age - 1) * 1.04;
  const y = value => BASE + value * span / 11;
  const plot = (age, value) => [x(age), y(value), 0];
  const column = i => X0 + 1.7 + i * 0.88;

  const text = (s, px, py, size = 19, color = C.ink, mono = false) =>
    T(String(s), size, color, mono).moveTo([px, py, 0]);
  const line = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const fade = object => new M.FadeIn(object, { runTime: 0.35 });
  const out = object => new M.FadeOut(object, { runTime: 0.28 });
  const draw = object => new M.Create(object, { runTime: 0.45 });
  const pointOut = (object, color = C.amber) =>
    new M.Indicate(object, { color, runTime: 0.65 });
  const stagger = (animations, runTime = 1.05) =>
    new M.LaggedStart(animations, { lagRatio: 0.28, runTime });

  function say(label, color = C.cyan) {
    const [enter, leave] = showA(label, color, PILL);
    return leave
      ? new M.LaggedStart([leave, enter], { lagRatio: 1, runTime: 0.6 })
      : enter;
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.34 : 0.42;
    const pad = 0.16;
    const labels = lines.map(row => {
      const [label, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(label, size, ink, true);
    });
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.64;
    const height = labels.length * lh + 2 * pad;
    const border = new M.RoundedRectangle({
      width, height, cornerRadius: 0.15, color, strokeWidth: 2
    });
    border.setFill(C.card, 0.96);
    border.moveTo(BOXP);
    const left = BOXP[0] - width / 2 + 0.32;
    const top = BOXP[1] + height / 2 - pad - lh / 2;
    labels.forEach((label, i) =>
      label.moveTo([left + label.getWidth() / 2, top - i * lh, 0]));
    const group = new M.VGroup(border, ...labels);
    const maxWidth = P ? FW - 1.2 : 4;
    if (width > maxWidth) group.scale(maxWidth / width);
    const enter = fade(group);
    const previous = boxNow;
    boxNow = group;
    return previous
      ? new M.LaggedStart([out(previous), enter], { lagRatio: 1, runTime: 0.63 })
      : enter;
  }

  function clearBox() {
    const animation = out(boxNow);
    boxNow = null;
    return animation;
  }

  function bikeIcon(px, py) {
    const left = [px - 0.63, py, 0];
    const right = [px + 0.63, py, 0];
    const saddle = [px - 0.25, py + 0.61, 0];
    const crank = [px + 0.05, py, 0];
    const fork = [px + 0.46, py + 0.59, 0];
    const wheel = point => {
      const circle = new M.Circle({ radius: 0.34, color: C.cyan, strokeWidth: 3 });
      circle.moveTo(point);
      return circle;
    };
    return new M.VGroup(
      wheel(left), wheel(right),
      line(left, saddle, C.cyan, 3), line(saddle, crank, C.cyan, 3),
      line(crank, left, C.cyan, 3), line(saddle, fork, C.cyan, 3),
      line(crank, fork, C.cyan, 3), line(fork, right, C.cyan, 3),
      line([px - 0.42, py + 0.64, 0], [px - 0.12, py + 0.64, 0], C.cyan, 3),
      line(fork, [px + 0.37, py + 0.85, 0], C.cyan, 3),
      line([px + 0.37, py + 0.85, 0], [px + 0.67, py + 0.85, 0], C.cyan, 3)
    );
  }

  function axes() {
    const marks = [
      line([X0, BASE, 0], [X1, BASE, 0]),
      line([X0, BASE, 0], [X0, y(11), 0]),
      text('Age (years)', CX + 0.3, BASE - 0.53, 17, C.muted),
      text('Price ($100s)', X0 + 0.95, y(11) + 0.26, 17, C.muted)
    ];
    for (let v = 0; v <= 10; v += 2) {
      if (v > 0) marks.push(line([X0, y(v), 0], [X1, y(v), 0], C.line, 1));
      marks.push(text(v, X0 - 0.26, y(v), 16, C.muted, true));
    }
    price.forEach((_, i) => {
      const px = x(i + 1);
      marks.push(line([px, BASE, 0], [px, BASE - 0.08, 0]),
        text(i + 1, px, BASE - 0.23, 17, C.muted, true));
    });
    return new M.VGroup(...marks);
  }

  function bikePoint(i, value) {
    const p = plot(i + 1, value);
    const halo = new M.Dot({ point: p, radius: 0.19, color: C.cyan });
    halo.setFill(C.cyan, 0.19);
    const cargo = i === 2 || i === 5;
    const core = cargo
      ? new M.Rectangle({ width: 0.17, height: 0.17, color: C.cyan, strokeWidth: 1 })
      : new M.Dot({ point: p, radius: 0.095, color: C.cyan });
    core.setFill(C.cyan, 1);
    core.moveTo(p);
    return new M.VGroup(halo, core);
  }

  function modelLine(prediction, color = C.amber) {
    return line(plot(0.55, prediction(0.55)), plot(6.32, prediction(6.32)), color, 4);
  }

  function sticksFor(prices, prediction) {
    return prices.flatMap((value, i) => {
      const predicted = prediction(i + 1);
      return value === predicted ? [] : [
        line(plot(i + 1, predicted), plot(i + 1, value), missColor(value - predicted), 4)
      ];
    });
  }

  function row(label, values, py, colorFor) {
    return new M.VGroup(
      text(label, X0 + 0.42, py, 17, C.muted),
      ...values.map((v, i) => text(v, column(i), py, 21, colorFor(v, i), true))
    );
  }

  function block(px, py, width, color = C.green) {
    const tile = new M.Rectangle({ width, height: width, color, strokeWidth: 1 });
    tile.setFill(color, 0.8);
    tile.moveTo([px, py, 0]);
    return tile;
  }

  const fitted = age => 10 - age;
  const ageRow = () => row('Bike', [1, 2, 3, 4, 5, 6], 0.82, () => C.muted);
  const missRow = () => row('Miss', miss.map(signed), 0.02, (_, i) => missColor(miss[i]));
  const lossRow = () => row('Loss', squared, -0.78, () => C.green);
  const shop = new M.VGroup(
    bikeIcon(CX, P ? -0.6 : -0.8),
    text('USED BIKES', CX, P ? 0.85 : 0.65, 23, C.ink, true)
  );
  const rule = new M.VGroup(
    text('Bike age', CX - 1.65, -0.4, 22),
    new M.Arrow({ start: [CX - 0.68, -0.4, 0], end: [CX + 0.68, -0.4, 0], color: C.amber }),
    text('Price guess', CX + 1.7, -0.4, 22, C.amber)
  );
  const sold = price.map((_, i) => {
    const px = CX + (i - 2.5) * 0.94;
    const rect = new M.RoundedRectangle({
      width: 0.76, height: 0.88, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2
    });
    rect.setFill(C.card, 0.96);
    rect.moveTo([px, -0.5, 0]);
    return new M.VGroup(rect, text('SOLD', px, -0.37, 14, C.cyan, true),
      text(i + 1, px, -0.67, 19, C.ink, true));
  });

  await until(S(0));
  await play(fade(shop), say('A USED-BIKE SHOP'));

  await until(S(1));
  await play(out(shop), fade(rule), say('GUESS THE SALE PRICE', C.amber));

  await until(S(2));
  await play(say('HOW GOOD IS THE RULE?', C.amber), fbox([['One score = ?', C.amber]]));

  await until(S(3));
  await play(out(rule), clearBox(), stagger(sold.map(fade)), say('6 TRAINING BIKES'));

  await until(S(4));
  await play(fbox(['Prices in hundreds', ['10 means $1,000', C.amber]]), say('PRICE UNITS'));

  let grid = axes();
  let points = price.map((v, i) => bikePoint(i, v));
  await until(S(5));
  await play(...sold.map(out), fade(grid), clearBox(), say('AGE AND PRICE'));

  await until(S(6));
  await play(stagger(points.map(fade)), say('ONE DOT PER BIKE'));

  const priceLabels = price.map((v, i) => text(v, x(i + 1), y(v) + 0.24, 18, C.cyan, true));
  await until(S(7));
  await play(stagger(priceLabels.map(fade), 2.8), say('THE SIX SALE PRICES'));

  let fittedLine = modelLine(fitted);
  await until(S(8));
  await play(...priceLabels.map(out), draw(fittedLine), say('THE PRICE RULE', C.amber),
    fbox([['Guess = 10 − age', C.amber]], C.amber));

  let sticks = sticksFor(price, fitted);
  await until(S(9));
  await play(stagger(sticks.map(draw), 2.35), say('THE STICK SHOWS THE MISS'));

  await until(S(10));
  await play(stagger([pointOut(points[0], C.cyan), pointOut(points[1], C.pink),
    pointOut(points[4], C.pink), pointOut(points[5], C.cyan)]),
    say('ABOVE AND BELOW THE LINE'));

  await until(S(11));
  await play(say('SCORE, THEN SHARE EQUALLY', C.violet),
    fbox(['Score each miss', 'Add the scores', ['Share among 6 bikes', C.violet]], C.violet));

  await until(S(12));
  await play(say('ONE SCORE FOR A TYPICAL BIKE', C.violet),
    fbox([['One average score', C.violet]], C.violet));

  const signs = miss.map((v, i) => text(v > 0 ? '+' : '−', x(i + 1) + (P ? 0.3 : 0.23),
    (y(price[i]) + y(guess[i])) / 2, P ? 30 : 22, missColor(v), true));
  await until(S(13));
  await play(stagger(signs.map(fade)), say('PLUS ABOVE · MINUS BELOW'),
    fbox([['Above the line: +', C.cyan], ['Below the line: −', C.pink]]));

  await until(S(14));
  await play(pointOut(points[0]), say('BIKE 1'), fbox(['Sold for 10', ['Guess was 9', C.amber]]));

  await until(S(15));
  await play(pointOut(sticks[0], C.cyan), fbox(['Bike 1 miss', ['10 − 9 = +1', C.cyan]]));

  await until(S(16));
  await play(stagger([pointOut(points[1], C.pink), pointOut(sticks[1], C.pink)]),
    say('BIKE 2', C.pink), fbox(['Sold for 6 · guess 8', ['6 − 8 = −2', C.pink]], C.pink));

  await until(S(17));
  await play(stagger([pointOut(points[4], C.pink), pointOut(sticks[4], C.pink)]),
    say('BIKE 5', C.pink), fbox(['Sold for 3 · guess 5', ['3 − 5 = −2', C.pink]], C.pink));

  await until(S(18));
  await play(stagger([2, 3, 5].map(i => pointOut(sticks[i], C.cyan))),
    say('BIKES 3, 4 AND 6'), fbox([['8 − 7 = +1', C.cyan],
      ['7 − 6 = +1', C.cyan], ['5 − 4 = +1', C.cyan]]));

  let ids = ageRow();
  let misses = missRow();
  await until(S(19));
  await play(out(grid), out(fittedLine), ...points.map(out), ...sticks.map(out),
    ...signs.map(out), fade(ids), fade(misses), say('THE MISSES CANCEL', C.pink),
    fbox(['Four +1s make +4', 'Two −2s make −4', ['+4 − 4 = 0', C.pink]], C.pink));

  await until(S(20));
  await play(pointOut(misses, C.pink), say('THE BIKES STILL HAVE MISSES', C.pink),
    fbox(['Total miss = 0', ['All 6 bikes still miss', C.pink]], C.pink));

  await until(S(21));
  await play(out(ids), out(misses), say('SQUARE EACH MISS', C.green),
    fbox([['Miss × itself', C.green]], C.green));

  const tileSize = 0.49;
  const single = block(CX - 1.35, -0.62, tileSize);
  const labelOne = text('1 × 1', CX - 1.35, -1.53, 20, C.green, true);
  await until(S(22));
  await play(fade(single), fade(labelOne), fbox([['1 × 1 = 1', C.green]], C.green));

  const four = new M.VGroup(...[0, 1, 2, 3].map(i =>
    block(CX + 1.35 + (i % 2 - 0.5) * 0.52,
      -0.62 + (Math.floor(i / 2) - 0.5) * 0.52, tileSize)));
  const labelFour = text('2 × 2', CX + 1.35, -1.53, 20, C.green, true);
  await until(S(23));
  await play(fade(four), fade(labelFour), fbox([['(−2) × (−2) = 4', C.green]], C.green));

  await until(S(24));
  await play(pointOut(single, C.green), pointOut(four, C.green),
    say('NEVER A NEGATIVE SCORE', C.green),
    fbox(['A square is zero', ['or positive', C.green]], C.green));

  await until(S(25));
  await play(stagger([pointOut(single, C.green), pointOut(four, C.green)]),
    say('BIGGER MISSES COST MORE', C.green),
    fbox(['2 times the miss', ['4 times the score', C.green]], C.green));

  ids = ageRow();
  misses = missRow();
  const losses = lossRow();
  await until(S(26));
  await play(out(single), out(labelOne), out(four), out(labelFour),
    fade(ids), fade(misses), fade(losses), clearBox(), say('THE SIX SCORES', C.green));

  await until(S(27));
  await play(pointOut(losses, C.green), say('SQUARED LOSS', C.green),
    fbox(['One bike → one loss', ['Loss = miss squared', C.green]], C.green));

  const tileFloor = -1.65;
  const pitch = 0.47;
  const unitAt = (i, j) => [column(i), tileFloor + (j + 0.5) * pitch, 0];
  const tiles = squared.flatMap((count, i) => Array.from({ length: count }, (_, j) => {
    const [px, py] = unitAt(i, j);
    return block(px, py, 0.4);
  }));
  const seats = price.map((_, i) => text(i + 1, column(i), tileFloor - 0.28, 18, C.muted, true));
  await until(S(28));
  await play(out(ids), out(misses), out(losses), ...seats.map(fade), stagger(tiles.map(fade), 1.2),
    say('ADD THE SIX LOSSES', C.green),
    fbox(['Four 1s and two 4s', ['Total loss = 12', C.green]], C.green));

  const share = tiles.map((tile, i) => {
    const [px, py] = unitAt(i % 6, Math.floor(i / 6));
    return new M.Transform(tile, block(px, py, 0.4), { runTime: 0.45 });
  });
  await until(S(29));
  await play(stagger(share, 1.75), say('SHARE BETWEEN SIX BIKES', C.green),
    fbox([['12 ÷ 6 = 2', C.green]], C.green));

  await until(S(30));
  await play(say('EMPIRICAL RISK', C.green),
    fbox(['Average training loss', ['12 ÷ 6 = 2', C.green]], C.green));

  await until(S(31));
  await play(stagger(seats.map(seat => pointOut(seat, C.cyan))),
    say('MEASURED ON THE BIKES WE HAVE'));

  await until(S(32));
  await play(say('THE SAME TWO STEPS', C.green),
    fbox(['Empirical risk', ['= sum of losses ÷ n', C.green]], C.green));

  await until(S(33));
  await play(stagger(seats.map(seat => pointOut(seat, C.cyan))),
    say('COUNT THE TRAINING BIKES'),
    fbox(['n = number of bikes', ['n = 6', C.cyan]]));

  ids = ageRow();
  const squareScores = row('Squared', squared, 0.02, () => C.green);
  const absoluteScores = row('Absolute', absolute, -0.78, () => C.amber);
  await until(S(34));
  await play(...tiles.map(out), ...seats.map(out), fade(ids), fade(squareScores), fade(absoluteScores),
    say('THE SCORE DEPENDS ON THE LOSS', C.amber),
    fbox([[`Squared: ${sum(squared)} ÷ 6 = 2`, C.green],
      [`Absolute: ${sum(absolute)} ÷ 6 = 4/3`, C.amber]], C.amber));

  await until(S(35));
  await play(pointOut(squareScores, C.green), say('HOW GOOD IS THE RULE?', C.green),
    fbox(['One score for this rule', ['Squared loss average = 2', C.green]], C.green));

  grid = axes();
  points = price.map((v, i) => bikePoint(i, v));
  fittedLine = modelLine(fitted);
  const other = new M.DashedLine({
    start: plot(0.55, 11 - 0.55), end: plot(6.32, 11 - 6.32), color: C.violet, strokeWidth: 3
  });
  await until(S(36));
  await play(out(ids), out(squareScores), out(absoluteScores), fade(grid), ...points.map(fade),
    draw(fittedLine), draw(other), say('COMPARE ON THE SAME BIKES'),
    fbox([['Yellow line: risk 2', C.amber], ['Dashed line: risk 3', C.violet],
      ['Yellow fits these bikes better', C.green]]));

  await until(S(37));
  await play(stagger([pointOut(other, C.violet), pointOut(fittedLine, C.amber)]),
    say('TRAINING SEARCHES FOR LOWER RISK', C.amber),
    fbox(['Model = rule', ['Search for lower risk', C.green]], C.green));

  await until(S(38));
  await play(out(other), pointOut(fittedLine, C.amber), say('BEST STRAIGHT LINE', C.amber),
    fbox([['Guess = 10 − age', C.amber], ['Lowest line risk = 2', C.green]], C.green));

  await until(S(39));
  await play(stagger(points.map(point => pointOut(point, C.cyan))),
    say('RISK USES THE SIX TRAINING BIKES'),
    fbox(['Training score', ['Uses the 6 cyan bikes', C.cyan]]));

  // Interpolate the six observed prices with the degree-five polynomial.
  function curveValue(age) {
    return sum(price.map((value, i) => price.reduce((term, _, j) =>
      i === j ? term : term * (age - (j + 1)) / (i - j), value)));
  }
  const curve = new M.VGroup(...Array.from({ length: 60 }, (_, i) => {
    const a = 1 + i / 12;
    const b = 1 + (i + 1) / 12;
    return line(plot(a, curveValue(a)), plot(b, curveValue(b)), C.pink, 4);
  }));
  await until(S(40));
  await play(out(fittedLine), fade(curve), say('A CURVE THROUGH EVERY DOT', C.pink),
    fbox(['All six training misses = 0', ['Curve training risk = 0', C.pink]], C.pink));

  const newAge = 5.45;
  const newPrice = 6;
  const newGuess = curveValue(newAge);
  const newBike = new M.Circle({ radius: 0.12, color: C.amber, strokeWidth: 3 });
  newBike.moveTo(plot(newAge, newPrice));
  const newMiss = new M.DashedLine({
    start: plot(newAge, newGuess), end: plot(newAge, newPrice),
    color: C.amber, strokeWidth: 3
  });
  await until(S(41));
  await play(stagger([fade(newBike), draw(newMiss)]), say('A NEW BIKE ARRIVES', C.amber),
    fbox([['New bike sold for 6', C.amber], ['Curve guessed about 2.3', C.pink]]));

  await until(S(42));
  await play(pointOut(newBike, C.amber), say('A LOW SCORE CAN MISLEAD', C.amber),
    fbox([['Training bikes: risk 0', C.pink], ['New bike: a big miss', C.amber]]));

  const edited = price.map((value, i) => i === 1 ? 7 : value);
  const tilted = age => 6.5 - 0.5 * (age - 3.5);
  const editedLosses = edited.map((value, i) => (value - tilted(i + 1)) ** 2);
  const tiltedLine = modelLine(tilted);
  const editedPoint = bikePoint(1, edited[1]);
  const editedSticks = sticksFor(edited, tilted);
  fittedLine = modelLine(fitted);
  await until(S(43));
  await play(out(curve), out(newMiss), out(newBike), fade(fittedLine), say('TRY IT: DRAG OR TILT'),
    fbox([['Starting risk = 2', C.green]]));
  await play(new M.Transform(points[1], editedPoint, { runTime: 0.65 }),
    new M.Transform(fittedLine, tiltedLine, { runTime: 0.65 }),
    stagger(editedSticks.map(draw)),
    fbox([['Drag bike 2 · tilt the line', C.cyan],
      ['Updated losses ≈ 5.06, 0.06,', C.ink],
      [`1.56, 0.56, 7.56, 0.06 → ${(sum(editedLosses) / 6).toFixed(2)}`, C.green]], C.green));

  sticks = sticksFor(price, fitted);
  await until(S(44));
  await play(...editedSticks.map(out),
    new M.Transform(points[1], bikePoint(1, price[1]), { runTime: 0.55 }),
    new M.Transform(fittedLine, modelLine(fitted), { runTime: 0.55 }),
    stagger(sticks.map(fade)),
    say('EMPIRICAL RISK', C.green),
    fbox(['Average loss over', 'the training bikes', ['Here: 12 ÷ 6 = 2', C.green]], C.green));
}
