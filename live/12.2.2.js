// 12.2.2 One-hot encoding. Beat i starts at sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, LINE_Y } = L;
  const BRANDS = ['Falcon', 'Ridge', 'Swift'];
  const TRAIN = [
    ['1', 'Falcon'], ['2', 'Ridge'], ['3', 'Swift'], ['4', 'Falcon'],
    ['5', 'Ridge'], ['6', 'Swift'], ['7', 'Falcon'], ['8', 'Ridge'],
  ];
  const NEW = [['N1', 'Comet'], ['N2', 'Falcon']];
  const brandColor = { Falcon: C.cyan, Ridge: C.amber, Swift: C.pink, Comet: C.muted };

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const tableX = [-3.02, -1.92, -0.39, 1.07, 2.53].map(x => CX + x);
  const columnW = [0.74, 1.37, 1.36, 1.36, 1.36];
  const headerY = P ? 1.23 : 1.02;
  const pitch = P ? 0.58 : 0.35;
  const rowY = i => headerY - (i + 1) * pitch - (i >= 8 ? (P ? 0.19 : 0.15) : 0);
  const rowH = P ? 0.49 : 0.29;
  const tableLeft = tableX[0] - columnW[0] / 2;
  const tableRight = tableX[4] + columnW[4] / 2;
  const bits = brand => BRANDS.map(b => Number(b === brand));

  const group = objects => new M.VGroup(...objects);
  const text = (value, x, y, size = 20, color = C.ink, mono = false, bold = false) =>
    T(String(value), size, color, mono, bold).moveTo([x, y, 0]);

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.95) {
    const shape = new M.RoundedRectangle({
      width, height, color, cornerRadius: Math.min(0.12, height / 4), strokeWidth: 2,
    });
    shape.setFill(fill, opacity);
    return shape.moveTo([x, y, 0]);
  }

  function line(x1, y1, x2, y2, color = C.muted) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2 });
  }

  function arrow(x1, y1, x2, y2, color = C.muted) {
    return new M.Arrow({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2, buff: 0 });
  }

  const fade = object => new M.FadeIn(object, { runTime: 0.36 });
  const out = object => new M.FadeOut(object, { runTime: 0.24 });
  const say = (label, color = C.cyan) => showA(label, color, PILL, P ? 17 : 19);
  const layers = new Map();

  function put(slot, object = null, stagger = false) {
    const previous = layers.get(slot) || [];
    const animations = previous.map(out);
    if (object === null) {
      layers.delete(slot);
      return animations;
    }
    const objects = Array.isArray(object) ? object : [object];
    layers.set(slot, objects);
    const entrances = objects.map(fade);
    if (stagger) {
      animations.push(new M.LaggedStart(entrances, { lagRatio: 0.32, runTime: 2.2 }));
    } else {
      animations.push(...entrances);
    }
    return animations;
  }

  function clearRows() {
    return Array.from({ length: 10 }, (_, i) => put(`row${i}`)).flat();
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;
    const labels = lines.map(entry => {
      const [value, tint] = Array.isArray(entry) ? entry : [entry, C.ink];
      return T(value, size, tint, true);
    });
    const wd = Math.max(...labels.map(label => label.getWidth())) + 0.6;
    const ht = lines.length * lh + 0.3;
    const [x, y] = BOXP;
    const card = rect(x, y, wd, ht, color);
    labels.forEach((label, i) => label.moveTo([
      x - wd / 2 + 0.3 + label.getWidth() / 2,
      y + ((lines.length - 1) / 2 - i) * lh, 0,
    ]));
    const box = group([card, ...labels]);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) box.scale(maxw / wd);
    return put('box', box);
  }

  function bikeCard([id, brand], x, y, detail) {
    const color = detail === 'brand' ? brandColor[brand] : C.cyan;
    return group([
      rect(x, y, 1.56, 0.79, color, color, 0.1),
      text(`Bike ${id}`, x, y + (detail ? 0.18 : 0), 18, C.ink, true, true),
      ...(detail ? [text(detail === 'brand' ? brand : 'Price ?', x, y - 0.19, 17, color)] : []),
    ]);
  }

  function bikeGrid(detail) {
    return group(TRAIN.map((bike, i) => bikeCard(
      bike, CX + (i % 4 - 1.5) * 1.77, P ? 0.65 - Math.floor(i / 4) * 1.12 : 0.53 - Math.floor(i / 4),
      detail,
    )));
  }

  function brandCards() {
    return BRANDS.map((brand, j) => {
      const x = CX + (j - 1) * 2.21;
      const ids = TRAIN.filter(([, b]) => b === brand).map(([id]) => id);
      return group([
        rect(x, -0.18, 2.04, 1.56, brandColor[brand], brandColor[brand], 0.11),
        text(brand, x, 0.28, 23, brandColor[brand], false, true),
        ...ids.map((id, i) => text(`Bike ${id}`, x, -0.13 - i * 0.3, 16, C.ink, true)),
      ]);
    });
  }

  function listing(names) {
    return group(names.map(([label, value, color], i) => {
      const x = CX + (i - (names.length - 1) / 2) * 2.61;
      return group([
        rect(x, 0, 2.35, 1.17, color),
        text(label, x, 0.28, 19, C.muted),
        text(value, x, -0.18, 25, color, false, true),
      ]);
    }));
  }

  function numberTags() {
    return group(BRANDS.map((brand, i) => {
      const x = CX + (i - 1) * 2.08;
      return group([
        rect(x, 0, 1.87, 1.25, brandColor[brand]),
        text(brand, x, 0.28, 22, brandColor[brand]),
        text(i + 1, x, -0.26, 28, C.ink, true, true),
      ]);
    }));
  }

  const numberX = i => CX + (i - 1) * 2.1;
  const axisY = LINE_Y - (P ? 1.07 : 0.58);

  function numberLine() {
    return group([
      line(CX - 3.02, axisY, CX + 3.02, axisY),
      ...BRANDS.flatMap((brand, i) => {
        const x = numberX(i);
        const dot = new M.Dot({ point: [x, axisY, 0], radius: 0.1, color: brandColor[brand] });
        dot.setFill(brandColor[brand], 1);
        return [
          dot,
          text(brand, x, axisY + 0.37, 21, brandColor[brand]),
          text(i + 1, x, axisY - 0.34, 22, C.ink, true, true),
        ];
      }),
    ]);
  }

  function equalSteps(y, label) {
    return group([0, 1].flatMap(i => {
      const left = numberX(i), right = numberX(i + 1);
      return [
        arrow(left + 0.08, y, right - 0.08, y, C.amber),
        text(label, (left + right) / 2, y + 0.24, 16, C.amber),
      ];
    }));
  }

  function switches(brand, showDigits, caption) {
    const values = bits(brand);
    return group([
      text(caption, CX, P ? 0.79 : 0.97, 24, C.ink, false, true),
      ...BRANDS.flatMap((b, i) => {
        const x = numberX(i), on = values[i], tint = on ? brandColor[b] : C.muted;
        const bulb = new M.Circle({ radius: 0.22, color: tint, strokeWidth: 2 });
        bulb.setFill(tint, on ? 0.95 : 0.09);
        bulb.moveTo([x, -0.12, 0]);
        return [
          rect(x, -0.34, 1.87, 1.52, tint, tint, on ? 0.12 : 0.035),
          text(b, x, 0.2, 20, brandColor[b]),
          bulb,
          text(showDigits ? `${on}  ${on ? 'ON' : 'OFF'}` : on ? 'ON' : 'OFF',
            x, -0.68, 18, tint, true, true),
        ];
      }),
    ]);
  }

  function headings() {
    return group(['Bike', 'Brand', ...BRANDS].map((label, j) => {
      const x = tableX[j], color = brandColor[label] || C.ink;
      return group([
        rect(x, headerY, columnW[j], P ? 0.44 : 0.37, C.line),
        text(label, x, headerY, P ? 18 : 17, color, false, true),
      ]);
    }));
  }

  function tableRow([id, brand], i, highlight = false) {
    const y = rowY(i), values = bits(brand);
    const fill = highlight ? C.violet : C.card;
    const row = rect(
      (tableLeft + tableRight) / 2, y, tableRight - tableLeft, rowH,
      highlight ? C.violet : C.line, fill, highlight ? 0.12 : 0.77,
    );
    return group([
      row,
      text(id, tableX[0], y, 17, C.ink, true, true),
      text(brand, tableX[1], y, P ? 18 : 17, brandColor[brand]),
      ...values.flatMap((value, j) => {
        const color = value ? brandColor[BRANDS[j]] : C.muted;
        const x = tableX[j + 2];
        return [
          rect(x, y, 0.72, rowH - 0.035, value ? color : C.line, color, value ? 0.24 : 0.035),
          text(value, x, y, 17, color, true, true),
        ];
      }),
    ]);
  }

  function addRow(i, bike = TRAIN[i], highlight = false) {
    return put(`row${i}`, tableRow(bike, i, highlight));
  }

  function columnGuide(first, last, bottomRow, color) {
    const left = tableX[first] - columnW[first] / 2 - 0.045;
    const right = tableX[last] + columnW[last] / 2 + 0.045;
    const top = headerY + 0.25, bottom = rowY(bottomRow) - rowH / 2 - 0.03;
    return rect((left + right) / 2, (top + bottom) / 2, right - left, top - bottom, color, C.card, 0);
  }

  function cellGuide(rows, test, color) {
    return group(rows.flatMap(i => BRANDS.flatMap((brand, j) => {
      if (!test(brand, j, i)) return [];
      return [rect(tableX[j + 2], rowY(i), 0.87, rowH + 0.025, color, C.card, 0)];
    })));
  }

  function countPicture() {
    return group(BRANDS.map((brand, i) => {
      const x = numberX(i), color = brandColor[brand];
      const count = TRAIN.filter(([, b]) => b === brand).length;
      return group([
        rect(x, 0, 1.92, 1.39, color, color, 0.1),
        text(brand, x, 0.39, 21, color, false, true),
        text('1 column', x, -0.02, 18, C.ink, true),
        text(`${count} bikes`, x, -0.4, 18, C.muted),
      ]);
    }));
  }

  function widePicture() {
    const dx = 0.127;
    return group([
      text('500 columns', CX, 0.94, 27, C.ink, false, true),
      ...Array.from({ length: 10 }, (_, i) => {
        const x = CX + (i - 4.5) * 0.635;
        return rect(x, 0.43, 0.57, 0.23, C.violet, C.violet, 0.12);
      }),
      text('10 groups of 50', CX, 0.02, 19, C.violet, true),
      ...Array.from({ length: 50 }, (_, i) => {
        const color = i === 10 ? C.cyan : C.muted;
        return rect(CX + (i - 24.5) * dx, -0.62, 0.085, 0.25, color, color, i === 10 ? 1 : 0.1);
      }),
      text('One group shown for one bike', CX, -1.1, 18, C.ink),
    ]);
  }

  function rarePicture() {
    return group([1, 2].flatMap((count, i) => {
      const x = CX + (i ? 1.64 : -1.64);
      return [
        rect(x, -0.18, 2.94, 1.91, C.muted),
        text(`Example brand ${i ? 'B' : 'A'}`, x, 0.48, 19, C.ink, false, true),
        ...Array.from({ length: count }, (_, j) => {
          const bx = x + (j - (count - 1) / 2) * 0.68;
          return rect(bx, -0.14, 0.48, 0.44, C.cyan, C.cyan, 0.3);
        }),
        text(`${count} bike${count === 1 ? '' : 's'}`, x, -0.79, 20, C.cyan, true),
      ];
    }));
  }

  // 0–9. The listings, the price question, and the feature made of names.
  await until(S(0));
  await play(...put('main', bikeGrid()), ...say('8 USED BIKES'));

  await until(S(1));
  await play(...put('main', bikeGrid('price')), ...say('GUESS THE PRICE', C.amber));

  await until(S(2));
  await play(...put('main', bikeGrid('brand')), ...say('FALCON · RIDGE · SWIFT'));

  await until(S(3));
  await play(...say('THE MODEL LEARNS FROM THESE 8 BIKES', C.green));

  await until(S(4));
  await play(...put('main', brandCards(), true), ...say('TRAINING BIKES BY BRAND'));

  await until(S(5));
  await play(...put('main', group([
    text('Numbers', CX - 2.43, 0, 25, C.cyan, false, true),
    arrow(CX - 1.47, 0, CX - 0.85, 0),
    rect(CX, 0, 1.64, 0.8, C.violet),
    text('Model', CX, 0, 23, C.violet, false, true),
    arrow(CX + 0.85, 0, CX + 1.46, 0),
    text('Price guess', CX + 2.51, 0, 21, C.amber, false, true),
  ])), ...say('THE MODEL WORKS WITH NUMBERS', C.violet));

  await until(S(6));
  await play(...put('main', listing([['Brand', 'Falcon', C.cyan]])), ...say('BRAND IS A NAME'));

  await until(S(7));
  await play(...put('main', listing([
    ['Age', '1 year', C.violet], ['Brand', 'Falcon', C.cyan],
  ])), ...say('EACH PIECE OF INFORMATION IS A FEATURE'));

  await until(S(8));
  await play(...put('main', listing([
    ['Brand', 'Falcon', C.cyan], ['Colour', 'A colour name', C.pink],
  ])), ...say('NAMES MAKE A CATEGORY FEATURE', C.pink));

  await until(S(9));
  await play(...put('main', group([
    text('Falcon', CX - 1.7, 0, 27, C.cyan),
    arrow(CX - 0.78, 0, CX + 0.72, 0),
    text('?', CX + 1.41, 0, 32, C.amber, true, true),
  ])), ...say('HOW DO WE TURN A NAME INTO NUMBERS?', C.amber));

  // 10–16. Give the invented codes literal distances on a number line.
  await until(S(10));
  await play(...put('main', numberTags()), ...say('FIRST IDEA: GIVE EACH BRAND A NUMBER'));

  await until(S(11));
  await play(...put('main', numberLine()), ...say('PUT THE NUMBERS ON A LINE'));

  await until(S(12));
  await play(...put('guide', equalSteps(axisY + 0.81, '1 step')), ...say('RIDGE LOOKS HALFWAY', C.amber));

  await until(S(13));
  await play(...put('guide', line(numberX(0), axisY - 0.67, numberX(2), axisY - 0.67, C.pink)),
    ...fbox(['Falcon = 1', 'Swift  = 3', ['3 is 3 × 1', C.pink]], C.pink),
    ...say('SWIFT LOOKS THREE TIMES AS BIG', C.pink));

  await until(S(14));
  await play(...put('guide', text('These positions are made up', CX, axisY - 0.86, 19, C.pink)),
    ...put('box'), ...say('THAT ORDER AND THOSE DISTANCES ARE MADE UP', C.pink));

  await until(S(15));
  await play(...put('guide'), ...fbox(['Model sees 1, 2, 3', ['It can use those gaps', C.amber]], C.amber),
    ...say('THE MODEL TAKES THE NUMBERS SERIOUSLY', C.amber));

  await until(S(16));
  await play(...put('guide', equalSteps(axisY + 0.81, 'same step')),
    ...fbox(['Possible model rule', 'Each step changes the', ['price by the same amount', C.amber]], C.amber),
    ...say('EQUAL STEPS COULD MEAN EQUAL PRICE CHANGES', C.amber));

  // 17–29. See the light switches first, then read the same picture as a table.
  await until(S(17));
  await play(...put('guide'), ...put('box'), ...put('main', switches(null, false, 'One switch per brand')),
    ...say('THREE LIGHT SWITCHES', C.green));

  await until(S(18));
  await play(...put('main', switches('Falcon', false, 'Bike 1 · Falcon')), ...say('TURN ON THE BIKE’S BRAND'));

  await until(S(19));
  await play(...put('main', switches('Falcon', true, 'Bike 1 · Falcon')),
    ...fbox([['On  = 1', C.cyan], 'Off = 0']), ...say('ON IS ONE · OFF IS ZERO'));

  await until(S(20));
  await play(...put('main', headings()), ...addRow(0, TRAIN[0], true),
    ...fbox(['Bike 1 · Falcon', ['1   0   0', C.cyan]]), ...say('BIKE 1: FALCON'));

  await until(S(21));
  await play(...addRow(0), ...addRow(1, TRAIN[1], true),
    ...fbox(['Bike 2 · Ridge', ['0   1   0', C.amber]], C.amber), ...say('BIKE 2: RIDGE', C.amber));

  await until(S(22));
  await play(...addRow(1), ...addRow(2, TRAIN[2], true),
    ...fbox(['Bike 3 · Swift', ['0   0   1', C.pink]], C.pink), ...say('BIKE 3: SWIFT', C.pink));

  await until(S(23));
  await play(...addRow(2), ...addRow(3, TRAIN[3], true), ...addRow(6, TRAIN[6], true),
    ...put('guide', cellGuide([0, 3, 6], brand => brand === 'Falcon', C.cyan)),
    ...fbox(['Bikes 1, 4 and 7', ['Falcon → 1   0   0', C.cyan]]), ...say('SAME BRAND, SAME SWITCHES'));

  await until(S(24));
  await play(...addRow(3), ...addRow(4), ...addRow(5), ...addRow(6), ...addRow(7),
    ...put('guide', columnGuide(2, 4, 7, C.cyan)),
    ...fbox(['Is it a Falcon?', 'Is it a Ridge?', 'Is it a Swift?']), ...say('ONE BRAND COLUMN BECOMES THREE'));

  await until(S(25));
  await play(...fbox([['1 answers yes', C.green], '0 answers no', 'Every column asks one question'], C.green),
    ...say('YES OR NO IN EACH COLUMN', C.green));

  await until(S(26));
  await play(...put('guide', cellGuide(TRAIN.map((_, i) => i), (brand, j, i) => TRAIN[i][1] === brand, C.green)),
    ...fbox(['Switches on', ['1 in each training row', C.green]], C.green), ...say('EXACTLY ONE LIGHT PER BIKE', C.green));

  await until(S(27));
  await play(...put('guide', cellGuide([0], () => true, C.violet)),
    ...fbox([['Hot = switched on', C.cyan], '1 on', '2 off']), ...say('ONE-HOT ENCODING'));

  await until(S(28));
  await play(...fbox([['Falcon', C.cyan], 'Same brand information', ['1   0   0', C.cyan]]),
    ...say('ENCODING WRITES THE SAME INFORMATION IN A NEW FORM'));

  await until(S(29));
  await play(...put('guide', columnGuide(2, 4, 7, C.cyan)),
    ...fbox(['One column per brand', ['Own brand → 1', C.cyan], 'Every other brand → 0']),
    ...say('THE ONE-HOT RULE'));

  // 30–40. Freeze the training columns and use them for both new bikes.
  await until(S(30));
  await play(...fbox(['Brands in training', 'Falcon · Ridge · Swift', ['3 brands → 3 columns', C.cyan]]),
    ...say('THE TRAINING BIKES SET THE COLUMNS'));

  await until(S(31));
  await play(...fbox([['Three brand switches', C.cyan], 'Model learns their effects', ['Price guess', C.amber]], C.violet),
    ...say('TRAINING LEARNS HOW THE SWITCHES AFFECT THE PRICE', C.violet));

  await until(S(32));
  await play(...put('guide', columnGuide(2, 4, 7, C.violet)),
    ...fbox(['After training', ['Falcon · Ridge · Swift', C.violet], 'The columns are fixed'], C.violet),
    ...say('KEEP THE SAME THREE SWITCHES', C.violet));

  await until(S(33));
  await play(...put('guide', group([
    rect(tableX[1], rowY(8), 1.43, rowH, C.muted),
    text('N1', tableX[0], rowY(8), 17, C.ink, true, true),
    text('Comet', tableX[1], rowY(8), 18, C.muted),
  ])), ...fbox(['New bike N1', ['Brand: Comet', C.muted]]), ...say('NEW LISTING: N1 · COMET', C.muted));

  await until(S(34));
  await play(...fbox(['Training bikes with Comet', ['0 bikes', C.muted], 'Comet has no switch']),
    ...say('COMET WAS UNSEEN IN TRAINING', C.muted));

  await until(S(35));
  await play(...fbox(['Choose a rule for', 'a brand unseen in training', ['Use it for every new bike', C.violet]], C.violet),
    ...say('DECIDE THE RULE IN ADVANCE', C.violet));

  await until(S(36));
  await play(...put('guide'), ...addRow(8, NEW[0], true),
    ...fbox(['N1 · Comet', ['0   0   0', C.muted], 'All switches off']),
    ...say('UNSEEN BRAND → ALL ZEROS', C.muted));

  await until(S(37));
  await play(...put('guide', cellGuide([8], () => true, C.muted)),
    ...fbox(['Falcon? No', 'Ridge?  No', 'Swift?  No']), ...say('N1 ANSWERS NO IN ALL THREE COLUMNS', C.muted));

  await until(S(38));
  await play(...put('guide', columnGuide(2, 4, 8, C.violet)),
    ...fbox(['Same three columns', 'No learned effect', ['for a Comet switch', C.muted]], C.violet),
    ...say('KEEP THE COLUMNS FIXED', C.violet));

  await until(S(39));
  await play(...addRow(8, NEW[0]), ...addRow(9, NEW[1], true),
    ...put('guide', cellGuide([0, 9], brand => brand === 'Falcon', C.cyan)),
    ...fbox(['N2 · Falcon', ['1   0   0', C.cyan], 'Same as bike 1']), ...say('N2 USES THE FALCON SWITCH'));

  await until(S(40));
  await play(...put('guide', columnGuide(2, 4, 9, C.green)),
    ...fbox(['Category feature → switches', ['One yes-or-no question', C.green], 'per training brand'], C.green),
    ...say('LET THE MODEL USE BRAND WITHOUT RANKING IT', C.green));

  // 41–49. Show the limits, preview the three challenges, and recap.
  await until(S(41));
  await play(...clearRows(), ...put('guide'), ...put('main', countPicture()),
    ...fbox(['Each brand adds 1 column', ['3 brands → 3 columns', C.cyan]]), ...say('EVERY BRAND ADDS A COLUMN', C.amber));

  await until(S(42));
  await play(...put('main', widePicture()),
    ...fbox(['500 brands → 500 columns', ['Known bike: 1 one', C.cyan], 'and 499 zeros'], C.amber),
    ...say('WITH 500 BRANDS, MOST CELLS ARE ZERO', C.amber));

  await until(S(43));
  await play(...put('main', rarePicture()),
    ...fbox(['Only 1 or 2 examples', ['Very little to learn from', C.amber]], C.amber),
    ...say('A RARE BRAND GIVES THE MODEL FEW EXAMPLES', C.amber));

  await until(S(44));
  await play(...put('main', group([
    rect(CX, -0.15, 5.58, 1.53, C.violet),
    text('Lesson 12.2.4', CX, 0.12, 24, C.violet, true, true),
    text('Another way to handle brands', CX, -0.51, 21, C.ink),
  ])), ...put('box'), ...say('LATER IN THIS CHAPTER', C.violet));

  await until(S(45));
  await play(...put('main', switches('Ridge', true, 'Bike 5 · Ridge')),
    ...say('TRY IT: CHANGE A BIKE’S BRAND', C.green));
  await until(S(45) + 1.65);
  await play(...put('main', switches('Falcon', true, 'Bike 5 · try Falcon')));

  await until(S(46));
  await play(...put('main', switches('Ridge', true, 'Bike 5 · Ridge')),
    ...fbox(['Bike 5 target', ['0   0   1', C.pink]], C.pink),
    ...say('CHALLENGE 1: MATCH THE SWITCHES', C.pink));

  await until(S(47));
  await play(...put('main', group([
    rect(CX, 0.1, 5.24, 0.82, C.muted),
    text('Type an unseen brand', CX, 0.1, 24, C.ink),
    text('?     ?     ?', CX, -0.89, 29, C.amber, true, true),
  ])), ...fbox(['Predict first', 'Then press Enter']),
    ...say('CHALLENGE 2: PREDICT THE SWITCHES', C.amber));

  await until(S(48));
  await play(...put('main', switches('Falcon', true, 'Bike 1 · Falcon')),
    ...put('guide', text('A second light cannot turn on', CX, -1.49, 20, C.amber)),
    ...fbox(['Try a second light', ['A bike has one brand', C.amber]], C.amber),
    ...say('CHALLENGE 3: TRY TURNING ON TWO LIGHTS', C.amber));

  await until(S(49));
  await play(...put('guide'), ...put('main', headings()), ...addRow(0, TRAIN[0]), ...addRow(1, TRAIN[1]),
    ...addRow(2, TRAIN[2]), ...addRow(3, NEW[0], true),
    ...fbox(['One column per training brand', ['Seen brand → one 1', C.green], 'Unseen brand → all zeros'], C.green),
    ...say('ONE-HOT ENCODING', C.green));
}
