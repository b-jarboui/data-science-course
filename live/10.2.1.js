// 10.2.1 Partial slopes (live lesson for site/live/engine.js).
// Beat i = sentence i (0-based, 40 sentences). Shared data from chapters/10.2.md: cards A, E, D, H.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // readable text everywhere: phone >= 15 (key numbers 18), laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, Math.max(size, P ? 15 : 14), ...r);

  // --- layout constants (laptop: y in [-3.0, 2.3]; phone: y in [-5.5, 4.3]) ---
  const PILL = P ? [0, 1.92, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.50, -0.45, 0];
  const SIDE = P ? [0, -4.35, 0] : [4.50, -0.45, 0];
  const SW = P ? 7.20 : 4.20;
  const CW = P ? 3.12 : 3.30, CH = P ? 1.78 : 1.62;
  const COL_L = P ? -2.14 : -4.55, COL_R = P ? 2.14 : 0.05;
  const GAP_X = (COL_L + COL_R) / 2;
  const HDR_Y = P ? 1.30 : 1.28;
  const ROW_T = P ? 0.06 : 0.12, ROW_B = P ? -2.26 : -1.98;
  const MID_Y = (ROW_T + ROW_B) / 2;

  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);

  // one formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // small rounded chip for +$100, +$160, +$60, FIXED
  function mkBadge(text, color, pos, size = P ? 15 : 17) {
    const t = T(text, size, color, true, true);
    const wd = t.getWidth() + 0.28, ht = t.getHeight() + 0.14;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: ht / 2, color, strokeWidth: 2 });
    r.setFill(C.bg, 0.96); r.moveTo(pos); t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  // chevron arrow built from Lines (clean Create + FadeIn, no external assumptions)
  function mkArrow(a, b, color, sw = 3.2, dashed = false, headLen = 0.15) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const p1 = [b[0] - ux * headLen + px * headLen * 0.58, b[1] - uy * headLen + py * headLen * 0.58, 0];
    const p2 = [b[0] - ux * headLen - px * headLen * 0.58, b[1] - uy * headLen - py * headLen * 0.58, 0];
    const shaft = dashed
      ? new M.DashedLine({ start: a, end: b, color, strokeWidth: sw })
      : new M.Line({ start: a, end: b, color, strokeWidth: sw });
    const head = new M.VGroup(
      new M.Line({ start: p1, end: b, color, strokeWidth: sw }),
      new M.Line({ start: p2, end: b, color, strokeWidth: sw })
    );
    return { shaft, head };
  }

  // redundant neighborhood cue: glowing cyan circle (Cedar) or glowing amber square (Station)
  function mkCue(kind, pos, s = 1, hollow = false) {
    const col = kind === 'cedar' ? C.cyan : C.amber;
    if (kind === 'cedar') {
      const halo = new M.Circle({ radius: 0.15 * s, color: col, strokeWidth: 1 });
      halo.setFill(col, 0.20); halo.setStrokeOpacity(0); halo.moveTo(pos);
      const core = new M.Circle({ radius: 0.08 * s, color: col, strokeWidth: hollow ? 2.4 : 1.5 });
      core.setFill(col, hollow ? 0.18 : 1); core.moveTo(pos);
      return new M.VGroup(halo, core);
    }
    const halo = new M.Rectangle({ width: 0.27 * s, height: 0.27 * s, color: col, strokeWidth: 1 });
    halo.setFill(col, 0.20); halo.setStrokeOpacity(0); halo.moveTo(pos);
    const core = new M.Rectangle({ width: 0.14 * s, height: 0.14 * s, color: col, strokeWidth: hollow ? 2.4 : 1.5 });
    core.setFill(col, hollow ? 0.18 : 1); core.moveTo(pos);
    return new M.VGroup(halo, core);
  }

  // --- 0-1: intro (Cedar or Station, +10 m² question) -------------------------
  function mkIntroCard(title, kind, pos) {
    const col = kind === 'cedar' ? C.cyan : C.amber;
    const w = P ? 3.2 : 3.6, h = P ? 1.8 : 1.7;
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: col, strokeWidth: 2.4 });
    bg.setFill(C.card, 0.95); bg.moveTo(pos);
    const bld = new M.Rectangle({ width: 0.62, height: 0.88, color: col, strokeWidth: 2 });
    bld.setFill(col, 0.14); bld.moveTo([pos[0] - w * 0.26, pos[1] - 0.04, 0]);
    const wins = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const wn = new M.Rectangle({ width: 0.14, height: 0.16, color: col, strokeWidth: 1 });
      wn.setFill(col, 0.78);
      wn.moveTo([pos[0] - w * 0.26 + (c - 0.5) * 0.24, pos[1] + 0.12 - r * 0.28, 0]);
      wins.push(wn);
    }
    const cue = mkCue(kind, [pos[0] + 0.14, pos[1] + 0.22, 0], 1.15);
    const lbl = T(title, P ? 22 : 24, col, false, true);
    lbl.moveTo([pos[0] + 0.36 + lbl.getWidth() / 2, pos[1] + 0.22, 0]);
    const sub = T('apartment', P ? 15 : 16, C.muted);
    sub.moveTo([pos[0] + 0.58, pos[1] - 0.26, 0]);
    return new M.VGroup(bg, bld, ...wins, cue, lbl, sub);
  }

  const introY = P ? -0.15 : 0.35;
  const introCedar = mkIntroCard('Cedar', 'cedar', [P ? -1.85 : -2.35, introY, 0]);
  const introStation = mkIntroCard('Station', 'station', [P ? 1.85 : 2.35, introY, 0]);
  await until(S(0));
  await play(new M.LaggedStart([new M.FadeIn(introCedar), new M.FadeIn(introStation)], { lagRatio: 0.25, runTime: 1.1 }),
    ...say('CEDAR OR STATION?'));

  const sy = P ? -2.55 : -1.65;
  const fp40 = new M.Rectangle({ width: 1.55, height: 0.92, color: C.cyan, strokeWidth: 2.2 });
  fp40.setFill(C.cyan, 0.14); fp40.moveTo([P ? -2.05 : -2.35, sy, 0]);
  const fp40T = T('40 m²', P ? 18 : 20, C.ink, true, true); fp40T.moveTo([P ? -2.05 : -2.35, sy, 0]);
  const fpArr = mkArrow([P ? -1.12 : -1.35, sy, 0], [P ? -0.45 : -0.45, sy, 0], C.amber, 3.2);
  const fpBase = new M.Rectangle({ width: 1.55, height: 0.92, color: C.cyan, strokeWidth: 2.2 });
  fpBase.setFill(C.cyan, 0.14); fpBase.moveTo([P ? 0.55 : 0.65, sy, 0]);
  const fpExt = new M.Rectangle({ width: 0.58, height: 0.92, color: C.amber, strokeWidth: 2.2 });
  fpExt.setFill(C.amber, 0.30); fpExt.moveTo([P ? 1.615 : 1.715, sy, 0]);
  const fp50T = T('40', P ? 17 : 18, C.ink, true, true); fp50T.moveTo([P ? 0.55 : 0.65, sy, 0]);
  const fp10T = T('+10', P ? 15 : 16, C.amber, true, true); fp10T.moveTo([P ? 1.615 : 1.715, sy, 0]);
  const fpQ = T('+$? / mo', P ? 18 : 20, C.amber, true, true); fpQ.moveTo([P ? 2.75 : 2.95, sy, 0]);
  const introSize = new M.VGroup(fp40, fp40T, fpArr.shaft, fpArr.head, fpBase, fpExt, fp50T, fp10T, fpQ);
  await until(S(1));
  await play(new M.FadeIn(introSize), ...say('+10 m² → HOW MUCH MORE RENT?', C.amber));

  // --- 2-10: four listing cards in two rows -----------------------------------
  const specs = [
    { id: 'A', nbhd: 'Cedar', kind: 'cedar', col: C.cyan, area: '40 m²', ask: '$980', pred: '$970', cx: COL_L, cy: ROW_T },
    { id: 'E', nbhd: 'Cedar', kind: 'cedar', col: C.cyan, area: '50 m²', ask: '$1,060', pred: '$1,070', cx: COL_R, cy: ROW_T },
    { id: 'D', nbhd: 'Station', kind: 'station', col: C.amber, area: '40 m²', ask: '$1,020', pred: '$1,030', cx: COL_L, cy: ROW_B },
    { id: 'H', nbhd: 'Station', kind: 'station', col: C.amber, area: '50 m²', ask: '$1,140', pred: '$1,130', cx: COL_R, cy: ROW_B },
  ];

  const cards = specs.map(sp => {
    const { cx, cy, col } = sp;
    const frame = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.16, color: C.muted, strokeWidth: 2.2 });
    frame.setFill(C.card, 0.95); frame.moveTo([cx, cy, 0]);
    const idTag = T(sp.id, P ? 13 : 14, C.muted, true, true);
    idTag.moveTo([cx + CW / 2 - 0.24, cy + CH * 0.30, 0]);
    const hDiv = new M.Line({ start: [cx - CW / 2 + 0.16, cy - CH * 0.09, 0], end: [cx + CW / 2 - 0.16, cy - CH * 0.09, 0], color: C.line, strokeWidth: 1.5 });
    const cue = mkCue(sp.kind, [cx - CW / 2 + 0.28, cy + CH * 0.30, 0], 0.92);
    const nbhdText = T(sp.nbhd, P ? 16 : 17, col, false, true);
    nbhdText.moveTo([cx - CW / 2 + 0.48 + nbhdText.getWidth() / 2, cy + CH * 0.30, 0]);
    const areaText = T(sp.area, P ? 14 : 15, C.ink, true);
    areaText.moveTo([cx + CW * 0.18, cy + CH * 0.30, 0]);
    const ageText = T('10 yr old', P ? 13 : 14, C.muted);
    ageText.moveTo([cx - CW * 0.23, cy + CH * 0.05, 0]);
    const walkText = T('8 min walk', P ? 13 : 14, C.muted);
    walkText.moveTo([cx + CW * 0.21, cy + CH * 0.05, 0]);
    const askLab = T('ask', P ? 12 : 12, C.muted, true);
    askLab.moveTo([cx - CW * 0.25, cy - CH * 0.19, 0]);
    const askVal = T(sp.ask, 18, C.ink, true, true);
    askVal.moveTo([cx - CW * 0.25, cy - CH * 0.36, 0]);
    const vDiv = new M.Line({ start: [cx, cy - CH * 0.12, 0], end: [cx, cy - CH * 0.45, 0], color: C.line, strokeWidth: 1.5 });
    const predLab = T('pred', P ? 12 : 12, col, true);
    predLab.moveTo([cx + CW * 0.25, cy - CH * 0.19, 0]);
    const predSlot = T('----', P ? 16 : 17, C.muted, true);
    predSlot.moveTo([cx + CW * 0.25, cy - CH * 0.36, 0]);
    const predVal = T(sp.pred, 18, col, true, true);
    predVal.moveTo([cx + CW * 0.25, cy - CH * 0.36, 0]);
    return { ...sp, frame, idTag, hDiv, cue, nbhdText, areaText, ageText, walkText, askLab, askVal, vDiv, predLab, predSlot, predVal };
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(introCedar, introStation, introSize)),
    new M.LaggedStart(cards.map(c => new M.FadeIn(new M.VGroup(c.frame, c.idTag, c.hDiv))), { lagRatio: 0.15, runTime: 1.1 }),
    ...say('4 LISTING CARDS IN 2 ROWS')
  );

  // beat 3: Cedar top row (cyan), Station bottom row (amber)
  await until(S(3));
  const frameAnims = cards.map(c => {
    const tgt = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.16, color: c.col, strokeWidth: 2.3 });
    // outline only (a Transform here filled the card solid and hid its text)
    tgt.setFill(C.card, 0); tgt.moveTo([c.cx, c.cy, 0]);
    return new M.FadeIn(tgt, { runTime: 0.8 });
  });
  await play(
    ...frameAnims,
    ...cards.map(c => new M.FadeIn(c.cue)),
    ...cards.map(c => new M.FadeIn(c.nbhdText)),
    ...say('TOP: CEDAR  ·  BOTTOM: STATION')
  );

  // beat 4: 40 m² left, 50 m² right
  const hdr40 = T('40 m²', P ? 18 : 20, C.ink, true, true); hdr40.moveTo([COL_L, HDR_Y, 0]);
  const hdr50 = T('50 m²', P ? 18 : 20, C.ink, true, true); hdr50.moveTo([COL_R, HDR_Y, 0]);
  await until(S(4));
  await play(
    new M.FadeIn(hdr40), new M.FadeIn(hdr50),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.areaText)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('40 m² ON LEFT  ·  50 m² ON RIGHT')
  );

  // beat 5: all four buildings are 10 years old
  await until(S(5));
  await play(
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.ageText)), { lagRatio: 0.1, runTime: 0.8 }),
    ...say('ALL 4 BUILDINGS: 10 YEARS OLD', C.green)
  );

  // beat 6: each apartment is an 8-minute walk
  await until(S(6));
  await play(
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.walkText)), { lagRatio: 0.1, runTime: 0.8 }),
    ...say('ALL 4: 8-MINUTE WALK TO TRANSIT', C.green)
  );

  // beats 7-10: asking rents one by one
  const askPills = [
    ['SMALL CEDAR ASKS $980', C.cyan],
    ['LARGE CEDAR ASKS $1,060', C.cyan],
    ['SMALL STATION ASKS $1,020', C.amber],
    ['LARGE STATION ASKS $1,140', C.amber],
  ];
  for (let k = 0; k < 4; k++) {
    await until(S(7 + k));
    await play(
      new M.FadeIn(cards[k].askLab),
      new M.FadeIn(cards[k].askVal),
      new M.Flash(cards[k].cue, { color: cards[k].col, flashRadius: 0.16, lineLength: 0.14 }),
      ...say(askPills[k][0], askPills[k][1])
    );
  }

  // --- 11-15: overall pattern, model, predictors ------------------------------
  await until(S(11));
  await play(
    new M.LaggedStart(cards.map(c => new M.Indicate(c.askVal, { color: C.violet })), { lagRatio: 0.12, runTime: 1.2 }),
    ...say('FIND THE OVERALL PATTERN', C.violet)
  );

  // Side Panel A: compact Model diagram
  const modH = P ? 1.75 : 3.25;
  const modBg = new M.RoundedRectangle({ width: SW, height: modH, cornerRadius: 0.16, color: C.line, strokeWidth: 1.6 });
  modBg.setFill(C.card, 0.88); modBg.moveTo(SIDE);
  const inPos = P ? [SIDE[0] - 2.35, SIDE[1] + 0.08, 0] : [SIDE[0], SIDE[1] + 1.00, 0];
  const midPos = P ? [SIDE[0], SIDE[1] + 0.08, 0] : [SIDE[0], SIDE[1] - 0.02, 0];
  const outPos = P ? [SIDE[0] + 2.35, SIDE[1] + 0.08, 0] : [SIDE[0], SIDE[1] - 1.02, 0];
  const inW = P ? 2.05 : 3.40, inH = P ? 0.92 : 0.72;
  const midW = P ? 1.45 : 3.40, midH = P ? 0.76 : 0.62;
  const outW = P ? 2.05 : 3.40, outH = P ? 0.92 : 0.62;

  const modInBox = new M.RoundedRectangle({ width: inW, height: inH, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
  modInBox.setFill(C.bg, 0.92); modInBox.moveTo(inPos);
  const modInTxt = T('details', P ? 15 : 17, C.ink, true); modInTxt.moveTo(inPos);

  const modMidBox = new M.RoundedRectangle({ width: midW, height: midH, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.2 });
  modMidBox.setFill(C.bg, 0.94); modMidBox.moveTo(midPos);
  const modMidTxt = T('MODEL', P ? 16 : 18, C.cyan, true, true); modMidTxt.moveTo(midPos);

  const modOutBox = new M.RoundedRectangle({ width: outW, height: outH, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
  modOutBox.setFill(C.bg, 0.92); modOutBox.moveTo(outPos);
  const modOutTxt = T(P ? 'predicted\nrent' : 'predicted rent', P ? 14 : 17, C.green, true); modOutTxt.moveTo(outPos);

  const modArr1 = P
    ? mkArrow([inPos[0] + inW / 2 + 0.08, inPos[1], 0], [midPos[0] - midW / 2 - 0.08, midPos[1], 0], C.muted, 2.5, false, 0.12)
    : mkArrow([inPos[0], inPos[1] - inH / 2 - 0.06, 0], [midPos[0], midPos[1] + midH / 2 + 0.06, 0], C.muted, 2.5, false, 0.12);
  const modArr2 = P
    ? mkArrow([midPos[0] + midW / 2 + 0.08, midPos[1], 0], [outPos[0] - outW / 2 - 0.08, outPos[1], 0], C.muted, 2.5, false, 0.12)
    : mkArrow([midPos[0], midPos[1] - midH / 2 - 0.06, 0], [outPos[0], outPos[1] + outH / 2 + 0.06, 0], C.muted, 2.5, false, 0.12);

  await until(S(12));
  await play(
    new M.FadeIn(modBg), new M.FadeIn(modInBox), new M.FadeIn(modInTxt),
    new M.FadeIn(modArr1.shaft), new M.FadeIn(modArr1.head),
    new M.FadeIn(modMidBox), new M.FadeIn(modMidTxt),
    new M.FadeIn(modArr2.shaft), new M.FadeIn(modArr2.head),
    new M.FadeIn(modOutBox), new M.FadeIn(modOutTxt),
    ...say('MODEL = RULE THAT PREDICTS RENT', C.cyan)
  );

  // beat 13: details -> predictors
  const modInViolet = new M.RoundedRectangle({ width: inW, height: inH, cornerRadius: 0.12, color: C.violet, strokeWidth: 2.4 });
  modInViolet.setFill(C.bg, 0); modInViolet.moveTo(inPos);
  const modPredTxt = T('predictors', P ? 15 : 17, C.violet, true, true);
  modPredTxt.moveTo([inPos[0], inPos[1] + (P ? 0.18 : 0.14), 0]);
  await until(S(13));
  await play(
    new M.FadeIn(modInViolet, { runTime: 0.7 }),
    new M.FadeOut(modInTxt), new M.FadeIn(modPredTxt),
    ...say('PREDICTORS = INPUT DETAILS', C.violet)
  );

  // beat 14: area and neighborhood
  const modPredSub = T(P ? 'area, nbhd' : 'area · neighborhood', P ? 13 : 14, C.ink, true);
  modPredSub.moveTo([inPos[0], inPos[1] - (P ? 0.18 : 0.16), 0]);
  await until(S(14));
  await play(
    new M.FadeIn(modPredSub),
    new M.Indicate(hdr40, { color: C.violet }), new M.Indicate(hdr50, { color: C.violet }),
    ...cards.map(c => new M.Indicate(c.nbhdText, { color: c.col })),
    ...say('PREDICTORS: AREA & NEIGHBORHOOD', C.violet)
  );

  // beat 15: age and walking time match
  const modFixedNote = T('age (10 yr) & walk (8 min) match', P ? 13 : 13, C.muted, true);
  modFixedNote.moveTo([SIDE[0], P ? SIDE[1] - 0.60 : SIDE[1] - 1.45, 0]);
  await until(S(15));
  await play(
    new M.FadeIn(modFixedNote),
    ...cards.map(c => new M.Indicate(c.ageText, { color: C.green })),
    ...cards.map(c => new M.Indicate(c.walkText, { color: C.green })),
    ...say('AGE & WALKING TIME MATCH', C.muted)
  );

  // --- 16-26: fitted rule (parallel lines mini-plot) & predicted rents --------
  const plotH = P ? 1.85 : 3.45;
  const plotBg = new M.RoundedRectangle({ width: SW, height: plotH, cornerRadius: 0.16, color: C.line, strokeWidth: 1.6 });
  plotBg.setFill(C.card, 0.90); plotBg.moveTo(SIDE);

  const px0 = P ? SIDE[0] - 2.35 : SIDE[0] - 1.25;
  const px1 = P ? SIDE[0] + 2.75 : SIDE[0] + 1.65;
  const py0 = P ? SIDE[1] - 0.56 : SIDE[1] - 1.28;
  const py1 = P ? SIDE[1] + 0.62 : SIDE[1] + 1.20;
  const axX = a => px0 + (a === 40 ? 0.22 : 0.78) * (px1 - px0);
  const axY = v => py0 + (v - 940) / 220 * (py1 - py0);

  const axisX = new M.Line({ start: [px0, py0, 0], end: [px1, py0, 0], color: C.muted, strokeWidth: 1.8 });
  const axisY = new M.Line({ start: [px0, py0, 0], end: [px0, py1, 0], color: C.muted, strokeWidth: 1.8 });
  const tx40 = T('40 m²', 13, C.muted, true); tx40.moveTo([axX(40), py0 - 0.22, 0]);
  const tx50 = T('50 m²', 13, C.muted, true); tx50.moveTo([axX(50), py0 - 0.22, 0]);
  const ty10 = T('$980', 12, C.muted, true); ty10.moveTo([px0 - 0.36, axY(980), 0]);
  const ty11 = T('$1140', 12, C.muted, true); ty11.moveTo([px0 - 0.38, axY(1140), 0]);
  const plotTitle = T('rent vs area', 14, C.muted, true);
  plotTitle.moveTo([SIDE[0], P ? SIDE[1] + 0.72 : SIDE[1] + 1.45, 0]);

  const plotAskPts = [
    mkCue('cedar', [axX(40), axY(980), 0], 0.85, true),
    mkCue('cedar', [axX(50), axY(1060), 0], 0.85, true),
    mkCue('station', [axX(40), axY(1020), 0], 0.85, true),
    mkCue('station', [axX(50), axY(1140), 0], 0.85, true),
  ];
  const plotCedarLine = new M.Line({ start: [axX(40), axY(970), 0], end: [axX(50), axY(1070), 0], color: C.cyan, strokeWidth: 3.2 });
  const plotStationLine = new M.Line({ start: [axX(40), axY(1030), 0], end: [axX(50), axY(1130), 0], color: C.amber, strokeWidth: 3.2 });
  const plotPredDots = [
    new M.Dot({ point: [axX(40), axY(970), 0], radius: 0.08, color: C.cyan }),
    new M.Dot({ point: [axX(50), axY(1070), 0], radius: 0.08, color: C.cyan }),
    new M.Dot({ point: [axX(40), axY(1030), 0], radius: 0.08, color: C.amber }),
    new M.Dot({ point: [axX(50), axY(1130), 0], radius: 0.08, color: C.amber }),
  ];

  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(modBg, modInBox, modInViolet, modPredTxt, modPredSub, modArr1.shaft, modArr1.head,
      modMidBox, modMidTxt, modArr2.shaft, modArr2.head, modOutBox, modOutTxt, modFixedNote)),
    new M.FadeIn(plotBg), new M.FadeIn(axisX), new M.FadeIn(axisY),
    new M.FadeIn(tx40), new M.FadeIn(tx50), new M.FadeIn(ty10), new M.FadeIn(ty11), new M.FadeIn(plotTitle),
    ...plotAskPts.map(d => new M.FadeIn(d)),
    new M.Create(plotCedarLine, { runTime: 0.9 }), new M.Create(plotStationLine, { runTime: 0.9 }),
    ...say('SAME RISE IN EACH NEIGHBORHOOD', C.cyan)
  );

  // beat 17: fitted rule
  const plotFittedTag = mkBadge('fitted rule', C.green, [P ? SIDE[0] + 2.45 : SIDE[0] + 0.95, P ? SIDE[1] + 0.68 : SIDE[1] + 1.02, 0], 13);
  await until(S(17));
  await play(
    new M.FadeIn(plotFittedTag),
    new M.Indicate(plotCedarLine, { color: C.cyan }),
    new M.Indicate(plotStationLine, { color: C.amber }),
    ...say('FITTED RULE = MATCHES KNOWN LISTINGS', C.green)
  );

  // beat 18: put predicted rents beside asking rents
  await until(S(18));
  await play(
    ...cards.map(c => new M.FadeIn(c.vDiv)),
    ...cards.map(c => new M.FadeIn(c.predLab)),
    ...cards.map(c => new M.FadeIn(c.predSlot)),
    ...say('PREDICTED RENTS BESIDE ASKING', C.cyan)
  );

  // beat 19: Cedar 40 -> $970
  await until(S(19));
  await play(
    new M.FadeOut(cards[0].predSlot), new M.FadeIn(cards[0].predVal),
    new M.FadeIn(plotPredDots[0]),
    new M.Flash(plotPredDots[0], { color: C.cyan, flashRadius: 0.14, lineLength: 0.14 }),
    ...say('CEDAR 40 m²: PREDICTED $970', C.cyan)
  );

  // beat 20: Cedar 50 -> $1,070
  await until(S(20));
  await play(
    new M.FadeOut(cards[1].predSlot), new M.FadeIn(cards[1].predVal),
    new M.FadeIn(plotPredDots[1]),
    new M.Flash(plotPredDots[1], { color: C.cyan, flashRadius: 0.14, lineLength: 0.14 }),
    ...say('CEDAR 50 m²: PREDICTED $1,070', C.cyan)
  );

  // beat 21: arrow between Cedar predictions (+$100)
  const arrCedar = mkArrow([COL_L + CW / 2 + 0.12, ROW_T, 0], [COL_R - CW / 2 - 0.12, ROW_T, 0], C.cyan, 3.6);
  const badgeCedar = mkBadge('+$100', C.cyan, [GAP_X, ROW_T + 0.34, 0], P ? 16 : 18);
  await until(S(21));
  await play(
    new M.Create(arrCedar.shaft, { runTime: 0.8 }), new M.FadeIn(arrCedar.head),
    new M.FadeIn(badgeCedar),
    new M.Indicate(plotCedarLine, { color: C.cyan }),
    ...say('CEDAR RISE: $970 → $1,070 (+$100)', C.cyan)
  );

  // beat 22: now read the Station row
  const rowHL = new M.RoundedRectangle({ width: COL_R - COL_L + CW + 0.32, height: CH + 0.28, cornerRadius: 0.22, color: C.amber, strokeWidth: 2.5 });
  rowHL.setFill(C.amber, 0.06); rowHL.moveTo([GAP_X, ROW_B, 0]);
  await until(S(22));
  await play(new M.Create(rowHL, { runTime: 0.7 }), ...say('NOW READ THE STATION ROW', C.amber));

  // beat 23: Station 40 -> $1,030
  await until(S(23));
  await play(
    new M.FadeOut(rowHL),
    new M.FadeOut(cards[2].predSlot), new M.FadeIn(cards[2].predVal),
    new M.FadeIn(plotPredDots[2]),
    new M.Flash(plotPredDots[2], { color: C.amber, flashRadius: 0.14, lineLength: 0.14 }),
    ...say('STATION 40 m²: PREDICTED $1,030', C.amber)
  );

  // beat 24: Station 50 -> $1,130
  await until(S(24));
  await play(
    new M.FadeOut(cards[3].predSlot), new M.FadeIn(cards[3].predVal),
    new M.FadeIn(plotPredDots[3]),
    new M.Flash(plotPredDots[3], { color: C.amber, flashRadius: 0.14, lineLength: 0.14 }),
    ...say('STATION 50 m²: PREDICTED $1,130', C.amber)
  );

  // beat 25: second arrow (+$100)
  const arrStation = mkArrow([COL_L + CW / 2 + 0.12, ROW_B, 0], [COL_R - CW / 2 - 0.12, ROW_B, 0], C.amber, 3.6);
  const badgeStation = mkBadge('+$100', C.amber, [GAP_X, ROW_B + 0.34, 0], P ? 16 : 18);
  await until(S(25));
  await play(
    new M.Create(arrStation.shaft, { runTime: 0.8 }), new M.FadeIn(arrStation.head),
    new M.FadeIn(badgeStation),
    new M.Indicate(plotStationLine, { color: C.amber }),
    ...say('STATION RISE ALSO +$100', C.amber)
  );

  // beat 26: same neighborhood while area changes
  await until(S(26));
  await play(
    new M.Indicate(badgeCedar, { color: C.green }),
    new M.Indicate(badgeStation, { color: C.green }),
    new M.Indicate(hdr40, { color: C.green }), new M.Indicate(hdr50, { color: C.green }),
    ...say('SAME NEIGHBORHOOD, AREA CHANGES', C.green)
  );

  // --- 27-32: slider panel analogy, slope, partial slope ----------------------
  const slH = P ? 1.85 : 3.45;
  const slBg = new M.RoundedRectangle({ width: SW, height: slH, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  slBg.setFill(C.card, 0.95); slBg.moveTo(SIDE);

  const aY = P ? SIDE[1] + 0.12 : SIDE[1] + 0.25;
  const nY = P ? SIDE[1] + 0.12 : SIDE[1] - 0.78;
  const aX0 = P ? SIDE[0] - 3.10 : SIDE[0] - 1.40, aX1 = P ? SIDE[0] - 0.40 : SIDE[0] + 1.40;
  const nX0 = P ? SIDE[0] + 0.45 : SIDE[0] - 1.40, nX1 = P ? SIDE[0] + 3.15 : SIDE[0] + 1.40;
  const aPos = s => [aX0 + (s - 40) / 20 * (aX1 - aX0), aY, 0];
  const nPosCedar = [nX0 + 0.22 * (nX1 - nX0), nY, 0];
  const nPosStation = [nX0 + 0.78 * (nX1 - nX0), nY, 0];

  const slLabA = T('Area (moves)', P ? 14 : 16, C.cyan, true, true);
  slLabA.moveTo([(aX0 + aX1) / 2, aY + (P ? 0.46 : 0.48), 0]);
  const slTrkA = new M.Line({ start: [aX0, aY, 0], end: [aX1, aY, 0], color: C.cyan, strokeWidth: 3 });
  const slTicksA = [40, 50, 60].map(v => {
    const p = aPos(v);
    const t = T(String(v), 13, C.muted, true); t.moveTo([p[0], aY - 0.30, 0]);
    const mk = new M.Line({ start: [p[0], aY - 0.08, 0], end: [p[0], aY + 0.08, 0], color: C.muted, strokeWidth: 2 });
    return new M.VGroup(mk, t);
  });
  const slHaloA = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 1 });
  slHaloA.setFill(C.cyan, 0.22); slHaloA.setStrokeOpacity(0); slHaloA.moveTo(aPos(40));
  const slKnobA = new M.Circle({ radius: 0.12, color: C.cyan, strokeWidth: 2 });
  slKnobA.setFill(C.cyan, 1); slKnobA.moveTo(aPos(40));

  const slLabN = T('Neighborhood', P ? 14 : 16, C.amber, true, true);
  slLabN.moveTo([(nX0 + nX1) / 2 - (P ? 0.38 : 0.48), nY + (P ? 0.46 : 0.42), 0]);
  const slFixedBadge = mkBadge('FIXED', C.amber, [(nX0 + nX1) / 2 + (P ? 0.92 : 0.98), nY + (P ? 0.46 : 0.42), 0], 11);
  const slTrkN = new M.Line({ start: [nX0, nY, 0], end: [nX1, nY, 0], color: C.muted, strokeWidth: 3 });
  const slTickC = T('Cedar', 13, C.amber, true); slTickC.moveTo([nPosCedar[0], nY - 0.30, 0]);
  const slTickS = T('Station', 13, C.muted, true); slTickS.moveTo([nPosStation[0], nY - 0.30, 0]);
  const slKnobN = new M.Circle({ radius: 0.12, color: C.amber, strokeWidth: 2 });
  slKnobN.setFill(C.amber, 1); slKnobN.moveTo(nPosCedar);

  const slReadY = P ? SIDE[1] - 0.62 : SIDE[1] - 1.42;
  const slRead1 = T('Cedar: $970 → $1,070 (+$100)', P ? 15 : 15, C.ink, true);
  slRead1.moveTo([SIDE[0], slReadY, 0]);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(plotBg, axisX, axisY, tx40, tx50, ty10, ty11, plotTitle,
      ...plotAskPts, plotCedarLine, plotStationLine, ...plotPredDots, plotFittedTag)),
    new M.FadeIn(slBg), new M.FadeIn(slLabA), new M.FadeIn(slTrkA), ...slTicksA.map(t => new M.FadeIn(t)),
    new M.FadeIn(slHaloA), new M.FadeIn(slKnobA),
    new M.FadeIn(slLabN), new M.FadeIn(slFixedBadge), new M.FadeIn(slTrkN),
    new M.FadeIn(slTickC), new M.FadeIn(slTickS), new M.FadeIn(slKnobN),
    ...say('MOVE ONE SLIDER, HOLD THE OTHER STILL', C.violet)
  );
  const halo50 = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 1 });
  halo50.setFill(C.cyan, 0.22); halo50.setStrokeOpacity(0); halo50.moveTo(aPos(50));
  const knob50 = new M.Circle({ radius: 0.12, color: C.cyan, strokeWidth: 2 });
  knob50.setFill(C.cyan, 1); knob50.moveTo(aPos(50));
  await play(
    new M.Transform(slHaloA, halo50, { runTime: 0.9 }),
    new M.Transform(slKnobA, knob50, { runTime: 0.9 }),
    new M.FadeIn(slRead1)
  );

  // beat 28: slope = change for one step
  const slRead2 = T('1 step → +$100 predicted', P ? 15 : 15, C.cyan, true, true);
  slRead2.moveTo([SIDE[0], slReadY, 0]);
  await until(S(28));
  await play(
    new M.FadeOut(slRead1), new M.FadeIn(slRead2),
    new M.Indicate(badgeCedar, { color: C.cyan }), new M.Indicate(badgeStation, { color: C.amber }),
    ...say('SLOPE = CHANGE FOR ONE STEP', C.cyan)
  );

  // beat 29: here one step is 10 extra square metres
  const stepTag = mkBadge('+10 m² = 1 step', C.cyan, [GAP_X, HDR_Y, 0], P ? 13 : 15);
  await until(S(29));
  await play(
    new M.FadeIn(stepTag),
    new M.Indicate(slKnobA, { color: C.cyan }),
    ...say('ONE STEP = 10 EXTRA m²', C.cyan)
  );

  // beat 30: partial slope definition
  await until(S(30));
  await play(
    new M.Indicate(slKnobA, { color: C.green }),
    new M.Indicate(slFixedBadge, { color: C.amber }),
    ...say('PARTIAL SLOPE: ONE MOVES, REST FIXED', C.green)
  );

  // beat 31: partial slope for area is $100 per 10 m²
  const slRead3 = T('partial slope = $100 / 10 m²', P ? 15 : 15, C.green, true, true);
  slRead3.moveTo([SIDE[0], slReadY, 0]);
  await until(S(31));
  await play(
    new M.FadeOut(slRead2), new M.FadeIn(slRead3),
    new M.Indicate(badgeCedar, { color: C.green }), new M.Indicate(badgeStation, { color: C.green }),
    ...say('AREA PARTIAL SLOPE = $100 PER 10 m²', C.green)
  );

  // beat 32: slope stays the same as area changes (50 -> 60 adds another +$100)
  const halo60 = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 1 });
  halo60.setFill(C.cyan, 0.22); halo60.setStrokeOpacity(0); halo60.moveTo(aPos(60));
  const knob60 = new M.Circle({ radius: 0.12, color: C.cyan, strokeWidth: 2 });
  knob60.setFill(C.cyan, 1); knob60.moveTo(aPos(60));
  const slRead4 = T('50 → 60 m²: $1,070 → $1,170 (+$100)', P ? 14 : 14, C.cyan, true, true);
  slRead4.moveTo([SIDE[0], slReadY, 0]);
  await until(S(32));
  await play(
    new M.Transform(slHaloA, halo60, { runTime: 1.0 }),
    new M.Transform(slKnobA, knob60, { runTime: 1.0 }),
    new M.FadeOut(slRead3), new M.FadeIn(slRead4),
    ...say('SAME +$100 SLOPE AS AREA CHANGES', C.cyan)
  );

  // --- 33-35: formula box & what it is for ------------------------------------
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(slBg, slLabA, slTrkA, ...slTicksA, slHaloA, slKnobA,
      slLabN, slFixedBadge, slTrkN, slTickC, slTickS, slKnobN, slRead4, stepTag)),
    ...fbox([
      ['rent change', C.ink],
      ['  = slope × area steps', C.cyan],
    ], C.cyan),
    ...say('RENT CHANGE = SLOPE × AREA STEPS', C.cyan)
  );

  await until(S(34));
  await play(
    ...fbox([
      ['rent change', C.ink],
      ['  = slope × area steps', C.muted],
      ['  = $100 × 1', C.amber],
      ['  = $100', C.amber],
    ], C.amber),
    new M.Indicate(badgeCedar, { color: C.amber }), new M.Indicate(badgeStation, { color: C.amber }),
    ...say('1 STEP: $100 × 1 = $100', C.amber)
  );

  await until(S(35));
  await play(
    new M.Indicate(arrCedar.shaft, { color: C.green }), new M.Indicate(arrStation.shaft, { color: C.green }),
    new M.Indicate(badgeCedar, { color: C.green }), new M.Indicate(badgeStation, { color: C.green }),
    ...say('COMPARE WHEN ONLY ONE DETAIL CHANGES', C.green)
  );

  // --- 36-39: diagonal trap, causation caveat, recap --------------------------
  const arrDiag = mkArrow(
    [COL_L + CW / 2 - 0.10, ROW_T - CH / 2 + 0.04, 0],
    [COL_R - CW / 2 + 0.10, ROW_B + CH / 2 - 0.04, 0],
    C.pink, 3.6
  );
  const badgeDiag = mkBadge('+$160', C.pink, [GAP_X, MID_Y, 0], P ? 16 : 18);
  await until(S(36));
  await play(
    new M.Create(arrDiag.shaft, { runTime: 0.9 }), new M.FadeIn(arrDiag.head),
    new M.FadeIn(badgeDiag),
    ...fbox([
      ['small Cedar → large Station', C.ink],
      ['$970 → $1,130', C.muted],
      ['predicted gap = $160', C.pink],
    ], C.pink),
    ...say('TRAP: DIAGONAL GAP = $160', C.pink)
  );

  // beat 37: neighborhood (+$60) + area (+$100) = $160
  const arrVert = mkArrow(
    [COL_L, ROW_T - CH / 2 - 0.04, 0],
    [COL_L, ROW_B + CH / 2 + 0.04, 0],
    C.pink, 3.2, true, 0.13
  );
  const badgeVert = mkBadge('+$60', C.pink, [COL_L - 0.62, MID_Y, 0], P ? 15 : 16);
  await until(S(37));
  await play(
    new M.Create(arrVert.shaft, { runTime: 0.7 }), new M.FadeIn(arrVert.head),
    new M.FadeIn(badgeVert),
    new M.Indicate(badgeStation, { color: C.pink }),
    ...fbox([
      ['+$100  area (40 → 50 m²)', C.cyan],
      ['+ $60  Cedar → Station', C.amber],
      ['= $160 two changes!', C.pink],
    ], C.pink),
    ...say('BOTH NEIGHBORHOOD AND AREA CHANGED', C.pink)
  );

  // beat 38: four separate listings, not renovating one apartment
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(arrDiag.shaft, arrDiag.head, badgeDiag, arrVert.shaft, arrVert.head, badgeVert)),
    new M.LaggedStart(cards.map(c => new M.Indicate(c.idTag, { color: C.amber })), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox([
      ['4 separate listings', C.amber],
      ['not adding space to', C.muted],
      ['the same apartment', C.muted],
    ], C.amber),
    ...say('DIFFERENT HOMES, NOT RENOVATING ONE', C.amber)
  );

  // beat 39: final recap
  await until(S(39));
  await play(
    new M.Indicate(badgeCedar, { color: C.green }),
    new M.Indicate(badgeStation, { color: C.green }),
    ...fbox([
      ['partial slope = $100 / 10 m²', C.green],
      ['compares predictions', C.ink],
      ['other inputs stay fixed', C.cyan],
    ], C.green),
    ...say('PARTIAL SLOPE: OTHER INPUTS FIXED', C.green)
  );
}
