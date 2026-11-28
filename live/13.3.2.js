// 13.3.2 Resampling for imbalance. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const VALID = P ? [0, -2.6, 0] : [4.3, -0.3, 0];
  const KC = P ? 1.6 : 1.18, PITCH = 1.65;
  const SP = P ? 1.5 : 0.98;
  const PY = P ? 0.35 : 0.4;
  const MY = P ? -3.6 : -2.0;
  const BLUE = '#70baff';
  const ORANGE = '#ffad66';
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (x, y) => [x, y, 0];
  const left = CX - 4 * SP;
  const slot = (i, y) => P ? at(CX + (i % 5 - 2) * SP, y - Math.floor(i / 5) * PITCH) : at(left + i * SP, y);
  const line = (x1, y1, x2, y2, color) => new M.Line({
    start: at(x1, y1), end: at(x2, y2), color, strokeWidth: 2
  });

  const plastic = [...'ABCDEFGHI'].map((id, i) => ({
    id, metal: false, shape: i, appearance: i < 7 ? 'matte' : i === 7 ? 'shiny' : 'mixed'
  }));
  const metal = [...'JKL'].map((id, i) => ({
    id, metal: true, shape: i, appearance: i < 2 ? 'shiny' : 'mixed'
  }));
  const held = [
    { ...plastic[1], id: 'V1' }, { ...plastic[4], id: 'V2' },
    { ...plastic[8], id: 'V3' }, { ...metal[0], id: 'V4' }
  ];

  function frame(x, y, width, height, color, fill = C.card) {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.09, color, strokeWidth: 2 });
    rect.setFill(fill, 0.96);
    rect.moveTo(at(x, y));
    return rect;
  }

  function photo(item, point, practice = false, copy = 0, extra = 1) {
    const [x, y] = point;
    const color = item.metal ? ORANGE : BLUE;
    const body = frame(x, y, 0.73, 0.92, color, practice ? '#1b2946' : C.card);
    const w = 0.23 + (item.shape % 3) * 0.045;
    const imageY = y + 0.15;
    let image;
    if (item.metal) {
      image = new M.Rectangle({ width: w, height: item.shape === 1 ? 0.23 : 0.32, color, strokeWidth: 2 });
    } else {
      image = new M.RoundedRectangle({
        width: w, height: item.shape % 2 ? 0.30 : 0.22, cornerRadius: 0.07, color, strokeWidth: 2
      });
    }
    image.setFill(color, item.appearance === 'matte' ? 0.35 : 0.65);
    image.moveTo(at(x, imageY));
    const detail = item.appearance === 'matte'
      ? line(x - w / 3, imageY, x + w / 3, imageY, color)
      : line(x - w / 4, imageY - 0.06, x + w / 4, imageY + 0.06, C.ink);
    const tag = item.metal
      ? new M.Rectangle({ width: 0.10, height: 0.10, color, strokeWidth: 1 })
      : new M.Circle({ radius: 0.05, color, strokeWidth: 1 });
    tag.setFill(color, 1);
    tag.moveTo(at(x - 0.21, y - 0.27));
    const id = T(item.id, 16, C.ink, true, true).moveTo(at(x, y - 0.10));
    const status = T(copy ? 'copy' : '✓', 13, color, true).moveTo(at(x + 0.06, y - 0.28));
    const card = new M.VGroup(body, image, detail, tag, id, status);
    card.scale(KC * extra); card.moveTo(at(x, y));
    return card;
  }

  let boxNow = null;
  function clearBox() {
    const actions = boxNow ? [new M.FadeOut(boxNow)] : [];
    boxNow = null;
    return actions;
  }

  function fbox(lines, color = C.cyan) {
    const [x, y] = BOXP;
    const lh = 0.37;
    const labels = lines.map(entry => {
      const [text, ink] = Array.isArray(entry) ? entry : [entry, C.ink];
      return T(text, P ? 22 : 21, ink, true);
    });
    const width = Math.max(...labels.map(t => t.getWidth())) + 0.52;
    labels.forEach((t, i) => t.moveTo(at(x, y + ((labels.length - 1) / 2 - i) * lh)));
    const box = new M.VGroup(frame(x, y, width, labels.length * lh + 0.30, color), ...labels);
    const maxWidth = P ? FW - 1.2 : 4.6;
    if (width > maxWidth) box.scale(maxWidth / width);
    const actions = clearBox();
    boxNow = box;
    return [...actions, new M.FadeIn(box)];
  }

  const rowLabel = (name, y, color) => T(name, P ? 22 : 21, color, false, true).moveTo(at(CX, y + (P ? 0.97 : 0.75)));
  const pLabel = rowLabel('Plastic', PY, BLUE);
  const mLabel = rowLabel('Metal', MY, ORANGE);
  const samples = new Map();
  const sampleKey = ({ item, copy = 0, practice = false }) => `${item.id}:${copy}:${practice}`;
  const copies = rounds => metal.flatMap(item => Array.from({ length: rounds + 1 }, (_, copy) => ({ item, copy })));
  const layout = (p = plastic, rounds = 0, practice = false) => [
    ...p.map((item, i) => ({ item, point: slot(i, PY), practice })),
    ...copies(rounds).map(({ item, copy }, i) => ({ item, copy, point: slot(i, MY), practice }))
  ];
  const mixed = [plastic[0], metal[0], plastic[1], plastic[2], metal[1], plastic[3],
    plastic[4], plastic[5], metal[2], plastic[6], plastic[7], plastic[8]];
  const contactSheet = mixed.map((item, i) => ({
    item, point: P ? at(CX + (i % 4 - 1.5) * SP, PY - Math.floor(i / 4) * PITCH) : at(CX + (i % 6 - 2.5) * SP, i < 6 ? PY : MY)
  }));

  function update(entries) {
    const actions = [];
    const keys = new Set();
    for (const { item, point, copy = 0, practice = false } of entries) {
      const key = sampleKey({ item, copy, practice });
      keys.add(key);
      const previous = samples.get(key);
      if (!previous) {
        const card = photo(item, point, practice, copy);
        samples.set(key, { card, point });
        actions.push(new M.FadeIn(card));
      } else if (previous.point[0] !== point[0] || previous.point[1] !== point[1]) {
        actions.push(new M.Transform(previous.card, photo(item, point, practice, copy)));
        previous.point = point;
      }
    }
    for (const [key, { card }] of samples) {
      if (keys.has(key)) continue;
      actions.push(new M.FadeOut(card));
      samples.delete(key);
    }
    return actions;
  }

  function pulse(entries, color) {
    const actions = entries.map(entry =>
      new M.Indicate(samples.get(sampleKey(entry)).card, { color }));
    return new M.LaggedStart(actions, { lagRatio: 0.13, runTime: 1.45 });
  }

  const plasticRow = entries => entries.filter(e => !e.item.metal);
  const metalRow = entries => entries.filter(e => e.item.metal);
  const start = layout();
  const practice = layout(plastic, 0, true);
  const practiceCopies = layout(plastic, 1, true);
  const first = layout(plastic, 1);
  const over = layout(plastic, 2);
  const under = layout(plastic.slice(0, 3));
  function makeVal(vx, vy, s) {
    const fr = frame(vx, vy, (P ? 7.2 : 4.5) * s, (P ? 3.6 : 2.6) * s, C.violet);
    const ch = T('Checking photos', Math.round(21 * s), C.violet, false, true).moveTo(at(vx, vy + (P ? 1.45 : 0.98) * s));
    const cards = held.map((item, i) => photo(item, at(vx + (i - 1.5) * (P ? 1.7 : SP) * s, vy + (P ? 0.15 : 0.03) * s), false, 0, s));
    const mix = T('3 plastic · 1 metal', Math.round(18 * s), C.ink, true).moveTo(at(vx, vy - (P ? 1.4 : 0.95) * s));
    return { fr, ch, cards, mix, all: [fr, ch, ...cards, mix] };
  }
  // Laptop: the panel is large and central while it is alone, then moves aside when the learning rows return.
  const bigVal = P ? makeVal(VALID[0], VALID[1], 1) : makeVal(0, -0.75, 1.4);
  const sideVal = P ? bigVal : makeVal(VALID[0], VALID[1], 1);
  const validationFrame = bigVal.fr, validation = bigVal.cards;
  let checked = bigVal.ch, validationMix = bigVal.mix;

  // The worker labels the photos, then sorts them by material.
  await until(S(0)); await play(...update([contactSheet[0], contactSheet[1]].map((entry, i) => ({
    ...entry, point: at(CX + (i - 0.5) * (P ? 1.7 : SP), (PY + MY) / 2)
  }))), ...say('SORTING AT THE RECYCLING FACILITY'));
  await until(S(1)); await play(...update(contactSheet), ...say('12 LABELLED PHOTOS'));
  await until(S(2)); await play(...update(start), ...say('SORT INTO TWO ROWS'));
  await until(S(3)); await play(new M.FadeIn(pLabel), pulse(plasticRow(start), BLUE), ...say('9 PLASTIC', BLUE));
  await until(S(4)); await play(new M.FadeIn(mLabel), pulse(metalRow(start), ORANGE), ...say('3 METAL', ORANGE));
  await until(S(5)); await play(...fbox([['3 plastic for every 1 metal', ORANGE]]),
    pulse([start[0], start[1], start[2], start[9]], C.amber));
  await until(S(6)); await play(...say('MORE PRACTICE WITH PLASTIC', BLUE), pulse(plasticRow(start), BLUE));
  await until(S(7)); await play(...clearBox(), ...say('CHANGE THE PRACTICE MIX?', C.violet));

  // Practice cards show how repeating examples changes the mix.
  await until(S(8)); await play(...update(practice), ...say('A TEACHER’S PRACTICE CARDS'));
  await until(S(9)); await play(...fbox([['9 plastic cards', BLUE], ['3 metal cards', ORANGE]]));
  await until(S(10)); await play(...update(practiceCopies), ...clearBox(), ...say('COPY THE METAL CARDS', ORANGE));
  await until(S(11)); await play(pulse(metalRow(practiceCopies), ORANGE), ...say('MORE PRACTICE WITH METAL', ORANGE));
  await until(S(12)); await play(...update(start), ...say('BACK TO THE PHOTOS'));
  await until(S(13)); await play(...say('RESAMPLING', C.violet), ...fbox(['Choose or repeat', 'learning examples']));

  // Repeat J, K and L in two rounds. Copies retain the photo and its label.
  await until(S(14)); await play(...clearBox(), pulse(metalRow(start), ORANGE), ...say('START WITH J, K AND L', ORANGE));
  await until(S(15)); await play(...update(first), ...say('ONE COPY OF EACH', ORANGE));
  await until(S(16)); await play(pulse(metalRow(first), ORANGE), ...say('SAME PICTURE · SAME LABEL', ORANGE));
  await until(S(17)); await play(...fbox([['9 plastic', BLUE], ['6 metal', ORANGE]]), ...say('COUNT THE LEARNING EXAMPLES'));
  await until(S(18)); await play(...fbox([['9 plastic', BLUE], ['6 metal', ORANGE], ['15 examples', C.amber]]));
  await until(S(19)); await play(...fbox(['Metal share', ['6 of 15 = 40%', ORANGE]]), pulse(metalRow(first), ORANGE));
  await until(S(20)); await play(...fbox(['Before: 3 of 12 = 25%', ['Now: 6 of 15 = 40%', ORANGE]]));
  await until(S(21)); await play(...update(over), ...clearBox(), ...say('COPY J, K AND L AGAIN', ORANGE));
  await until(S(22)); await play(...fbox([['Metal: 6 → 9', ORANGE]]), pulse(over.filter(e => e.copy === 2), ORANGE));
  await until(S(23)); await play(...fbox([['Plastic: still 9', BLUE], ['Metal: 9', ORANGE]]), pulse(plasticRow(over), BLUE));
  await until(S(24)); await play(...fbox([['9 plastic', BLUE], ['9 metal', ORANGE], ['18 examples', C.amber]]),
    ...say('TWO EQUAL ROWS', C.green));
  await until(S(25)); await play(...say('OVERSAMPLING', ORANGE));

  // Start over and remove six plastic entries.
  await until(S(26)); await play(...clearBox(), ...say('ANOTHER WAY TO BALANCE THE ROWS', C.violet));
  await until(S(27)); await play(...update(start), ...fbox([['9 plastic', BLUE], ['3 metal', ORANGE]]),
    ...say('THE ORIGINAL PHOTOS'));
  await until(S(28)); await play(pulse(plasticRow(start).slice(3), BLUE), ...say('REMOVE SIX PLASTIC PHOTOS', BLUE));
  await play(...update(under), ...clearBox());
  await until(S(29)); await play(...fbox([['3 plastic kept', BLUE], ['3 metal kept', ORANGE]]), ...say('THE PHOTOS WE KEEP'));
  await until(S(30)); await play(...fbox([['3 plastic', BLUE], ['3 metal', ORANGE], ['6 examples', C.amber]]),
    ...say('TWO EQUAL ROWS', C.green));
  await until(S(31)); await play(...say('UNDERSAMPLING', BLUE));

  // Work the same formula on each visible practice pile.
  await until(S(32)); await play(...clearBox(), ...say('HOW BALANCED IS THE PILE?', C.violet));
  await until(S(33)); await play(...fbox([['Metal share', ORANGE], 'Metal count ÷ total count']));
  await until(S(34)); await play(...update(start), ...fbox(['Metal share', ['3 ÷ 12 = ¼ = 25%', ORANGE]]),
    ...say('BEFORE RESAMPLING'));
  await until(S(35)); await play(...update(over), ...fbox(['Metal share', ['9 ÷ 18 = ½ = 50%', ORANGE]]),
    ...say('AFTER OVERSAMPLING', ORANGE));
  await until(S(36)); await play(...update(under), ...fbox(['Metal share', ['3 ÷ 6 = ½ = 50%', ORANGE]]),
    ...say('AFTER UNDERSAMPLING', BLUE));
  await until(S(37)); await play(...fbox([['Oversampling: 9 of 18', ORANGE], ['Undersampling: 3 of 6', BLUE],
    ['Both: 50% metal', C.green]]), ...say('TWO WAYS TO AN EQUAL MIX', C.green));
  await until(S(38)); await play(...update(over), ...fbox([['Oversampling: keep all 12', ORANGE],
    ['Undersampling: leave out 6', BLUE]]));
  await play(...update(under));

  // Validation cards stay in the same panel as the learning rows change.
  await until(S(39)); await play(...update([]), ...clearBox(), new M.FadeOut(pLabel), new M.FadeOut(mLabel),
    new M.FadeIn(validationFrame), new M.FadeIn(checked),
    new M.LaggedStart(validation.map(card => new M.FadeIn(card)), { lagRatio: 0.17, runTime: 1.5 }),
    ...say('FOUR SEPARATE PHOTOS', C.violet));
  await until(S(40)); await play(new M.FadeIn(validationMix), ...say('3 PLASTIC · 1 METAL', C.violet));
  await until(S(41)); await play(...say('CHECK ON UNSEEN PHOTOS', C.violet), new M.Indicate(checked, { color: C.violet }));
  await until(S(42)); await play(...say('VALIDATION SET', C.violet));
  await until(S(43)); await play(...say('THE SAME FOUR PHOTOS', C.violet), new M.Indicate(validationMix, { color: C.violet }));
  await until(S(44)); await play(...say('THE FACILITY EXAMPLE’S MIX', C.violet), new M.Indicate(validationMix, { color: C.violet }));
  await until(S(45)); await play(...say('CHANGE THE LEARNING MIX', C.green), new M.Indicate(checked, { color: C.violet }));
  const valAll = () => [validationFrame, checked, ...validation, validationMix];
  if (!P) {
    await play(...bigVal.all.map(o => new M.FadeOut(o)), ...sideVal.all.map(o => new M.FadeIn(o)),
      ...update(over), new M.FadeIn(pLabel), new M.FadeIn(mLabel));
    checked = sideVal.ch; validationMix = sideVal.mix;
  }

  // A balanced count can hide repeated photos or lost variety.
  await until(S(46)); await play(...(P ? valAll().map(o => new M.FadeOut(o)) : []), ...(P ? [new M.FadeIn(pLabel), new M.FadeIn(mLabel)] : []), ...update(start), ...say('WHEN ONE MATERIAL IS RARE', C.amber), pulse(metalRow(start), ORANGE));
  await until(S(47)); await play(...update(over), ...say('LOOK AT THE NINE METAL ENTRIES', ORANGE));
  await until(S(48)); await play(pulse(metalRow(over).filter(e => !e.copy), ORANGE), ...say('ONLY THREE DIFFERENT PHOTOS', ORANGE));
  await until(S(49)); await play(pulse(metalRow(over).filter(e => e.copy), ORANGE), ...say('REPEATED PHOTOS', ORANGE));
  await until(S(50)); await play(...update(start), ...say('LOOK AT THE PLASTIC VARIETY', BLUE));
  await play(pulse(plasticRow(start).slice(6), BLUE));
  await play(...update(under));
  await until(S(51)); if (P) await play(...update([]), new M.FadeOut(pLabel), new M.FadeOut(mLabel), ...valAll().map(o => new M.FadeIn(o)));
  await play(...say('DOES BALANCE HELP PREDICTION?', C.amber), new M.Indicate(checked, { color: C.violet }));
  await until(S(52)); await play(...say('CHANGE LEARNING · KEEP CHECKING', C.green),
    new M.Indicate(validationMix, { color: C.violet }));
}
