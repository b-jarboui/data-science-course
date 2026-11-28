// 13.3.4 Semi-supervised learning. Beat i follows sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const BLUE = '#7cbaff', ORANGE = '#fb923c';
  const name = { matte: 'Matte', shiny: 'Shiny', mixed: 'Mixed' };
  const lanes = ['matte', 'shiny', 'mixed'];
  const known = {
    matte: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    shiny: ['H', 'J', 'K'],
    mixed: ['I', 'L'],
  };
  const checks = [
    ['V1', 'matte', 'Plastic'], ['V2', 'matte', 'Plastic'],
    ['V3', 'mixed', 'Plastic'], ['V4', 'shiny', 'Metal'],
  ];
  const waiting = [
    ['U1', 'matte'], ['U2', 'mixed'], ['U3', 'mixed'],
    ['U4', 'shiny'], ['U5', 'shiny'],
  ];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.5, -0.3, 0];
  const ROW_Y = P ? [0.95, -2.1, -3.85] : [0.88, -0.48, -1.84];
  const QUEUE_Y = P ? -5.7 : -3.0;
  const K = P ? 1.35 : 1.25, TY = P ? 0.47 : 0.43, PITCH = 1.35;
  const rowY = lane => ROW_Y[lanes.indexOf(lane)];
  const rowX = i => CX + 0.25 + (i - 3.5) * 1.1;
  const queueX = i => CX + (i - 2) * (P ? 1.5 : 1.4);
  const pos = (lane, i) => P ? [CX + (i % 5 - 2) * 1.5, rowY(lane) - Math.floor(i / 5) * PITCH] : [rowX(i), rowY(lane)];
  const headPos = lane => P ? [CX - 2.75, rowY(lane) + (lane === 'matte' ? 0.7 : 0.65)] : [CX - 3.0, rowY(lane) + 0.5];
  const say = (s, color = C.cyan) => showA(s, color, PILL, 18);

  function text(s, x, y, size = 19, color = C.ink, max = 7, mono = true) {
    const t = T(s, size, color, mono, true);
    if (t.getWidth() > max) t.scale(max / t.getWidth());
    return t.moveTo([x, y, 0]);
  }

  function rect(x, y, width, height, stroke, fill = C.card, opacity = 1) {
    const r = new M.RoundedRectangle({
      width, height, cornerRadius: Math.min(height / 2, 0.11), color: stroke, strokeWidth: 2,
    });
    r.setFill(fill, opacity);
    return r.moveTo([x, y, 0]);
  }

  function line(x1, y1, x2, y2, color, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  // The photo tiles use a dull patch, a reflective streak, or both.
  function photo(id, lane, x, y, k = K) {
    const tile = rect(x, y, 0.80, 0.44, C.muted, '#1a2446');
    const patch = rect(x - 0.21, y, 0.25, 0.29, '#52648b', '#52648b');
    const gloss = line(x - 0.29, y - 0.09, x - 0.15, y + 0.09, '#e6f8ff', 2.5);
    const glint = line(x - 0.20, y - 0.09, x - 0.12, y + 0.02, '#9ebdf4', 1.5);
    const surface = lane === 'matte' ? [patch] : lane === 'mixed' ? [patch, glint] : [patch, gloss, glint];
    const g = new M.VGroup(tile, ...surface, text(id, x + 0.14, y, 15, C.ink, 0.38));
    if (k !== 1) { g.scale(k); g.moveTo([x, y, 0]); }
    return g;
  }

  function tag(label, status, x, y, wide = false, k = wide ? 1 : K) {
    const color = label === 'Plastic' ? BLUE : label === 'Metal' ? ORANGE : C.muted;
    const symbol = label === 'Plastic' ? '○' : label === 'Metal' ? '■' : '';
    const words = wide ? ` ${label}` : '';
    const caption = label ? `${symbol}${words}${status === 'checked' ? ' ✓' : ''}` : status;
    const w = wide ? 1.78 : 0.80, r = 0.115;
    const parts = [rect(x, y, w, 2 * r, color, C.bg, 0.95)];
    if (status === 'temporary') {
      parts[0].setStrokeOpacity(0);
      // Draw the broken outline along the same capsule as the solid tags.
      const straight = w - 2 * r;
      const perimeter = 2 * straight + 2 * Math.PI * r;
      const point = d => {
        if (d < straight) return [x - straight / 2 + d, y + r];
        d -= straight;
        if (d < Math.PI * r) return [x + straight / 2 + r * Math.sin(d / r), y + r * Math.cos(d / r)];
        d -= Math.PI * r;
        if (d < straight) return [x + straight / 2 - d, y - r];
        d -= straight;
        return [x - straight / 2 - r * Math.sin(d / r), y - r * Math.cos(d / r)];
      };
      const interval = perimeter / (wide ? 15 : 10);
      for (let d = 0; d < perimeter - interval / 2; d += interval) {
        const a = point(d), b = point(d + interval * 0.30), c = point(d + interval * 0.60);
        parts.push(line(...a, ...b, color), line(...b, ...c, color));
      }
    }
    const g = new M.VGroup(...parts, text(caption, x, y, wide ? 16 : 15, color, w - 0.10));
    if (k !== 1) { g.scale(k); g.moveTo([x, y, 0]); }
    return g;
  }

  const active = new Map();
  function put(key, next, runTime = 0.45) {
    const old = active.get(key);
    const animations = old ? [new M.FadeOut(old, { runTime })] : [];
    active.delete(key);
    if (next) {
      active.set(key, next);
      animations.push(new M.FadeIn(next, { runTime }));
    }
    return animations;
  }

  function clear() {
    const animations = [...active.values()].map(o => new M.FadeOut(o, { runTime: 0.42 }));
    active.clear();
    return animations;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, spacing = P ? 0.38 : 0.42;
    const [x, y] = BOXP;
    const labels = lines.map(row => {
      const [value, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(value, size, ink, true);
    });
    const maxWidth = P ? FW - 1.2 : 4.5;
    const width = Math.min(maxWidth, Math.max(...labels.map(t => t.getWidth())) + 0.65);
    labels.forEach((t, i) => {
      const w0 = t.getWidth(), sc = Math.min(1, (width - 0.54) / w0);
      if (sc < 1) t.scale(sc);
      t.moveTo([x - width / 2 + 0.27 + w0 * sc / 2,
        y + ((labels.length - 1) / 2 - i) * spacing, 0]);
    });
    return put('formula', new M.VGroup(
      rect(x, y, width, labels.length * spacing + 0.34, color, C.card, 0.95), ...labels,
    ));
  }

  const pendingFocus = (...indices) => put('focus', new M.VGroup(...indices.map(i =>
    rect(queueX(i), QUEUE_Y - (P ? 0.28 : 0.3), P ? 1.3 : 1.24, P ? 1.6 : 1.25, C.amber, C.bg, 0))));
  const rowFocus = lane => put('focus', P
    ? rect(CX, rowY(lane) - (lane === 'matte' ? 0.73 : 0.21), 7.7, lane === 'matte' ? 2.4 : 1.1, C.amber, C.bg, 0)
    : rect(CX + 0.25, rowY(lane) - 0.15, 8.9, 1.08, C.amber, C.bg, 0));
  const heading = (lane, title) => put(`heading/${lane}`,
    text(title, ...headPos(lane), 19, C.ink, 1.7));
  const knownTags = lane => known[lane].flatMap((id, i) => put(`tag/${id}`,
    tag(['J', 'K', 'L'].includes(id) ? 'Metal' : 'Plastic', 'checked', pos(lane, i)[0], pos(lane, i)[1] - TY)));

  function score(lane, metal, total, percent) {
    const y = headPos(lane)[1], left = P ? CX - 1.3 : CX - 0.62, width = P ? 1.3 : 1.36;
    const fraction = metal / total;
    const parts = [rect(left + width / 2, y, width, 0.12, C.line, C.line)];
    if (metal) parts.push(rect(left + width * fraction / 2, y, width * fraction, 0.12, ORANGE, ORANGE));
    parts.push(text(`${metal}/${total} metal · ${percent}`, CX + (P ? 2.0 : 2.13), y, 17, ORANGE, 2.78));
    return put(`score/${lane}`, new M.VGroup(...parts));
  }

  function accept(i, lane, slot, label) {
    const [id] = waiting[i], [x, y] = pos(lane, slot);
    return [
      new M.Transform(active.get(`photo/${id}`), photo(id, lane, x, y), { runTime: 0.68 }),
      ...put(`look/${id}`, null),
      ...put(`tag/${id}`, tag(label, 'temporary', x, y - TY)),
    ];
  }

  function intake() {
    const tiles = Array.from({ length: 15 }, (_, i) =>
      photo('', lanes[i % 3], CX + (i % 5 - 2) * (P ? 1.5 : 1.25), P ? 0.6 - Math.floor(i / 5) * 1.3 : 0.80 - Math.floor(i / 5) * 0.8));
    return new M.VGroup(...tiles, text('New photographs arriving', CX, P ? -3.6 : -1.5, 24, C.ink, 6, false));
  }

  function gallery() {
    return new M.VGroup(...Object.entries(known).flatMap(([lane, ids]) =>
      ids.map(id => ({ id, lane }))).sort((a, b) => a.id.localeCompare(b.id)).flatMap(({ id, lane }, i) => {
      const x = P ? CX + (i % 4 - 1.5) * 1.9 : CX + (i % 6 - 2.5) * 1.25;
      const y = P ? 0.6 - Math.floor(i / 4) * 1.6 : 0.62 - Math.floor(i / 6) * 1.3;
      return [photo(id, lane, x, y), tag('', '✓', x, y - TY)];
    }));
  }

  await until(S(0)); await play(...put('intake', intake()), ...say('HUNDREDS OF NEW ITEMS'));
  await until(S(1)); await play(...fbox(['Take a photograph', ['Worker checks each item', C.amber]]), ...say('PHOTOS COME FASTER THAN LABELS', C.amber));
  await until(S(2)); await play(...fbox(['Photograph  ✓', ['Material    ?', C.amber]]), ...say('CAN THE UNLABELLED PHOTOS HELP?'));
  await until(S(3)); await play(...clear(), ...put('gallery', gallery()), ...say('12 PHOTOS CHECKED BY A WORKER', C.green));
  await until(S(4));
  await play(...clear(), ...lanes.flatMap((lane, i) => [
    ...heading(lane, `Group ${i + 1}`),
    ...known[lane].flatMap((id, j) => put(`photo/${id}`, photo(id, lane, ...pos(lane, j)))),
  ]), ...say('THREE GROUPS BY APPEARANCE'));

  await until(S(5)); await play(...heading('matte', 'Matte'), ...rowFocus('matte'), ...say('7 MATTE ITEMS · DULL SURFACES'));
  await until(S(6)); await play(...knownTags('matte'), ...say('○  ALL 7 ARE PLASTIC', BLUE));
  await until(S(7)); await play(...heading('shiny', 'Shiny'), ...rowFocus('shiny'), ...knownTags('shiny'), ...say('■  2 OF 3 SHINY ITEMS ARE METAL', ORANGE));
  await until(S(8)); await play(...heading('mixed', 'Mixed'), ...rowFocus('mixed'), ...say('2 MIXED ITEMS · DULL AND SHINY'));
  await until(S(9)); await play(...knownTags('mixed'), ...say('○  1 PLASTIC     ■  1 METAL'));
  await until(S(10));
  await play(...put('focus', null),
    ...put('queue', text('Waiting for a label', CX, QUEUE_Y + (P ? 0.7 : 0.5), 17, C.muted)),
    ...waiting.flatMap(([id, lane], i) => [
      ...put(`photo/${id}`, photo(id, lane, queueX(i), QUEUE_Y)),
      ...put(`tag/${id}`, tag('', '?', queueX(i), QUEUE_Y - TY)),
    ]), ...say('5 NEW PHOTOGRAPHS'));
  await until(S(11)); await play(...waiting.flatMap(([id, lane], i) => put(`look/${id}`,
    text(name[lane], queueX(i), QUEUE_Y - (P ? 0.85 : 0.74), 16, C.muted, 1.2))),
    ...say('1 MATTE · 2 MIXED · 2 SHINY'));
  await until(S(12)); await play(...pendingFocus(0), ...fbox(['Look for examples', 'with the same appearance']), ...say('COMPARE SIMILAR ITEMS'));
  await until(S(13)); await play(...rowFocus('matte'), ...fbox(['Matte examples', ['7 Plastic', BLUE]]), ...say('EVERY KNOWN MATTE ITEM IS PLASTIC', BLUE));
  await until(S(14)); await play(...pendingFocus(0), ...fbox(['U1 looks matte', ['Guess: Plastic', BLUE]]), ...say('THE STUDENT GUESSES PLASTIC', BLUE));
  await until(S(15)); await play(...fbox(['U1 → Plastic', 'Use the guess as a label?']), ...say('COULD U1 BECOME AN EXAMPLE?'));
  await until(S(16)); await play(...put('tag/U1', tag('Plastic', 'temporary', queueX(0), QUEUE_Y - TY)), ...say('DASHED = WAITING FOR A HUMAN CHECK', C.amber));
  await until(S(17)); await play(...fbox(['Provisional label', 'Also called a pseudo-label']), ...say('A TEMPORARY PLASTIC LABEL', BLUE));
  await until(S(18)); await play(...put('focus', null), ...fbox(['Human-labelled photos', '+ unlabelled photos']), ...say('SEMI-SUPERVISED LEARNING'));
  await until(S(19)); await play(...put('tag/U1', tag('', '?', queueX(0), QUEUE_Y - TY)), ...fbox(['12 labelled photos', '5 waiting for a label']), ...say('ADD ONE PHOTOGRAPH PER ROUND'));
  await until(S(20)); await play(...fbox(['Compare within each group', ['Count its Metal labels', ORANGE]]), ...say('ESTIMATE THE CHANCE OF METAL'));
  await until(S(21)); await play(...rowFocus('matte'), ...score('matte', 0, 7, '0%'), ...fbox(['Matte', ['0 ÷ 7 = 0%', ORANGE]]), ...say('MATTE · 0 OF 7 ARE METAL'));
  await until(S(22)); await play(...rowFocus('shiny'), ...score('shiny', 2, 3, '≈67%'), ...fbox(['Shiny', ['2 ÷ 3 ≈ 67%', ORANGE]]), ...say('SHINY · 2 OF 3 ARE METAL'));
  await until(S(23)); await play(...rowFocus('mixed'), ...score('mixed', 1, 2, '50%'), ...fbox(['Mixed', ['1 ÷ 2 = 50%', ORANGE]]), ...say('MIXED · 1 OF 2 IS METAL'));
  await until(S(24)); await play(...pendingFocus(0), ...fbox(['U1: Metal 0%', ['Chosen: Plastic 100%', BLUE]]), ...say('CONFIDENCE IS FOR THE CHOSEN ANSWER'));
  await until(S(25)); await play(...put('focus', null), ...fbox([['Accept at 2/3 or more', C.amber], 'About 67%'], C.amber), ...say('MINIMUM CONFIDENCE: TWO-THIRDS', C.amber));
  await until(S(26)); await play(...pendingFocus(0), ...fbox(['U1: 100%  ·  U2/U3: 50%', 'U4/U5: 2/3', ['Highest: U1', C.amber]]), ...say('PICK THE HIGHEST CONFIDENCE'));
  await until(S(27)); await play(...pendingFocus(3, 4), ...fbox(['U4 and U5: both 2/3', ['U4 comes first', C.amber]]), ...say('TIE? TAKE THE FIRST IN THE LIST'));
  await until(S(28)); await play(...pendingFocus(0), ...fbox(['U1 · Matte', ['Chosen: Plastic', BLUE]]), ...say('ROUND 1 · CHOOSE U1'));
  await until(S(29)); await play(...put('tag/U1', tag('Plastic', 'temporary', queueX(0), QUEUE_Y - TY)), ...fbox(['100% ≥ 2/3', ['Temporary Plastic', BLUE]]), ...say('ROUND 1 · ACCEPT PLASTIC', BLUE));
  await until(S(30)); await play(...put('focus', null), ...accept(0, 'matte', 7, 'Plastic'), ...fbox(['Matte: 7 → 8 photos', ['8 labelled Plastic', BLUE]]), ...say('ROUND 1 · MATTE NOW HAS 8'));
  await until(S(31)); await play(...rowFocus('matte'), ...score('matte', 0, 8, '0%'), ...fbox(['Before: 0/7 = 0%', ['Now:    0/8 = 0%', ORANGE]]), ...say('ROUND 1 · METAL CHANCE STAYS AT 0%'));
  await until(S(32)); await play(...pendingFocus(3), ...fbox(['U4 · Shiny', 'First of the two tied photos']), ...say('ROUND 2 · CHOOSE U4'));
  await until(S(33)); await play(...fbox(['U4: Metal 2/3', ['2/3 meets the cutoff', C.amber]]), ...say('ROUND 2 · TWO-THIRDS IS ENOUGH', C.amber));
  await until(S(34)); await play(...put('focus', null), ...accept(3, 'shiny', 3, 'Metal'), ...fbox([['Temporary Metal', ORANGE], 'Add U4 to Shiny']), ...say('ROUND 2 · ADD U4', ORANGE));
  await until(S(35)); await play(...rowFocus('shiny'), ...fbox(['Shiny: 3 → 4 photos', ['Metal labels: 2 → 3', ORANGE]]), ...say('ROUND 2 · 3 METAL LABELS OUT OF 4'));
  await until(S(36)); await play(...score('shiny', 3, 4, '75%'), ...fbox(['Before: 2/3 ≈ 67%', ['Now:    3/4 = 75%', ORANGE]]), ...say('ROUND 2 · METAL CHANCE RISES TO 75%'));
  await until(S(37)); await play(...pendingFocus(4), ...fbox(['U5 · Shiny', ['Metal: 75%', ORANGE]]), ...say('ROUND 3 · CHOOSE U5'));
  await until(S(38)); await play(...put('focus', null), ...accept(4, 'shiny', 4, 'Metal'), ...fbox(['75% ≥ 2/3', ['Temporary Metal', ORANGE]]), ...say('ROUND 3 · ADD U5', ORANGE));
  await until(S(39)); await play(...rowFocus('shiny'), ...fbox(['Shiny: 4 → 5 photos', ['Metal labels: 3 → 4', ORANGE]]), ...say('ROUND 3 · 4 METAL LABELS OUT OF 5'));
  await until(S(40)); await play(...score('shiny', 4, 5, '80%'), ...fbox(['Before: 3/4 = 75%', ['Now:    4/5 = 80%', ORANGE]]), ...say('ROUND 3 · METAL CHANCE RISES TO 80%'));
  await until(S(41)); await play(...pendingFocus(1, 2), ...fbox(['U2 and U3 · Mixed', ['50% Plastic · 50% Metal', C.amber]]), ...say('BOTH MIXED PHOTOS ARE STILL AT 50%'));
  await until(S(42)); await play(...fbox([['50% < 2/3', C.amber], 'Leave U2 and U3 unlabelled']), ...say('STOP · NEITHER MEETS THE CUTOFF', C.amber));
  await until(S(43)); await play(...put('focus', null), ...fbox(['12 human labels', '+ 3 temporary labels', ['15 learning examples', C.green]]), ...say('12 → 15 LEARNING EXAMPLES', C.green));
  await until(S(44)); await play(...rowFocus('shiny'), ...fbox(['Prediction rule', 'Work within one appearance']), ...say('ONE RULE FOR EACH GROUP'));
  await until(S(45)); await play(...fbox(['Chance of Metal =', 'Metal labels ÷ all labels', ['Shiny: 4 ÷ 5 = 80%', ORANGE]]), ...say('DIVIDE METAL LABELS BY ALL LABELS'));
  await until(S(46)); await play(...fbox(['Shiny: 3 checked + 2 dashed', ['All 5 count', C.amber]]), ...say('INCLUDE TEMPORARY LABELS TOO', C.amber));

  await until(S(47));
  const validationY = P ? 0.9 : 0.96;
  const validation = new M.VGroup(
    text('Separate checking photographs', CX, validationY + (P ? 0.62 : 0.43), 20, C.ink, 6, false),
    ...checks.flatMap(([id, lane, label], i) => {
      const x = CX + (i - 1.5) * (P ? 1.9 : 1.3);
      return [photo(id, lane, x, validationY), tag(label, 'checked', x, validationY - TY, P)];
    }),
  );
  const floor = P ? -5.8 : -2.38, chartHeight = P ? 5.0 : 2.64;
  const lossY = loss => floor + loss / 0.10 * chartHeight;
  const chartX = i => CX - 2.06 + i * 1.63;
  const losses = [0.090, 0.090, 0.078, 0.073];
  const axes = new M.VGroup(
    ...[0, 0.05, 0.10].flatMap(value => [
      line(CX - 2.86, lossY(value), CX + 3.29, lossY(value), C.line),
      text(value.toFixed(2), CX - 3.24, lossY(value), 15, C.muted, 0.64),
    ]),
    ...['Start', 'Round 1', 'Round 2', 'Round 3'].map((s, i) => text(s, chartX(i), floor - 0.30, 15, C.muted, 1.34)),
  );
  const points = losses.map((loss, i) => {
    const x = chartX(i), y = lossY(loss);
    const segment = i ? [line(chartX(i - 1), lossY(losses[i - 1]), x, y, C.green, 3)] : [];
    return new M.VGroup(...segment, new M.Dot({ point: [x, y, 0], radius: 0.07, color: C.green }),
      text(loss.toFixed(3), x, y - 0.29, 17, C.green, 1.10));
  });
  const trainingExit = clear();
  points.forEach((point, i) => active.set(`loss/${i}`, point));
  await play(...trainingExit, ...put('validation', validation), ...put('axes', axes),
    new M.LaggedStart(points.map(point => new M.FadeIn(point)), { lagRatio: 0.65, runTime: 2.5 }),
    ...fbox(['Mean squared error', ['0.090 → 0.073', C.green]]), ...say('ERROR FELL ON THE CHECKING PHOTOS', C.green));

  await until(S(48)); await play(...clear(), ...put('intake', intake()), ...fbox(['Photos are easy to collect', 'Human labelling takes time']), ...say('LEARN FROM THE PHOTOS ON HAND'));
  await until(S(49));
  const audit = [['U1', 'matte', 'Plastic'], ['U4', 'shiny', 'Metal'], ['U5', 'shiny', 'Metal']];
  const auditX = i => CX + (i - 1) * (P ? 2.2 : 2.5);
  const auditY = P ? -0.5 : 0.6;
  const workerY = auditY - (P ? 3.6 : 1.9);
  const workerTag = (i, label) => put(`worker/${i}`, tag(label, 'checked', auditX(i), workerY, true));
  await play(...clear(),
    ...put('audit', new M.VGroup(
      text('Temporary labels', CX, auditY + (P ? 0.95 : 0.66), 21, C.amber),
      ...audit.flatMap(([id, lane, label], i) => [
        photo(id, lane, auditX(i), auditY), tag(label, 'temporary', auditX(i), auditY - (P ? 0.78 : 0.42), true),
      ]),
      text('Worker’s check', CX, workerY + (P ? 0.6 : 0.41), 21, C.green),
      ...audit.map((_, i) => rect(auditX(i), workerY, 1.78, 0.29, C.line, C.bg, 0)),
    )), ...say('ASK A WORKER TO CHECK THE 3 LABELS'));
  await until(S(50)); await play(...workerTag(0, 'Plastic'), ...workerTag(1, 'Metal'), ...say('U1 AND U4 MATCH THE WORKER', C.green));
  await until(S(51)); await play(...workerTag(2, 'Plastic'),
    ...put('focus', rect(auditX(2), (auditY + workerY) / 2, 2.0, auditY - workerY + 0.8, C.pink, C.bg, 0)),
    ...put('wrong', text('× wrong', auditX(2), auditY - (P ? 1.9 : 1.15), 18, C.pink, 1.7)),
    ...fbox([['U5: guessed Metal', ORANGE], ['Worker: Plastic', BLUE]], C.pink),
    ...say('U5 IS ACTUALLY PLASTIC', C.pink));
  await until(S(52)); await play(...fbox(['Adding U5 as Metal', ['Shiny: 3/4 → 4/5 Metal', ORANGE], '75% → 80%'], C.pink), ...say('A WRONG GUESS STRENGTHENED ITSELF', C.pink));
  await until(S(53)); await play(...fbox(['Dashed: temporary', ['Solid ✓: worker checked', C.green]]), ...say('KEEP THE TWO LABEL STYLES DISTINCT'));
  await until(S(54)); await play(...fbox([['Checking error: 0.090 → 0.073', C.green], ['U5: one wrong temporary label', C.pink]]), ...say('PREDICTIONS CAN IMPROVE AND STILL BE WRONG'));
}
