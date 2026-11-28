// 10.2.7 Multicollinearity: when inputs move together (live Manim-web lesson).
// Beat i = sentence i (0-based, 0..47). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 3.92, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -3.90, 0] : [4.20, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Scatter plot bounds (Area 35..67 m², Walk 4.9..10.9 min)
  const PX0 = P ? -2.90 : -5.45, PX1 = P ? 3.40 : 0.95;
  const PY0 = P ? -1.30 : -2.15, PY1 = P ? 2.80 : 1.25;
  const ax = area => PX0 + (area - 35) / 32 * (PX1 - PX0);
  const ay = walk => PY0 + (walk - 4.9) / 6.0 * (PY1 - PY0);
  const pt = (area, walk) => [ax(area), ay(walk), 0];

  // Formula box (one at a time): lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function badge(label, sub, color, pos, w, h) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t1 = T(label, P ? 21 : 22, color, false, true); t1.moveTo([pos[0], pos[1] + (sub ? 0.22 : 0), 0]);
    if (!sub) return new M.VGroup(r, t1);
    const t2 = T(sub, P ? 16 : 17, C.muted, true); t2.moveTo([pos[0], pos[1] - 0.26, 0]);
    return new M.VGroup(r, t1, t2);
  }

  function makeArrow(a, b, color, sw = 3, tip = 0.16) {
    return new M.Arrow({ start: a, end: b, color, strokeWidth: sw, tipLength: tip, buff: 0 });
  }

  function makeDot(p, color, haloOp = 0.20) {
    const halo = new M.Dot({ point: p, radius: 0.28, color });
    halo.setFill(color, haloOp);
    const core = new M.Dot({ point: p, radius: 0.12, color });
    core.setFill(color, 1);
    return { halo, core };
  }

  // Shared Cedar cards (chapter 10.2: B, F, J)
  const CARDS = [
    { tag: 'SMALL · CEDAR (B)', area: '40 m²', walk: '10 min walk', rent: '$1,000' },
    { tag: 'MIDDLE · CEDAR (F)', area: '50 m²', walk: '8 min walk', rent: '$1,100' },
    { tag: 'LARGE · CEDAR (J)', area: '60 m²', walk: '7 min walk', rent: '$1,400' },
  ];

  // --- 0: rent changes with space and walk to transit ---
  const bSpace = badge('SPACE', 'square metres', C.cyan, P ? [-1.85, 1.35, 0] : [-3.3, 0.45, 0], P ? 3.0 : 3.4, P ? 1.2 : 1.15);
  const bWalk = badge('WALK', 'minutes to transit', C.amber, P ? [1.85, 1.35, 0] : [-3.3, -1.10, 0], P ? 3.0 : 3.4, P ? 1.2 : 1.15);
  const bRent = badge('MONTHLY RENT', 'dollars', C.green, P ? [0, -1.35, 0] : [3.0, -0.32, 0], P ? 3.8 : 3.8, P ? 1.25 : 1.25);
  const arrSpace = makeArrow(P ? [-1.5, 0.70, 0] : [-1.52, 0.30, 0], P ? [-0.55, -0.68, 0] : [1.02, -0.10, 0], C.cyan, 3, 0.18);
  const arrWalk = makeArrow(P ? [1.5, 0.70, 0] : [-1.52, -0.95, 0], P ? [0.55, -0.68, 0] : [1.02, -0.55, 0], C.amber, 3, 0.18);
  const q1 = T('?', 26, C.cyan, true, true).moveTo(P ? [-1.45, 0.02, 0] : [-0.25, 0.44, 0]);
  const q2 = T('?', 26, C.amber, true, true).moveTo(P ? [1.45, 0.02, 0] : [-0.25, -1.08, 0]);
  const introGroup = new M.VGroup(bSpace, bWalk, bRent, arrSpace, arrWalk, q1, q2);

  await until(S(0));
  await play(new M.FadeIn(introGroup, { runTime: 1.0 }), ...say('HOW DOES RENT CHANGE?'));

  // --- 1-8: three Cedar listing cards ---
  const cardCenters = P
    ? [[0, 2.05, 0], [0, -0.25, 0], [0, -2.55, 0]]
    : [[-4.2, -0.35, 0], [0, -0.35, 0], [4.2, -0.35, 0]];
  const CW = P ? 6.8 : 3.65, CH = P ? 1.92 : 3.40;
  const cardRects = [], cardShells = [], ageTags = [], specTags = [], rentTags = [];

  for (let k = 0; k < 3; k++) {
    const [cx, cy] = cardCenters[k];
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.18, color: C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([cx, cy, 0]);
    cardRects.push(r);
    const hdr = T(CARDS[k].tag, P ? 17 : 18, C.cyan, false, true);
    hdr.moveTo(P ? [cx - 1.55, cy + 0.56, 0] : [cx, cy + 1.24, 0]);
    const div = new M.Line({
      start: [cx - CW / 2 + 0.25, P ? cy + 0.22 : cy + 0.86, 0],
      end: [cx + CW / 2 - 0.25, P ? cy + 0.22 : cy + 0.86, 0],
      color: C.line, strokeWidth: 1.5
    });
    cardShells.push(new M.VGroup(r, hdr, div));

    const age = T(P ? 'Age: 10 yr' : 'Age: 10 years', P ? 16 : 17, C.muted);
    age.moveTo(P ? [cx + 2.15, cy + 0.56, 0] : [cx, cy + 0.52, 0]);
    ageTags.push(age);

    const tArea = T(CARDS[k].area, P ? 23 : 26, C.cyan, true, true);
    tArea.moveTo(P ? [cx - 2.15, cy - 0.30, 0] : [cx, cy - 0.02, 0]);
    const tWalk = T(CARDS[k].walk, P ? 18 : 21, C.amber, true);
    tWalk.moveTo(P ? [cx + 0.02, cy - 0.30, 0] : [cx, cy - 0.56, 0]);
    specTags.push(new M.VGroup(tArea, tWalk));

    const tRent = T(P ? CARDS[k].rent : `${CARDS[k].rent} / mo`, P ? 24 : 25, C.green, true, true);
    tRent.moveTo(P ? [cx + 2.25, cy - 0.30, 0] : [cx, cy - 1.22, 0]);
    rentTags.push(tRent);
  }

  await until(S(1));
  await play(
    new M.FadeOut(introGroup, { runTime: 0.45 }),
    new M.LaggedStart(cardShells.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('3 CEDAR LISTINGS')
  );

  await until(S(2));
  await play(
    new M.LaggedStart(ageTags.map(a => new M.FadeIn(a)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('ALL 3: AGE 10 YEARS', C.muted)
  );

  // Small card (B)
  await until(S(3));
  // cyan outline over the dark card (setColor would fill it solid and hide the text)
  const hi0 = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  hi0.setFill(C.card, 0); hi0.moveTo(cardCenters[0]);
  await play(new M.FadeIn(hi0, { runTime: 0.5 }), new M.FadeIn(specTags[0], { runTime: 0.8 }), ...say('SMALL: 40 m² · 10 MIN WALK'));

  await until(S(4));
  await play(new M.FadeIn(rentTags[0], { runTime: 0.7 }), new M.Indicate(rentTags[0], { color: C.green }), ...say('SMALL RENT = $1,000', C.green));

  // Middle card (F)
  await until(S(5));
  // cyan outline over the dark card (setColor would fill it solid and hide the text)
  const hi1 = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  hi1.setFill(C.card, 0); hi1.moveTo(cardCenters[1]);
  await play(new M.FadeIn(hi1, { runTime: 0.5 }), new M.FadeIn(specTags[1], { runTime: 0.8 }), ...say('MIDDLE: 50 m² · 8 MIN WALK'));

  await until(S(6));
  await play(new M.FadeIn(rentTags[1], { runTime: 0.7 }), new M.Indicate(rentTags[1], { color: C.green }), ...say('MIDDLE RENT = $1,100', C.green));

  // Large card (J)
  await until(S(7));
  // cyan outline over the dark card (setColor would fill it solid and hide the text)
  const hi2 = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  hi2.setFill(C.card, 0); hi2.moveTo(cardCenters[2]);
  await play(new M.FadeIn(hi2, { runTime: 0.5 }), new M.FadeIn(specTags[2], { runTime: 0.8 }), ...say('LARGE: 60 m² · 7 MIN WALK'));

  await until(S(8));
  await play(new M.FadeIn(rentTags[2], { runTime: 0.7 }), new M.Indicate(rentTags[2], { color: C.green }), ...say('LARGE RENT = $1,400', C.green));

  // --- 9-10: scatter plot (Area vs Walk time) ---
  const xAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 });
  const yAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 });

  const guideLines = [];
  for (const aVal of [40, 50, 60]) {
    const gl = new M.DashedLine({ start: [ax(aVal), PY0, -0.01], end: [ax(aVal), PY1, -0.01], color: C.grid });
    gl.setStrokeOpacity(0.28); guideLines.push(gl);
  }
  for (const wVal of [6, 7, 8, 9, 10]) {
    const gl = new M.DashedLine({ start: [PX0, ay(wVal), -0.01], end: [PX1, ay(wVal), -0.01], color: C.grid });
    gl.setStrokeOpacity(0.28); guideLines.push(gl);
  }
  const plotGrid = new M.VGroup(...guideLines);

  const tickParts = [];
  for (const aVal of [40, 50, 60]) {
    tickParts.push(new M.Line({ start: [ax(aVal), PY0 - 0.08, 0], end: [ax(aVal), PY0 + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    tickParts.push(T(String(aVal), 17, C.muted, true).moveTo([ax(aVal), PY0 - 0.30, 0]));
  }
  for (const wVal of [6, 7, 8, 9, 10]) {
    tickParts.push(new M.Line({ start: [PX0 - 0.08, ay(wVal), 0], end: [PX0 + 0.08, ay(wVal), 0], color: C.muted, strokeWidth: 2 }));
    tickParts.push(T(String(wVal), 17, C.muted, true).moveTo([PX0 - 0.34, ay(wVal), 0]));
  }
  const plotTicks = new M.VGroup(...tickParts);
  const xLabel = T('Area (m²)', 18, C.cyan, false, true).moveTo([(PX0 + PX1) / 2, PY0 - 0.68, 0]);
  const yLabel = T('Walk (min)', 18, C.amber, false, true).moveTo([PX0 + 0.25, PY1 + 0.26, 0]);

  const dS = makeDot(pt(40, 10), C.cyan);
  const dM = makeDot(pt(50, 8), C.cyan);
  const dL = makeDot(pt(60, 7), C.cyan);
  // above the dot, clear of its glow and of the trend line
  const labSmall = T('Small $1,000', P ? 15 : 16, C.cyan, true).moveTo([ax(40) - 0.2, ay(10) + 0.45, 0]);
  const labMid = T('Middle $1,100', P ? 15 : 16, C.cyan, true).moveTo([ax(50) - 0.85, ay(8) - 0.28, 0]);
  let labLarge = T('Large $1,400', P ? 15 : 16, C.cyan, true).moveTo([ax(60) + 0.15, ay(7) + 0.38, 0]);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...cardShells, hi0, hi1, hi2, ...ageTags, ...specTags, ...rentTags), { runTime: 0.45 }),
    ...say('AREA (BOTTOM) vs WALK (SIDE)')
  );
  await play(
    new M.Create(xAxis, { runTime: 0.6 }),
    new M.Create(yAxis, { runTime: 0.6 }),
    new M.FadeIn(plotGrid, { runTime: 0.6 }),
    new M.FadeIn(plotTicks, { runTime: 0.6 }),
    new M.FadeIn(xLabel, { runTime: 0.6 }),
    new M.FadeIn(yLabel, { runTime: 0.6 }),
    new M.LaggedStart([
      new M.FadeIn(dS.halo), new M.FadeIn(dS.core), new M.FadeIn(labSmall),
      new M.FadeIn(dM.halo), new M.FadeIn(dM.core), new M.FadeIn(labMid),
      new M.FadeIn(dL.halo), new M.FadeIn(dL.core), new M.FadeIn(labLarge),
    ], { lagRatio: 0.10, runTime: 1.5 })
  );

  // Trend line through (40,10), (50,8), (60,6)
  const trendLine = new M.DashedLine({ start: pt(38, 10.4), end: pt(62, 5.6), color: C.amber });
  trendLine.setStrokeOpacity(0.8);
  await until(S(10));
  await play(new M.Create(trendLine, { runTime: 1.0 }), ...say('ALMOST A STRAIGHT LINE', C.amber));

  // --- 11-12: two people pushing a box analogy (in dedicated side/bottom panel) ---
  const [px, py] = BOXP;
  const PW = P ? 6.8 : 4.75, PH = P ? 2.35 : 2.95;
  const pCard = new M.RoundedRectangle({ width: PW, height: PH, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 });
  pCard.setFill(C.card, 0.95); pCard.moveTo([px, py, 0]);
  const pTitle = T('Two people push one box', P ? 17 : 18, C.amber, false, true).moveTo([px, py + PH * 0.36, 0]);
  const floorY = py - PH * 0.24;
  const pFloor = new M.Line({ start: [px - PW * 0.43, floorY, 0], end: [px + PW * 0.43, floorY, 0], color: C.muted, strokeWidth: 2 });

  function personIcon(x, y, color, lbl) {
    const hd = new M.Circle({ radius: 0.12, color }); hd.setFill(color, 1); hd.moveTo([x, y + 0.42, 0]);
    const bd = new M.Arc({ radius: 0.22, startAngle: 0, angle: Math.PI, color }); bd.setFill(color, 1); bd.moveTo([x, y + 0.10, 0]);
    const tg = T(lbl, 15, color, true, true).moveTo([x, y - 0.18, 0]);
    return new M.VGroup(hd, bd, tg);
  }
  const pAX = px - PW * 0.33, pBX = px - PW * 0.17, boxX = px + PW * 0.12;
  const persA = personIcon(pAX, floorY + 0.02, C.cyan, 'A');
  const persB = personIcon(pBX, floorY + 0.02, C.amber, 'B');
  const pBox = new M.RoundedRectangle({ width: 0.95, height: 0.72, cornerRadius: 0.08, color: C.ink, strokeWidth: 2.5 });
  pBox.setFill(C.line, 0.95); pBox.moveTo([boxX, floorY + 0.38, 0]);
  const pBoxLbl = T('BOX', 16, C.ink, true, true).moveTo([boxX, floorY + 0.38, 0]);
  const pushBase = new M.VGroup(pCard, pTitle, pFloor, persA, persB, pBox, pBoxLbl);

  const pushArrA = makeArrow([pAX + 0.16, floorY + 0.48, 0], [boxX - 0.52, floorY + 0.48, 0], C.cyan, 2.5, 0.14);
  const pushArrB = makeArrow([pBX + 0.16, floorY + 0.28, 0], [boxX - 0.52, floorY + 0.28, 0], C.amber, 2.5, 0.14);
  const moveArr = makeArrow([boxX + 0.56, floorY + 0.38, 0], [px + PW * 0.42, floorY + 0.38, 0], C.green, 3, 0.15);
  const moveLbl = T('move', 14, C.green, true).moveTo([(boxX + 0.56 + px + PW * 0.42) / 2, floorY + 0.62, 0]);
  const pushArrows = new M.VGroup(pushArrA, pushArrB, moveArr, moveLbl);

  await until(S(11));
  await play(new M.FadeIn(pushBase, { runTime: 0.8 }), new M.FadeIn(pushArrows, { runTime: 0.8 }), ...say('TWO PEOPLE PUSH ONE BOX', C.amber));

  const pQA = T('?', 21, C.cyan, true, true).moveTo([pAX, floorY + 0.78, 0]);
  const pQB = T('?', 21, C.amber, true, true).moveTo([pBX, floorY + 0.78, 0]);
  const pNote = T('push together → each push = ?', P ? 15 : 15, C.pink, true).moveTo([px, py - PH * 0.42, 0]);
  const pushQ = new M.VGroup(pQA, pQB, pNote);

  await until(S(12));
  await play(new M.FadeIn(pushQ, { runTime: 0.7 }), new M.Indicate(pushArrows, { color: C.pink }), ...say('PUSH TOGETHER → EACH PUSH UNCLEAR', C.pink));

  // --- 13-14: predictors & multicollinearity ---
  await until(S(13));
  await play(
    new M.FadeOut(pushBase, { runTime: 0.45 }),
    new M.FadeOut(pushArrows, { runTime: 0.45 }),
    new M.FadeOut(pushQ, { runTime: 0.45 }),
    new M.Indicate(xLabel, { color: C.cyan }),
    new M.Indicate(yLabel, { color: C.amber }),
    ...fbox([
      ['predictors (inputs):', C.muted],
      ['  area (m²)', C.cyan],
      ['  walk time (min)', C.amber],
      ['→ predict rent', C.green],
    ]),
    ...say('PREDICTORS = INPUT DETAILS')
  );

  await until(S(14));
  await play(
    new M.Indicate(trendLine, { color: C.pink }),
    ...fbox([
      ['predictors tied near', C.ink],
      ['one straight line', C.amber],
      ['= multicollinearity', C.pink],
    ], C.pink),
    ...say('MULTICOLLINEARITY', C.pink)
  );

  // --- 15-17: fitted rule and meaning of slope ---
  await until(S(15));
  await play(
    new M.LaggedStart([
      new M.Flash(dS.core, { color: C.green }),
      new M.Flash(dM.core, { color: C.green }),
      new M.Flash(dL.core, { color: C.green }),
    ], { lagRatio: 0.25, runTime: 1.2 }),
    ...fbox([
      ['fitted rule matches:', C.muted],
      ['  Small   $1,000 ✓', C.green],
      ['  Middle  $1,100 ✓', C.green],
      ['  Large   $1,400 ✓', C.green],
    ], C.green),
    ...say('RULE MATCHES ALL 3 RENTS', C.green)
  );

  await until(S(16));
  await play(
    ...fbox([
      ['fixed change per step:', C.muted],
      ['  area: +10 m² → ?', C.cyan],
      ['  walk:  +1 min → ?', C.amber],
    ]),
    ...say('FIXED CHANGE PER STEP')
  );

  await until(S(17));
  await play(
    ...fbox([
      ['slope = rent change', C.amber],
      ['  for 1 predictor step', C.ink],
      ['  (other input fixed)', C.muted],
    ], C.amber),
    ...say('SLOPE: OTHER INPUT FIXED', C.amber)
  );

  // --- 18-19: first move (Small -> Middle) ---
  const s1AreaArr = makeArrow([ax(40) + 0.14, ay(10), 0], [ax(50) - 0.04, ay(10), 0], C.cyan, 3, 0.16);
  const s1AreaLbl = T('+10 m²', 16, C.cyan, true).moveTo([ax(45), ay(10) + 0.24, 0]);
  await until(S(18));
  await play(
    new M.Create(s1AreaArr, { runTime: 0.7 }),
    new M.FadeIn(s1AreaLbl, { runTime: 0.7 }),
    ...fbox([
      ['Small → Middle:', C.muted],
      ['  area: +10 m²', C.cyan],
    ]),
    ...say('SMALL → MIDDLE: AREA +10 m²')
  );

  const s1WalkArr = makeArrow([ax(50), ay(10) - 0.04, 0], [ax(50), ay(8) + 0.14, 0], C.amber, 3, 0.16);
  const s1WalkLbl = T('−2 min', 16, C.amber, true).moveTo([ax(50) + 0.66, ay(9.1), 0]);
  await until(S(19));
  await play(
    new M.Create(s1WalkArr, { runTime: 0.7 }),
    new M.FadeIn(s1WalkLbl, { runTime: 0.7 }),
    ...fbox([
      ['Small → Middle:', C.muted],
      ['  area: +10 m²', C.cyan],
      ['  walk:  −2 min', C.amber],
      ['  rent: +$100', C.green],
    ], C.amber),
    ...say('WALK −2 MIN, RENT +$100', C.amber)
  );

  // --- 20-23: second move -> imaginary card (60 m², 6 min, $1,200) ---
  // Go down first then right so it stays cleanly below the trend line and never hits (60, 7)
  const s2WalkArr = makeArrow([ax(50), ay(8) - 0.14, 0], [ax(50), ay(6) + 0.04, 0], C.violet, 2.5, 0.15);
  const s2WalkLbl = T('−2 min', 15, C.violet, true).moveTo([ax(50) - 0.66, ay(6.6), 0]);
  const s2AreaArr = makeArrow([ax(50) + 0.04, ay(6), 0], [ax(60) - 0.14, ay(6), 0], C.violet, 2.5, 0.15);
  const s2AreaLbl = T('+10 m²', 15, C.violet, true).moveTo([ax(55), ay(6) + 0.22, 0]);

  await until(S(20));
  await play(
    new M.Create(s2WalkArr, { runTime: 0.8 }),
    new M.FadeIn(s2WalkLbl, { runTime: 0.8 }),
    new M.Create(s2AreaArr, { runTime: 0.8 }),
    new M.FadeIn(s2AreaLbl, { runTime: 0.8 }),
    ...fbox([
      ['repeat both changes:', C.muted],
      ['  area: +10 m²', C.cyan],
      ['  walk:  −2 min', C.amber],
    ], C.violet),
    ...say('REPEAT BOTH CHANGES', C.violet)
  );

  const imHalo = new M.Circle({ radius: 0.24, color: C.violet, strokeWidth: 2 });
  imHalo.setFill(C.violet, 0.16); imHalo.moveTo(pt(60, 6));
  const imCore = new M.Dot({ point: pt(60, 6), radius: 0.11, color: C.violet });
  imCore.setFill(C.violet, 1);
  let imLab = T('Imaginary', P ? 15 : 16, C.violet, true).moveTo([ax(60) + 0.05, ay(6) - 0.36, 0]);

  await until(S(21));
  await play(
    new M.FadeIn(imHalo), new M.FadeIn(imCore), new M.FadeIn(imLab),
    new M.Flash(imCore, { color: C.violet }),
    ...fbox([
      ['imaginary card:', C.violet],
      ['  area = 60 m²', C.cyan],
      ['  walk = 6 min', C.amber],
    ], C.violet),
    ...say('IMAGINARY: 60 m², 6 MIN', C.violet)
  );

  await until(S(22));
  await play(
    new M.Indicate(s2AreaArr, { color: C.violet }),
    new M.Indicate(s2WalkArr, { color: C.violet }),
    ...fbox([
      ['same two changes:', C.muted],
      ['  +10 m², −2 min', C.ink],
      ['  same rise: +$100', C.violet],
    ], C.violet),
    ...say('SAME CHANGES → SAME +$100', C.violet)
  );

  const imLab2 = T('Imaginary $1,200', P ? 15 : 16, C.violet, true).moveTo([ax(60) + 0.05, ay(6) - 0.36, 0]);
  await until(S(23));
  await play(
    new M.FadeOut(imLab, { runTime: 0.4 }),
    new M.FadeIn(imLab2, { runTime: 0.6 }),
    ...fbox([
      ['imaginary prediction:', C.violet],
      ['  $1,100 + $100', C.muted],
      ['  = $1,200', C.violet],
    ], C.violet),
    ...say('IMAGINARY PREDICTION = $1,200', C.violet)
  );
  imLab = imLab2;

  // --- 24-27: compare Real Large (60, 7) with Imaginary (60, 6) -> walk slope ---
  const gapArr = makeArrow([ax(60), ay(6) + 0.13, 0], [ax(60), ay(7) - 0.13, 0], C.amber, 3.5, 0.14);
  // gap labels start right of the dot glow (phone: short text so it stays on screen)
  const gapAt = t => t.moveTo([ax(60) + 0.40 + t.getWidth() / 2, (ay(6) + ay(7)) / 2, 0]);
  let gapLbl = gapAt(T('+1 min', 15, C.amber, true));

  await until(S(24));
  await play(
    new M.Create(gapArr, { runTime: 0.7 }),
    new M.FadeIn(gapLbl, { runTime: 0.7 }),
    new M.Flash(dL.core, { color: C.amber }),
    ...fbox([
      ['Imaginary → Real Large:', C.muted],
      ['  area: 60 → 60 (fixed)', C.cyan],
      ['  walk:  6 → 7  (+1 min)', C.amber],
    ], C.amber),
    ...say('SAME AREA, WALK +1 MIN', C.amber)
  );

  const gapLbl200 = gapAt(T(P ? '+$200' : '+1 min · +$200', P ? 14 : 15, C.amber, true));
  await until(S(25));
  await play(
    new M.FadeOut(gapLbl, { runTime: 0.4 }),
    new M.FadeIn(gapLbl200, { runTime: 0.6 }),
    ...fbox([
      ['extra rent:', C.muted],
      ['  $1,400 − $1,200', C.ink],
      ['  = +$200', C.amber],
    ], C.amber),
    ...say('EXTRA RENT = +$200', C.amber)
  );
  gapLbl = gapLbl200;

  await until(S(26));
  await play(
    new M.Indicate(gapArr, { color: C.amber }),
    ...fbox([
      ['area stays fixed (0)', C.cyan],
      ['all +$200 goes to', C.ink],
      ['the extra +1 min', C.amber],
    ], C.amber),
    ...say('AREA FIXED → ALL $200 TO +1 MIN', C.amber)
  );

  await until(S(27));
  await play(
    new M.Indicate(gapLbl, { color: C.amber }),
    ...fbox([
      ['walk slope:', C.muted],
      ['  +$200 per minute', C.amber],
      ['odd: a LONGER walk', C.pink],
      ['  gives HIGHER rent?', C.pink],
    ], C.amber),
    ...say('WALK SLOPE = +$200 / MIN', C.amber)
  );

  // --- 28-31: return to first move -> area slope ---
  await until(S(28));
  await play(
    new M.Indicate(s1WalkArr, { color: C.amber }),
    new M.Indicate(s1WalkLbl, { color: C.amber }),
    ...fbox([
      ['first move (Small → Mid):', C.muted],
      ['  walk: −2 min', C.amber],
      ['  walk slope: +$200 / min', C.amber],
    ], C.amber),
    ...say('FIRST MOVE: WALK −2 MIN', C.amber)
  );

  await until(S(29));
  await play(
    ...fbox([
      ['walk part:', C.muted],
      ['  (−2 min) × $200', C.ink],
      ['  = −$400', C.pink],
    ], C.pink),
    ...say('WALK PART = −$400', C.pink)
  );

  await until(S(30));
  await play(
    new M.Indicate(s1AreaArr, { color: C.cyan }),
    new M.Indicate(s1AreaLbl, { color: C.cyan }),
    ...fbox([
      ['observed rise = +$100', C.green],
      ['area − $400 = +$100', C.muted],
      ['area part = +$500', C.cyan],
    ], C.cyan),
    ...say('+$500 − $400 = +$100')
  );

  await until(S(31));
  await play(
    ...fbox([
      ['original ($1,400):', C.muted],
      ['  walk: +$200 / min', C.amber],
      ['  area: +$500 / 10 m²', C.cyan],
    ], C.cyan),
    ...say('AREA SLOPE = +$500 / 10 m²')
  );

  // --- 32-38: change ONLY Large card rent $1,400 -> $1,420 (+$20) ---
  const dLPink = makeDot(pt(60, 7), C.pink, 0.26);
  const labLarge420 = T('Large $1,420', P ? 15 : 16, C.pink, true).moveTo([ax(60) + 0.15, ay(7) + 0.38, 0]);
  await until(S(32));
  await play(
    new M.Transform(dL.halo, dLPink.halo, { runTime: 0.7 }),
    new M.Transform(dL.core, dLPink.core, { runTime: 0.7 }),
    new M.FadeOut(labLarge, { runTime: 0.4 }),
    new M.FadeIn(labLarge420, { runTime: 0.6 }),
    new M.Flash(dL.core, { color: C.pink }),
    ...fbox([
      ['change ONLY Large rent:', C.muted],
      ['  $1,400 → $1,420', C.pink],
      ['  (+$20 only)', C.pink],
    ], C.pink),
    ...say('LARGE RENT: $1,400 → $1,420', C.pink)
  );
  labLarge = labLarge420;

  const gapLbl220 = gapAt(T(P ? '+$220' : '+1 min · +$220', P ? 14 : 15, C.pink, true));
  await until(S(33));
  await play(
    new M.FadeOut(gapLbl, { runTime: 0.4 }),
    new M.FadeIn(gapLbl220, { runTime: 0.6 }),
    new M.Indicate(gapArr, { color: C.pink }),
    ...fbox([
      ['new extra rent:', C.muted],
      ['  $1,420 − $1,200', C.ink],
      ['  = +$220', C.pink],
    ], C.pink),
    ...say('EXTRA RENT = +$220', C.pink)
  );
  gapLbl = gapLbl220;

  await until(S(34));
  await play(
    ...fbox([
      ['new walk slope:', C.muted],
      ['  +$200 → +$220 / min', C.pink],
    ], C.pink),
    ...say('WALK SLOPE: +$200 → +$220', C.pink)
  );

  await until(S(35));
  await play(
    new M.Indicate(s1WalkArr, { color: C.pink }),
    ...fbox([
      ['walk part (−2 min):', C.muted],
      ['  (−2) × $220', C.ink],
      ['  = −$440', C.pink],
    ], C.pink),
    ...say('WALK PART = −$440', C.pink)
  );

  await until(S(36));
  await play(
    new M.Indicate(s1AreaArr, { color: C.pink }),
    ...fbox([
      ['both slopes jumped:', C.muted],
      ['  walk: +$200 → +$220', C.pink],
      ['  area: +$500 → +$540', C.pink],
    ], C.pink),
    ...say('AREA SLOPE: +$500 → +$540', C.pink)
  );

  await until(S(37));
  await play(
    new M.Flash(dS.core, { color: C.green }),
    new M.Flash(dM.core, { color: C.green }),
    ...fbox([
      ['Small → Middle rent:', C.muted],
      ['  $1,000 → $1,100', C.ink],
      ['  still +$100 ✓', C.green],
    ], C.green),
    ...say('MIDDLE STILL GAINS +$100', C.green)
  );

  await until(S(38));
  await play(
    ...fbox([
      ['+$500 − $400 = +$100', C.muted],
      ['+$540 − $440 = +$100', C.green],
      ['(changes cancel out)', C.amber],
    ], C.green),
    ...say('$540 − $440 = $100', C.green)
  );

  // --- 39-40: the formula ---
  await until(S(39));
  await play(
    ...fbox([
      ['walk slope =', C.cyan],
      ['  extra rent ÷ extra walk', C.amber],
    ], C.cyan),
    ...say('WALK SLOPE = EXTRA RENT ÷ EXTRA WALK')
  );

  await until(S(40));
  await play(
    new M.Indicate(gapArr, { color: C.violet }),
    new M.Flash(imCore, { color: C.violet }),
    new M.Flash(dL.core, { color: C.pink }),
    ...fbox([
      ['walk slope =', C.cyan],
      ['  extra rent ÷ extra walk', C.amber],
      ['  real Large vs imaginary', C.violet],
    ], C.violet),
    ...say('COMPARE REAL LARGE vs IMAGINARY', C.violet)
  );

  // --- 41-44: exact collinearity (what if Large walk = 6 min?) ---
  const dLCol = makeDot(pt(60, 6), C.pink, 0.26);
  const labLargeCol = T('Large (60 m², 6 min)', P ? 14 : 15, C.pink, true).moveTo([ax(60) - 0.15, ay(6) - 0.36, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(
      gapArr, gapLbl, imHalo, imCore, imLab,
      s1AreaArr, s1AreaLbl, s1WalkArr, s1WalkLbl,
      s2AreaArr, s2AreaLbl, s2WalkArr, s2WalkLbl,
      labLarge
    ), { runTime: 0.5 }),
    new M.Transform(dL.halo, dLCol.halo, { runTime: 0.9 }),
    new M.Transform(dL.core, dLCol.core, { runTime: 0.9 }),
    new M.FadeIn(labLargeCol, { runTime: 0.8 }),
    new M.Indicate(trendLine, { color: C.pink }),
    ...fbox([
      ['if Large walk = 6 min:', C.pink],
      ['  (40,10) (50,8) (60,6)', C.ink],
      ['  all 3 on ONE line', C.pink],
    ], C.pink),
    ...say('ALL 3 DOTS ON ONE LINE', C.pink)
  );
  labLarge = labLargeCol;

  let eqStep1 = T('+10 m², −2 min', 15, C.amber, true).moveTo([ax(45) + 0.65, ay(9) + 0.28, 0]);
  let eqStep2 = T('+10 m², −2 min', 15, C.amber, true).moveTo([ax(55) + 0.65, ay(7) + 0.28, 0]);
  await until(S(42));
  await play(
    new M.FadeIn(eqStep1, { runTime: 0.7 }),
    new M.FadeIn(eqStep2, { runTime: 0.7 }),
    ...fbox([
      ['every +10 m² step', C.cyan],
      ['always brings −2 min', C.amber],
      ['(never moves alone)', C.muted],
    ], C.amber),
    ...say('EVERY +10 m² = EXACTLY −2 MIN', C.amber)
  );

  await until(S(43));
  await play(
    ...fbox([
      ['same +$100 per step:', C.muted],
      ['  +$500 & +$200', C.violet],
      ['  +$300 & +$100', C.violet],
      ['  +$100 &    $0', C.violet],
    ], C.violet),
    ...say('MANY SLOPE PAIRS FIT', C.violet)
  );

  const rise1 = T('step 1: +$100', 15, C.green, true).moveTo([ax(45) + 0.65, ay(9) + 0.28, 0]);
  const rise2 = T('step 2: +$300 ✗', 15, C.pink, true).moveTo([ax(55) + 0.65, ay(7) + 0.28, 0]);
  await until(S(44));
  await play(
    new M.FadeOut(eqStep1, { runTime: 0.4 }),
    new M.FadeOut(eqStep2, { runTime: 0.4 }),
    new M.FadeIn(rise1, { runTime: 0.6 }),
    new M.FadeIn(rise2, { runTime: 0.6 }),
    ...fbox([
      ['same combined move:', C.muted],
      ['  step 1 needs +$100', C.green],
      ['  step 2 needs +$300 ✗', C.pink],
    ], C.pink),
    ...say('SAME MOVE, DIFFERENT RISES', C.pink)
  );
  eqStep1 = rise1;
  eqStep2 = rise2;

  // --- 45-47: what to do, common trap, one-sentence recap ---
  const dLOrig = makeDot(pt(60, 7), C.cyan, 0.20);
  const labLargeOrig = T('Large $1,400', P ? 15 : 16, C.cyan, true).moveTo([ax(60) + 0.15, ay(7) + 0.38, 0]);
  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(eqStep1, eqStep2, labLarge), { runTime: 0.45 }),
    new M.Transform(dL.halo, dLOrig.halo, { runTime: 0.8 }),
    new M.Transform(dL.core, dLOrig.core, { runTime: 0.8 }),
    new M.FadeIn(labLargeOrig, { runTime: 0.7 }),
    new M.Indicate(xLabel, { color: C.cyan }),
    new M.Indicate(yLabel, { color: C.amber }),
    ...fbox([
      ['check first:', C.cyan],
      ['  plot one predictor', C.ink],
      ['  against the other', C.ink],
    ], C.cyan),
    ...say('PLOT PREDICTORS FIRST')
  );
  labLarge = labLargeOrig;

  await until(S(46));
  await play(
    new M.LaggedStart([
      new M.Flash(dS.core, { color: C.green }),
      new M.Flash(dM.core, { color: C.green }),
      new M.Flash(dL.core, { color: C.green }),
    ], { lagRatio: 0.22, runTime: 1.1 }),
    ...fbox([
      ['+$20 on one listing:', C.muted],
      ['  rents still match ✓', C.green],
      ['  walk: +$200 → +$220', C.pink],
      ['  area: +$500 → +$540', C.pink],
    ], C.amber),
    ...say('GOOD MATCH ≠ STEADY SLOPES', C.amber)
  );

  await until(S(47));
  await play(
    new M.Indicate(trendLine, { color: C.amber }),
    ...fbox([
      ['predictors move together:', C.amber],
      ['  good overall match ✓', C.green],
      ['  uncertain separate slopes', C.pink],
    ], C.green),
    ...say('GOOD MATCH CAN HIDE UNCERTAIN SLOPES', C.green)
  );
}
