// 16.3.12 Model documentation. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.75, 0] : [4.3, -0.3, 0];
  const ROW_W = P ? FW - 1.0 : 6.8;
  const BOX_W = P ? ROW_W : 4.85;
  const ROW_TOP = P ? 1.45 : 1.12;
  const ROW_STEP = P ? 1.12 : 0.86;
  const ROW_H = P ? 0.92 : 0.66;
  const PK = P ? 1.42 : 1;            // phone: taller note card, more space between its lines
  // column x offsets (from CX) and sizes: phone uses bigger text
  const COL = P ? { icon: -3.05, name: -2.25, nameW: 1.2, south: -1.12, southW: 1.0, score: -0.02, flag: 1.08, out: 2.5, outW: 1.5 }
    : { icon: -2.83, name: -2.1, nameW: 1.05, south: -1.04, southW: 0.95, score: 0.05, flag: 1.15, out: 2.48, outW: 1.45 };
  const FS = P ? { name: 24, south: 21, score: 22, flag: 28, out: 20, note: 19 } : { name: 21, south: 18, score: 19, flag: 24, out: 18, note: 17 };
  const CUTOFF = 50;
  const parcels = [
    { name: 'Sage', score: 60, late: true },
    { name: 'Teal', score: 60, late: true },
    { name: 'Vale', score: 40, late: true },
    { name: 'Wren', score: 20, late: false }
  ];
  const lateRows = parcels.flatMap((parcel, i) => parcel.late ? [i] : []);
  const misses = lateRows.filter(i => parcels[i].score < CUTOFF);
  const rowY = i => ROW_TOP - i * ROW_STEP;
  const enter = obj => new M.FadeIn(obj, { runTime: 0.34 });
  const leave = obj => new M.FadeOut(obj, { runTime: 0.24 });

  function label(text, x, y, width, color = C.ink, size = 21, mono = false) {
    const t = T(text, size, color, mono, true);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, width, height, color, fill, strokeWidth = 2) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.13, color, strokeWidth });
    if (fill) r.setFill(fill, 0.95);
    r.moveTo([x, y, 0]);
    return r;
  }

  let pillNow = null;
  function say(text, color = C.cyan) {
    const next = pill(text, color, P ? 18 : 19);
    const maxWidth = P ? ROW_W : 7.25;
    if (next.getWidth() > maxWidth) next.scale(maxWidth / next.getWidth());
    next.moveTo(PILL);
    const anims = pillNow ? [leave(pillNow)] : [];
    pillNow = next;
    return [...anims, enter(next)];
  }

  const cards = parcels.map(({ name }, i) => {
    const y = rowY(i);
    const ps = P ? 1.35 : 1;
    const parcel = rect(CX + COL.icon, y, 0.32 * ps, 0.29 * ps, C.pink, C.card, 1.5);
    const tape = new M.Line({
      start: [CX + COL.icon, y + 0.12 * ps, 0], end: [CX + COL.icon, y + 0.02 * ps, 0],
      color: C.pink, strokeWidth: 2
    });
    return new M.VGroup(
      rect(CX, y, ROW_W, ROW_H, C.line, C.card),
      parcel, tape,
      label(name, CX + COL.name, y, COL.nameW, C.ink, FS.name),
      label('South', CX + COL.south, y, COL.southW, C.pink, FS.south)
    );
  });
  const scores = parcels.map(({ score }, i) => new M.VGroup(
    rect(CX + COL.score, rowY(i), P ? 1.08 : 0.91, P ? 0.56 : 0.43, C.cyan, C.bg, 1.5),
    label(`${score}%`, CX + COL.score, rowY(i), P ? 0.92 : 0.78, C.cyan, FS.score, true)
  ));
  const flags = parcels.map(({ score }, i) => score >= CUTOFF
    ? label('✓', CX + COL.flag, rowY(i), 0.62, C.amber, FS.flag)
    : null);
  const outcomes = parcels.map(({ late }, i) => label(
    late ? 'LATE' : 'ON TIME', CX + COL.out, rowY(i), COL.outW, late ? C.pink : C.green, FS.out, true
  ));
  const noFlag = label('No flag', CX + COL.flag, rowY(2), P ? 1.0 : 1.06, C.muted, FS.note);

  let focusNow = null;
  function focus(first, last = first, color = C.amber) {
    const anims = focusNow ? [leave(focusNow)] : [];
    focusNow = first == null ? null : rect(
      CX, (rowY(first) + rowY(last)) / 2, ROW_W + 0.16,
      ROW_H + 0.11 + (last - first) * ROW_STEP, color, null
    );
    if (focusNow) anims.push(new M.Create(focusNow, { runTime: 0.32 }));
    return anims;
  }

  // The score explanation, dispatch note, and finished card use the same box.
  const [bx, by] = BOXP;
  const panel = rect(bx, by, BOX_W, 2.9 * PK, C.cyan, C.card);
  const slots = Array(6).fill(null);
  let panelVisible = false;
  const lineY = i => by + 1.02 * PK - i * 0.405 * PK;

  function writeLines(edits) {
    const anims = [];
    if (!panelVisible) {
      anims.push(enter(panel));
      panelVisible = true;
    }
    for (const [i, text, color = C.ink] of edits) {
      if (slots[i]) anims.push(leave(slots[i]));
      slots[i] = text ? label(text, bx, lineY(i), BOX_W - 0.4, color, i === 0 ? (P ? 25 : 23) : (P ? 21 : 20)) : null;
      if (slots[i]) anims.push(enter(slots[i]));
    }
    return anims;
  }

  const emphasis = (obj, color = C.amber) => new M.Indicate(obj, { color, runTime: 0.5 });
  const markTime = (x, color) => new M.Dot({ point: [x, by - 0.05, 0], radius: 0.085, color });
  const promiseX = bx - 0.99;
  const arrivalX = bx + 0.99;
  const arrivalLine = new M.VGroup(
    new M.Line({
      start: [bx - 1.68, by - 0.05, 0], end: [bx + 1.68, by - 0.05, 0],
      color: C.muted, strokeWidth: 2
    }),
    markTime(promiseX, C.cyan),
    markTime(arrivalX, C.pink),
    label('Promised time', promiseX, by - 0.44, 1.86, C.cyan, 18),
    label('Arrival', arrivalX, by - 0.44, 1.86, C.pink, 18)
  );
  const delivered = parcels.map((_, i) =>
    rect(bx + (i - 1.5) * 0.58, by - 0.1, 0.39, 0.36, C.pink, C.bg));
  const result = `${misses.length} miss out of ${lateRows.length} late South parcels`;

  // phone only: a 0-100% score line under the parcels (fills the space before the note card appears)
  const SL = { y: -4.6, x0: -3.0, x1: 3.0 };
  const sx = v => SL.x0 + (SL.x1 - SL.x0) * v / 100;
  const scale = P ? [
    new M.Line({ start: [SL.x0, SL.y, 0], end: [SL.x1, SL.y, 0], color: C.muted, strokeWidth: 3 }),
    ...[0, 50, 100].map(v => new M.Line({ start: [sx(v), SL.y - 0.14, 0], end: [sx(v), SL.y + 0.14, 0], color: C.muted, strokeWidth: 3 })),
    ...[0, 50, 100].map(v => label(`${v}%`, sx(v), SL.y - 0.5, 1.2, C.muted, 19, true)),
    label('Score', 0, SL.y + 1.75, 3, C.cyan, 22)
  ] : [];
  // dots: Sage and Teal share 60%, so stack them
  const stackY = [0, 1, 0, 0];
  const sdots = P ? parcels.map(({ score, name }, i) => new M.VGroup(
    new M.Dot({ point: [sx(score), SL.y + 0.42 + stackY[i] * 0.55, 0], radius: 0.13, color: C.cyan }),
    label(name, sx(score) + (i === 2 || i === 3 ? 0 : 0.75), SL.y + 0.42 + stackY[i] * 0.55 + (i >= 2 ? 0.42 : 0), 1.2, C.ink, 18)
  )) : [];

  await until(S(0));
  await play(new M.LaggedStart(cards.map(enter), { lagRatio: 0.16, runTime: 0.85 }),
    ...scale.map(enter), ...say('4 SOUTH PARCELS', C.pink));

  await until(S(1)); await play(enter(scores[0]), enter(scores[1]), ...sdots.slice(0, 2).map(enter));
  await until(S(2)); await play(enter(scores[2]), ...sdots.slice(2, 3).map(enter));
  await until(S(3)); await play(enter(scores[3]), ...sdots.slice(3, 4).map(enter));
  await until(S(4)); await play(...say('WHICH PARCELS NEED A CHECK?', C.amber));

  await until(S(5));
  await play(...[...scale, ...sdots].map(leave), ...say('WHAT DOES A SCORE MEAN?'),
    ...writeLines([[0, 'Score', C.cyan], [2, 'Guessed chance of arriving late']]));

  await until(S(6));
  await play(...say('AFTER THE PROMISED TIME', C.pink),
    ...writeLines([[0, 'Late delivery', C.pink], [2, '']]), enter(arrivalLine));

  await until(S(7));
  await play(leave(arrivalLine), ...say('THE DEPOT’S RULE', C.amber),
    ...writeLines([[0, 'Ask a person to check', C.amber], [2, `${CUTOFF}% or higher`, C.amber]]));

  await until(S(8)); await play(...focus(0, 1), ...say('SAGE AND TEAL MEET THE RULE', C.amber));
  await until(S(9)); await play(enter(flags[0]), enter(flags[1]));

  await until(S(10));
  await play(...say('A CHECK MARK IS A FLAG', C.amber),
    ...writeLines([[0, '✓ Flag', C.amber], [2, 'Ask a person to look more closely']]));

  await until(S(11));
  await play(...focus(null), ...say('EVERY PARCEL IS DELIVERED', C.green),
    ...writeLines([[0, 'All four go out', C.green], [2, '']]),
    new M.LaggedStart(delivered.map(enter), { lagRatio: 0.16, runTime: 0.7 }));

  await until(S(12));
  await play(...delivered.map(leave), ...say('THE SAVED TOOL'),
    ...writeLines([[0, 'Birch', C.cyan], [2, 'Gives the parcel scores']]));

  await until(S(13));
  await play(...say('A TOOL THAT MAKES PREDICTIONS'),
    ...writeLines([[0, 'Birch is a model', C.cyan], [2, 'Uses information'], [3, 'to predict late delivery']]));

  await until(S(14));
  await play(...say('LEAVE A NOTE'),
    ...writeLines([[0, 'Note for the next dispatcher', C.cyan], [2, ''], [3, '']]));

  await until(S(15));
  await play(...say('WRITE THE DECISION', C.amber),
    ...writeLines([[1, 'Decision', C.amber]]));

  await until(S(16));
  await play(...focus(0, 1), ...writeLines([[2, 'Which parcels should a person check?']]));

  await until(S(17));
  await play(...say('DISPATCH = WHEN PARCELS GO OUT'),
    ...writeLines([[2, `At dispatch, check scores of ${CUTOFF}% or higher`]]));

  await until(S(18));
  await play(...focus(null), ...say('WRITE WHAT THE TEST FOUND'),
    ...writeLines([[3, 'Test result', C.cyan]]));

  await until(S(19));
  await play(...focus(0, 3, C.pink), ...say('MONDAY’S 4 SOUTH PARCELS', C.pink));

  await until(S(20));
  await play(...focus(null), ...say('WEDNESDAY MORNING', C.green),
    ...writeLines([[4, 'All Monday arrivals confirmed', C.green]]));

  await until(S(21));
  await play(...writeLines([[4, '']]),
    new M.LaggedStart(lateRows.map(i => enter(outcomes[i])), { lagRatio: 0.22, runTime: 0.75 }));

  await until(S(22)); await play(enter(outcomes[3]), ...say('WREN ARRIVED ON TIME', C.green));
  await until(S(23)); await play(...focus(0, 2, C.pink), ...say('COUNT THE LATE PARCELS', C.pink));
  await until(S(24)); await play(...say(`${lateRows.length} LATE PARCELS`, C.pink));

  await until(S(25));
  await play(...say('COMPARE LATE SCORES WITH THE RULE', C.amber),
    ...writeLines([[4, `Flag at ${CUTOFF}% or higher`, C.amber]]));

  await until(S(26));
  await play(...focus(0), ...say('SAGE · 60% · FLAGGED', C.amber), emphasis(flags[0]));

  await until(S(27));
  await play(...focus(1), ...say('TEAL · 60% · FLAGGED', C.amber), emphasis(flags[1]));

  await until(S(28));
  await play(...focus(2, 2, C.pink), ...say('VALE · 40% · BELOW 50%', C.pink), enter(noFlag));

  await until(S(29));
  await play(...say('LATE WITH NO FLAG = A MISS', C.pink),
    ...writeLines([[4, `${misses.length} miss · Vale`, C.pink]]));

  await until(S(30));
  await play(...focus(3, 3, C.green), ...say('ON TIME · OUTSIDE THE LATE COUNT', C.green));

  await until(S(31));
  await play(...focus(null), ...say('RECORD THE RESULT', C.pink),
    ...writeLines([[4, result, C.pink]]));

  await until(S(32));
  await play(...say('RECORD THE DISPATCH DATE AND GROUP'),
    ...writeLines([[5, `Monday dispatch · ${parcels.length} South parcels`]]));

  await until(S(33));
  await play(...say('THE MODEL CARD'),
    ...writeLines([[0, 'Birch · Model card', C.cyan]]));

  await until(S(34));
  await play(...focus(2, 2, C.pink), ...say('FIND THE DECISION AND THE MISS'),
    emphasis(slots[2]), emphasis(slots[4], C.pink));

  await until(S(35));
  await play(...focus(null), ...say('KEEP THE SMALL GROUP’S COUNTS', C.amber),
    emphasis(slots[4]), emphasis(slots[5]));

  const monday = [...cards, ...scores, ...flags.filter(Boolean), ...outcomes, noFlag];
  const more = [0, 1].map(i => {
    const y = rowY(i + 1);
    return new M.VGroup(
      rect(CX, y, ROW_W, ROW_H, C.pink, C.card, 1.5),
      label('Another South parcel', CX, y, ROW_W - 0.55, C.pink)
    );
  });
  more.push(label('…', CX, rowY(3), 1, C.muted, 28));

  await until(S(36));
  await play(...monday.map(leave), ...more.map(enter), ...say('CHECK MORE SOUTH PARCELS', C.pink));

  await until(S(37));
  await play(...more.map(leave), ...monday.map(enter), ...say('RECORD THE DECISION AND TEST RESULT'),
    emphasis(slots[1]), emphasis(slots[3]));
}
