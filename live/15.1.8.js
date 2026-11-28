// 15.1.8 Off-policy evaluation: test a new rule using old results.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.45;
  const PILL = P ? [0, 4.3, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, -4.85, 0] : [4.45, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time, never overlapping data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 19, lh = P ? 0.43 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.55;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Helper: learner outcome icon (green check = 1, grey cross = 0, dark ? = unobserved)
  function learnerIcon(x, y, state, rad) {
    if (state === 1) {
      const halo = new M.Dot({ point: [x, y, 0], radius: rad * 1.38, color: C.green });
      halo.setFill(C.green, 0.16);
      const ring = new M.Circle({ radius: rad, color: C.green, strokeWidth: 2.2 });
      ring.setFill(C.green, 0.2); ring.moveTo([x, y, 0]);
      const l1 = new M.Line({ start: [x - rad * 0.42, y - rad * 0.02, 0], end: [x - rad * 0.08, y - rad * 0.36, 0], color: C.green, strokeWidth: 2.8 });
      const l2 = new M.Line({ start: [x - rad * 0.08, y - rad * 0.36, 0], end: [x + rad * 0.46, y + rad * 0.34, 0], color: C.green, strokeWidth: 2.8 });
      return new M.VGroup(halo, ring, l1, l2);
    }
    if (state === 0) {
      const ring = new M.Circle({ radius: rad, color: C.muted, strokeWidth: 2 });
      ring.setFill(C.card, 0.92); ring.moveTo([x, y, 0]);
      const l1 = new M.Line({ start: [x - rad * 0.34, y - rad * 0.34, 0], end: [x + rad * 0.34, y + rad * 0.34, 0], color: C.muted, strokeWidth: 2.2 });
      const l2 = new M.Line({ start: [x - rad * 0.34, y + rad * 0.34, 0], end: [x + rad * 0.34, y - rad * 0.34, 0], color: C.muted, strokeWidth: 2.2 });
      return new M.VGroup(ring, l1, l2);
    }
    const ring = new M.Circle({ radius: rad, color: C.pink, strokeWidth: 2 });
    ring.setFill(C.bg, 0.96); ring.moveTo([x, y, 0]);
    const q = T('?', P ? 18 : 17, C.pink, true, true); q.moveTo([x, y, 0]);
    return new M.VGroup(ring, q);
  }

  // Helper: prompt card (A = cyan quiz, B = amber reminder)
  function promptCard(x, y, kind, w, h) {
    const isA = kind === 'A', col = isA ? C.cyan : C.amber;
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: col, strokeWidth: 2.5 });
    bg.setFill(C.card, 0.95); bg.moveTo([x, y, 0]);
    const iconBg = new M.Circle({ radius: 0.28, color: col, strokeWidth: 2 });
    iconBg.setFill(col, 0.18); iconBg.moveTo([x - w / 2 + 0.55, y, 0]);
    const parts = [bg, iconBg];
    if (isA) {
      const q = T('?', 24, col, true, true); q.moveTo([x - w / 2 + 0.55, y, 0]);
      parts.push(q);
    } else {
      const bell = new M.Arc({ radius: 0.14, startAngle: 0, angle: Math.PI, color: col });
      bell.setFill(col, 0.85); bell.moveTo([x - w / 2 + 0.55, y + 0.02, 0]);
      const rim = new M.Line({ start: [x - w / 2 + 0.38, y - 0.06, 0], end: [x - w / 2 + 0.72, y - 0.06, 0], color: col, strokeWidth: 3 });
      const clapper = new M.Dot({ point: [x - w / 2 + 0.55, y - 0.13, 0], radius: 0.05, color: col });
      parts.push(bell, rim, clapper);
    }
    const t1 = T(isA ? 'Prompt A' : 'Prompt B', P ? 22 : 23, col, false, true);
    t1.moveTo([x + 0.22, y + 0.22, 0]);
    const t2 = T(isA ? 'Quick quiz' : 'Study reminder', P ? 16 : 17, C.ink);
    t2.moveTo([x + 0.22, y - 0.22, 0]);
    parts.push(t1, t2);
    return new M.VGroup(...parts);
  }

  // Helper: mini student figure for the half-class analogy
  function studentIcon(x, y, col) {
    const head = new M.Circle({ radius: 0.14, color: col, strokeWidth: 2 });
    head.setFill(col, 0.9); head.moveTo([x, y + 0.24, 0]);
    const body = new M.Arc({ radius: 0.24, startAngle: 0, angle: Math.PI, color: col });
    body.setFill(col, 0.9); body.moveTo([x, y - 0.08, 0]);
    return new M.VGroup(head, body);
  }

  // ---- ACT 1: Situation & New Rule (Sentences 0 - 5) ----
  const appY = P ? 2.2 : 0.85;
  const appBox = new M.RoundedRectangle({ width: P ? 3.8 : 4.2, height: 0.9, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.5 });
  appBox.setFill(C.card, 0.96); appBox.moveTo([0, appY, 0]);
  const appTxt = T('STUDY APP', P ? 24 : 26, C.ink, true, true); appTxt.moveTo([0, appY, 0]);
  const appCard = new M.VGroup(appBox, appTxt);

  await until(S(0));
  await play(new M.FadeIn(appCard), ...fbox([['The app shows one prompt', C.ink], ['to each learner.', C.ink], ['Now: chosen at random', C.muted], ['Wanted: a better rule', C.amber]], C.cyan), ...say('STUDY APP: CHOOSING PROMPTS'));

  const cardY = P ? 0.15 : -1.05;
  const cardDX = P ? 1.85 : 2.65;
  const cardW = P ? 3.35 : 3.8, cardH = P ? 1.25 : 1.3;
  const cardA = promptCard(-cardDX, cardY, 'A', cardW, cardH);
  const cardB = promptCard(cardDX, cardY, 'B', cardW, cardH);

  await until(S(1));
  await play(new M.FadeIn(cardA), new M.FadeIn(cardB), ...(P ? fbox([['Two prompts:', C.ink], ['A = quick quiz', C.cyan], ['B = study reminder', C.amber]], C.cyan) : clearBox()), ...say('A = QUIZ   ·   B = REMINDER'));

  const arrOldA = new M.Arrow({ start: [-0.7, appY - 0.48, 0], end: [-cardDX, cardY + cardH / 2 + 0.08, 0], color: C.muted, strokeWidth: 3 });
  const arrOldB = new M.Arrow({ start: [0.7, appY - 0.48, 0], end: [cardDX, cardY + cardH / 2 + 0.08, 0], color: C.muted, strokeWidth: 3 });
  const lbl50A = pill('50%', C.muted, 16); lbl50A.moveTo([(-0.7 - cardDX) / 2 - 0.55, (appY - 0.48 + cardY + cardH / 2) / 2, 0]);
  const lbl50B = pill('50%', C.muted, 16); lbl50B.moveTo([(0.7 + cardDX) / 2 + 0.55, (appY - 0.48 + cardY + cardH / 2) / 2, 0]);

  await until(S(2));
  await play(new M.Create(arrOldA), new M.Create(arrOldB), new M.FadeIn(lbl50A), new M.FadeIn(lbl50B),
    ...(P ? fbox([['Old rule:', C.muted], ['A 50%  ·  B 50%', C.ink], ['chosen at random', C.ink]], C.muted) : []),
    ...say('OLD RULE: 50% A  ·  50% B AT RANDOM', C.muted));

  // New rule: context -> prompt
  const ctxY = P ? -2.0 : -2.45;
  const ctxSA = pill('STUDIED TODAY', C.cyan, P ? 15 : 16); ctxSA.moveTo([-cardDX, ctxY, 0]);
  const arrNewA = new M.Arrow({ start: [-cardDX, ctxY + 0.34, 0], end: [-cardDX, cardY - cardH / 2 - 0.08, 0], color: C.cyan, strokeWidth: 3.5 });

  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(arrOldA, arrOldB, lbl50A, lbl50B)),
    new M.FadeIn(ctxSA), new M.Create(arrNewA), ...(P ? fbox([['New rule:', C.violet], ['studied today → A', C.cyan]], C.violet) : []), ...say('NEW RULE: STUDIED TODAY → A', C.cyan));

  const ctxNB = pill('DID NOT STUDY', C.amber, P ? 15 : 16); ctxNB.moveTo([cardDX, ctxY, 0]);
  const arrNewB = new M.Arrow({ start: [cardDX, ctxY + 0.34, 0], end: [cardDX, cardY - cardH / 2 - 0.08, 0], color: C.amber, strokeWidth: 3.5 });

  await until(S(4));
  await play(new M.FadeIn(ctxNB), new M.Create(arrNewB), ...(P ? fbox([['New rule:', C.violet], ['studied today → A', C.cyan], ['did not study → B', C.amber]], C.violet) : []), ...say('NEW RULE: DID NOT STUDY → B', C.amber));

  await until(S(5));
  await play(new M.Indicate(arrNewA, { color: C.cyan }), new M.Indicate(arrNewB, { color: C.amber }),
    ...(P ? fbox([['How well would the', C.ink], ['new rule work?', C.ink], ['No new learners needed?', C.violet]], C.violet) : []),
    ...say('ESTIMATE WITHOUT NEW LEARNERS?', C.violet));

  // ---- ACT 2: Recorded Results of 20 Learners (Sentences 6 - 12) ----
  // Fixed shared dataset from chapters/15.1.md:
  // Studied + A: 4/5, Studied + B: 3/5, Did not study + A: 1/5, Did not study + B: 4/5
  const DATA = [
    [[1, 1, 1, 1, 0], [1, 1, 1, 0, 0]],
    [[1, 0, 0, 0, 0], [1, 1, 1, 1, 0]],
  ];
  const COUNTS = [['4 / 5 returned', '3 / 5 returned'], ['1 / 5 returned', '4 / 5 returned']];

  const COL_X = P ? [-1.85, 1.85] : [-3.1, 0.2];
  const ROW_Y = P ? [0.75, -1.85] : [0.22, -1.62];
  const CW = P ? 3.52 : 3.04;
  const CH = P ? 1.72 : 1.56;
  const RAD = P ? 0.21 : 0.18;
  const DOT_DX = P ? 0.60 : 0.51;

  function buildGrid() {
    const colHdrA = T('Prompt A (Quiz)', P ? 18 : 19, C.cyan, false, true);
    colHdrA.moveTo([COL_X[0], P ? 2.4 : 1.28, 0]);
    const colHdrB = T('Prompt B (Reminder)', P ? 18 : 19, C.amber, false, true);
    colHdrB.moveTo([COL_X[1], P ? 2.4 : 1.28, 0]);

    const cells = [[null, null], [null, null]];
    const dots = [[null, null], [null, null]];
    const cnts = [[null, null], [null, null]];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const cx = COL_X[c], cy = ROW_Y[r];
        const box = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
        box.setFill(C.card, 0.92); box.moveTo([cx, cy, 0]);
        cells[r][c] = box;
        dots[r][c] = DATA[r][c].map((st, k) => learnerIcon(cx + (k - 2) * DOT_DX, cy + (P ? 0.06 : 0.08), st, RAD));
        const ct = T(COUNTS[r][c], P ? 16 : 16, C.ink, true);
        ct.moveTo([cx, cy - CH / 2 + 0.28, 0]);
        cnts[r][c] = ct;
      }
    }

    let rowHdr0, rowHdr1;
    if (P) {
      rowHdr0 = T('Studied today (10 learners)', 17, C.ink, false, true);
      rowHdr0.moveTo([0, 1.85, 0]);
      rowHdr1 = T('Did not study (10 learners)', 17, C.ink, false, true);
      rowHdr1.moveTo([0, -0.75, 0]);
    } else {
      const r0a = T('Studied', 17, C.ink, false, true); r0a.moveTo([-5.55, ROW_Y[0] + 0.18, 0]);
      const r0b = T('today', 17, C.ink, false, true); r0b.moveTo([-5.55, ROW_Y[0] - 0.16, 0]);
      rowHdr0 = new M.VGroup(r0a, r0b);
      const r1a = T('Did not', 17, C.ink, false, true); r1a.moveTo([-5.55, ROW_Y[1] + 0.18, 0]);
      const r1b = T('study', 17, C.ink, false, true); r1b.moveTo([-5.55, ROW_Y[1] - 0.16, 0]);
      rowHdr1 = new M.VGroup(r1a, r1b);
    }

    const legY = P ? -3.1 : -2.76;
    const leg1 = learnerIcon(CX - (P ? 2.1 : 2.3), legY, 1, 0.13);
    const leg1T = T('returned (1)', 15, C.green); leg1T.moveTo([CX - (P ? 1.05 : 1.25), legY, 0]);
    const leg0 = learnerIcon(CX + (P ? 0.55 : 0.5), legY, 0, 0.13);
    const leg0T = T('did not (0)', 15, C.muted); leg0T.moveTo([CX + (P ? 1.55 : 1.5), legY, 0]);
    const legend = new M.VGroup(leg1, leg1T, leg0, leg0T);

    const frame = new M.VGroup(colHdrA, colHdrB, cells[0][0], cells[0][1], cells[1][0], cells[1][1], legend);
    return { frame, cells, dots, cnts, rowHdrs: [rowHdr0, rowHdr1] };
  }

  function cellOutline(r, c, color) {
    const box = new M.RoundedRectangle({ width: CW + 0.08, height: CH + 0.08, cornerRadius: 0.16, color, strokeWidth: 3.5 });
    box.setFill(color, 0.06); box.moveTo([COL_X[c], ROW_Y[r], 0]);
    return box;
  }

  function cellDim(r, c) {
    const dim = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: C.line, strokeWidth: 1 });
    dim.setFill(C.bg, 0.45); dim.moveTo([COL_X[c], ROW_Y[r], 0]);
    return dim;
  }

  function cellTag(r, c, label, color, alignRight = false) {
    const t = pill(label, color, P ? 15 : 15);
    const dx = alignRight ? (CW / 2 - 0.58) : (-CW / 2 + 0.68);
    t.moveTo([COL_X[c] + dx, ROW_Y[r] + CH / 2 - 0.25, 0]);
    return t;
  }

  let g1 = buildGrid();
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(appCard, cardA, cardB, ctxSA, arrNewA, ctxNB, arrNewB)),
    new M.FadeIn(g1.frame), ...fbox([['Recorded results:', C.ink], ['20 learners', C.cyan], ['old rule: random', C.muted]], C.cyan), ...say('RECORDED RESULTS: 20 LEARNERS'));

  await until(S(7));
  await play(new M.FadeIn(g1.rowHdrs[0]), ...say('10 LEARNERS STUDIED TODAY', C.cyan));

  await until(S(8));
  await play(new M.LaggedStart(g1.dots[0][0].map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(g1.cnts[0][0]), ...say('STUDIED + A: 4 OF 5 RETURNED', C.green));

  await until(S(9));
  await play(new M.LaggedStart(g1.dots[0][1].map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(g1.cnts[0][1]), ...say('STUDIED + B: 3 OF 5 RETURNED', C.amber));

  const wait10 = [0, 1].map(c => { const t = T(c === 0 ? '5 learners got A' : '5 learners got B', P ? 16 : 15, C.muted); t.moveTo([COL_X[c], ROW_Y[1], 0]); return t; });
  await until(S(10));
  await play(new M.FadeIn(g1.rowHdrs[1]), new M.FadeIn(wait10[0]), new M.FadeIn(wait10[1]), ...say('10 LEARNERS DID NOT STUDY', C.muted));

  await until(S(11));
  await play(new M.FadeOut(wait10[0], { runTime: 0.3 }), new M.LaggedStart(g1.dots[1][0].map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(g1.cnts[1][0]), ...say('NO STUDY + A: 1 OF 5 RETURNED', C.cyan));

  await until(S(12));
  await play(new M.FadeOut(wait10[1], { runTime: 0.3 }), new M.LaggedStart(g1.dots[1][1].map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.FadeIn(g1.cnts[1][1]), ...say('NO STUDY + B: 4 OF 5 RETURNED', C.green));

  // ---- ACT 3: Matching choices & half-a-class intuition (Sentences 13 - 22) ----
  await until(S(13));
  await play(...fbox(['new rule:', ['  studied → A', C.cyan], ['  no study → B', C.amber]], C.violet),
    ...say('MARK CHOICES THAT MATCH NEW RULE', C.violet));

  const hi00 = cellOutline(0, 0, C.cyan);
  const tagM00 = cellTag(0, 0, 'MATCH', C.cyan);
  await until(S(14));
  await play(new M.Create(hi00), new M.FadeIn(tagM00), ...say('KEEP: STUDIED TODAY + A', C.cyan));

  const hi11 = cellOutline(1, 1, C.amber);
  const tagM11 = cellTag(1, 1, 'MATCH', C.amber);
  await until(S(15));
  await play(new M.Create(hi11), new M.FadeIn(tagM11), ...say('KEEP: DID NOT STUDY + B', C.amber));

  const dim01 = cellDim(0, 1);
  const dim10 = cellDim(1, 0);
  const tagS01 = cellTag(0, 1, 'NO MATCH', C.muted);
  const tagS10 = cellTag(1, 0, 'NO MATCH', C.muted);
  await until(S(16));
  await play(new M.FadeIn(dim01), new M.FadeIn(dim10), new M.FadeIn(tagS01), new M.FadeIn(tagS10),
    ...say('NEW RULE NEVER MAKES THESE CHOICES', C.muted));

  await until(S(17));
  await play(...fbox(['matching learners:', ['  5 + 5 = 10', C.amber], ['  half of 20', C.muted]], C.amber),
    ...say('ONLY HALF OF THE 20 LEARNERS MATCH', C.amber));

  // Class analogy: 10 students, 5 selected at random -> count each twice
  const classY = P ? -1.4 : -0.5;
  const classGap = P ? 0.72 : 0.92;
  const selStudents = Array.from({ length: 5 }, (_, k) => studentIcon((k - 2) * classGap, classY + 0.8, C.cyan));
  const unselStudents = Array.from({ length: 5 }, (_, k) => studentIcon((k - 2) * classGap, classY - 0.8, C.muted));
  const selLbl = T('selected half (5)', 18, C.cyan, false, true); selLbl.moveTo([0, classY + 1.55, 0]);
  const unselLbl = T('not asked (5)', 18, C.muted); unselLbl.moveTo([0, classY - 1.55, 0]);

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(
      g1.frame, g1.rowHdrs[0], g1.rowHdrs[1], ...g1.dots.flat(2), ...g1.cnts.flat(),
      hi00, hi11, tagM00, tagM11, dim01, dim10, tagS01, tagS10
    )),
    ...clearBox(),
    new M.LaggedStart(selStudents.map(s => new M.FadeIn(s)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.LaggedStart(unselStudents.map(s => new M.FadeIn(s)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(selLbl), new M.FadeIn(unselLbl),
    ...say('HALF A CLASS SELECTED AT RANDOM', C.cyan)
  );

  // Count each selected answer twice
  const dupStudents = Array.from({ length: 5 }, (_, k) => studentIcon((k - 2) * classGap, classY - 0.8, C.amber));
  const x2Tags = Array.from({ length: 5 }, (_, k) => {
    const t = T('×2', 17, C.amber, true, true); t.moveTo([(k - 2) * classGap, classY + 0.15, 0]); return t;
  });

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...unselStudents, unselLbl)),
    new M.LaggedStart(dupStudents.map(s => new M.FadeIn(s)), { lagRatio: 0.12, runTime: 1.2 }),
    new M.LaggedStart(x2Tags.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.9 }),
    ...fbox(['5 selected = half', ['count each × 2', C.amber], ['→ estimate whole class', C.green]], C.amber),
    ...say('COUNT EACH SELECTED ANSWER TWICE (×2)', C.amber)
  );

  // Bring back fresh 2x2 table with matches highlighted
  const g2 = buildGrid();
  const hi00b = cellOutline(0, 0, C.cyan);
  const hi11b = cellOutline(1, 1, C.amber);
  const dim01b = cellDim(0, 1);
  const dim10b = cellDim(1, 0);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...selStudents, ...dupStudents, ...x2Tags, selLbl)),
    ...clearBox(),
    new M.FadeIn(g2.frame), new M.FadeIn(g2.rowHdrs[0]), new M.FadeIn(g2.rowHdrs[1]),
    new M.FadeIn(new M.VGroup(...g2.dots.flat(2), ...g2.cnts.flat())),
    new M.FadeIn(hi00b), new M.FadeIn(hi11b), new M.FadeIn(dim01b), new M.FadeIn(dim10b),
    ...say('SAME IDEA FOR RECORDED RESULTS', C.cyan)
  );

  await until(S(21));
  await play(...fbox([['policy', C.violet], 'a rule for choosing', 'which prompt to show'], C.violet),
    ...say('POLICY = A RULE FOR CHOOSING ACTIONS', C.violet));

  await until(S(22));
  await play(...fbox([['off-policy evaluation', C.cyan], 'estimate a new policy', 'using old policy data'], C.cyan),
    ...say('OFF-POLICY EVALUATION', C.cyan));

  // ---- ACT 4: Weights (Sentences 23 - 28) ----
  const wQ = [
    [cellTag(0, 0, 'w = ?', C.amber, true), cellTag(0, 1, 'w = ?', C.muted, true)],
    [cellTag(1, 0, 'w = ?', C.muted, true), cellTag(1, 1, 'w = ?', C.amber, true)],
  ];

  await until(S(23));
  await play(
    new M.FadeIn(wQ[0][0]), new M.FadeIn(wQ[0][1]), new M.FadeIn(wQ[1][0]), new M.FadeIn(wQ[1][1]),
    ...fbox(['give each result a number:', ['how much to count it', C.amber]], C.amber),
    ...say('HOW MUCH TO COUNT EACH RESULT?', C.amber)
  );

  await until(S(24));
  await play(new M.Indicate(wQ[0][0], { color: C.amber, runTime: 0.65 }),
    new M.Indicate(wQ[1][1], { color: C.amber, runTime: 0.65 }),
    ...say('THIS NUMBER IS CALLED A WEIGHT', C.amber));

  await until(S(25));
  await play(...fbox(['original policy:', ['  chance of A = 50%', C.cyan], ['  chance of B = 50%', C.amber]], C.muted),
    ...say('ORIGINAL POLICY: 50% CHANCE EACH', C.muted));

  await until(S(26));
  await play(new M.Indicate(hi00b, { color: C.green }), new M.Indicate(hi11b, { color: C.green }),
    ...fbox(['original chance = 50%', ['new match       = 100%', C.green], ['non-match       = 0%', C.muted]], C.green),
    ...say('NEW POLICY: 100% FOR MATCHING PROMPT', C.green));

  const w2_00 = cellTag(0, 0, 'w = 2', C.green, true);
  const w2_11 = cellTag(1, 1, 'w = 2', C.green, true);
  await until(S(27));
  await play(new M.FadeOut(wQ[0][0]), new M.FadeOut(wQ[1][1]), new M.FadeIn(w2_00), new M.FadeIn(w2_11),
    ...fbox(['matching choice:', ['  100% ÷ 50% = 2', C.amber], ['  weight = 2', C.green]], C.green),
    ...say('MATCHING CHOICES: WEIGHT = 2', C.green));

  const w0_01 = cellTag(0, 1, 'w = 0', C.muted, true);
  const w0_10 = cellTag(1, 0, 'w = 0', C.muted, true);
  await until(S(28));
  await play(new M.FadeOut(wQ[0][1]), new M.FadeOut(wQ[1][0]), new M.FadeIn(w0_01), new M.FadeIn(w0_10),
    ...fbox(['non-matching choice:', ['  0% ÷ 50% = 0', C.muted], ['  weight = 0', C.muted]], C.muted),
    ...say('NON-MATCHING CHOICES: WEIGHT = 0', C.muted));

  // ---- ACT 5: Step-by-step calculation across the 4 groups (Sentences 29 - 41) ----
  await until(S(29));
  await play(...fbox(['for each of the 4 groups:', ['returns × weight', C.amber]], C.cyan),
    ...say('CALCULATE EACH OF THE 4 GROUPS', C.cyan));

  await until(S(30));
  await play(
    new M.LaggedStart(g2.dots[0][0].slice(0, 4).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.12, runTime: 1.1 }),
    ...fbox(['Studied + A:', ['  4 learners return', C.green]], C.cyan),
    ...say('STUDIED + A: 4 RETURNS', C.cyan)
  );

  const res00 = cellTag(0, 0, '4×2 = 8', C.amber, false);
  await until(S(31));
  await play(new M.FadeIn(res00),
    ...fbox(['Studied + A:', '  4 returns × weight 2', ['  weighted reward = 8', C.amber]], C.amber),
    ...say('4 × 2 = 8 WEIGHTED REWARD', C.amber));

  await until(S(32));
  await play(new M.Indicate(w0_01, { color: C.muted }),
    ...fbox(['Studied + B:', ['  weight = 0', C.muted]], C.muted),
    ...say('STUDIED + B: WEIGHT = 0', C.muted));

  const res01 = cellTag(0, 1, '3×0 = 0', C.muted, false);
  await until(S(33));
  await play(new M.FadeIn(res01),
    ...fbox(['Studied + B:', '  3 returns × weight 0', ['  weighted reward = 0', C.muted]], C.muted),
    ...say('WEIGHTED REWARD = 0', C.muted));

  await until(S(34));
  await play(new M.Indicate(w0_10, { color: C.muted }),
    ...fbox(['Did not study + A:', ['  weight = 0', C.muted]], C.muted),
    ...say('DID NOT STUDY + A: WEIGHT = 0', C.muted));

  const res10 = cellTag(1, 0, '1×0 = 0', C.muted, false);
  await until(S(35));
  await play(new M.FadeIn(res10, { runTime: 0.65 }),
    ...fbox(['Did not study + A:', '  1 return × weight 0', ['  weighted reward = 0', C.muted]], C.muted),
    ...say('WEIGHTED REWARD = 0', C.muted));

  await until(S(36));
  await play(
    new M.LaggedStart(g2.dots[1][1].slice(0, 4).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.12, runTime: 1.1 }),
    ...fbox(['Did not study + B:', ['  4 learners return', C.green]], C.amber),
    ...say('DID NOT STUDY + B: 4 RETURNS', C.amber)
  );

  const res11 = cellTag(1, 1, '4×2 = 8', C.amber, false);
  await until(S(37));
  await play(new M.FadeIn(res11),
    ...fbox(['Did not study + B:', '  4 returns × weight 2', ['  weighted reward = 8', C.amber]], C.amber),
    ...say('4 × 2 = 8 WEIGHTED REWARD', C.amber));

  await until(S(38));
  await play(
    new M.LaggedStart([res00, res01, res10, res11].map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox(['total weighted reward:', '  8 + 0 + 0 + 8', ['  = 16', C.amber]], C.amber),
    ...say('8 + 0 + 0 + 8 = 16', C.amber)
  );

  await until(S(39));
  await play(...fbox(['total reward = 16', 'all learners = 20', ['16 ÷ 20 = 0.80', C.green]], C.green),
    ...say('DIVIDE 16 BY ALL 20 LEARNERS', C.green));

  await until(S(40));
  await play(new M.Indicate(hi00b, { color: C.green }), new M.Indicate(hi11b, { color: C.green }),
    ...fbox(['new policy (A / B):', '  16 ÷ 20 = 0.80', ['  estimate = 80%', C.green]], C.green),
    ...say('NEW POLICY ESTIMATE: 80%', C.green));

  // Compare with "always choose B"
  const hi01B = cellOutline(0, 1, C.amber);
  await until(S(41));
  await play(new M.Create(hi01B),
    ...fbox(['always choose B:', '  (3 + 4) × 2 = 14', '  14 ÷ 20 = 70%', ['new rule: 80% > 70%', C.green]], C.amber),
    ...say('ALWAYS B: 70%   VS   NEW RULE: 80%', C.amber));

  // ---- ACT 6: Two short rules & name (Sentences 42 - 46) ----
  await until(S(42));
  await play(new M.FadeOut(hi01B), ...say('TWO SHORT RULES', C.cyan));

  await until(S(43));
  await play(...fbox([['1. weight =', C.amber], '   new chance', '   ÷ original chance'], C.amber),
    ...say('WEIGHT = NEW CHANCE ÷ ORIGINAL CHANCE', C.amber));

  await until(S(44));
  await play(...fbox([['1. weight = new ÷ old', C.muted], ['2. estimate =', C.green], '   weighted total', '   ÷ all learners'], C.green),
    ...say('ESTIMATE = WEIGHTED TOTAL ÷ LEARNERS', C.green));

  await until(S(45));
  await play(...fbox([['inverse propensity', C.violet], ['weighting', C.violet], 'propensity = chance of', 'choosing that action'], C.violet),
    ...say('INVERSE PROPENSITY WEIGHTING', C.violet));

  await until(S(46));
  await play(new M.Indicate(res00, { color: C.green }), new M.Indicate(res11, { color: C.green }),
    ...say('TEST POLICIES BEFORE REAL LEARNERS', C.green));

  // ---- ACT 7: Overlap trap, small chances & recap (Sentences 47 - 54) ----
  const missCover = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: C.pink, strokeWidth: 3 });
  missCover.setFill(C.bg, 0.96); missCover.moveTo([COL_X[0], ROW_Y[0], 0]);
  const qDots = Array.from({ length: 5 }, (_, k) => learnerIcon(COL_X[0] + (k - 2) * DOT_DX, ROW_Y[0] + (P ? 0.06 : 0.08), -1, RAD));
  const missLbl = T('0% chance · no data', 15, C.pink, true);
  missLbl.moveTo([COL_X[0], ROW_Y[0] - CH / 2 + 0.28, 0]);
  const missGroup = new M.VGroup(missCover, ...qDots, missLbl);

  await until(S(47));
  await play(new M.FadeIn(missGroup),
    ...fbox(['TRAP: missing choice', ['old chance(A|studied)', C.pink], ['  = 0%', C.pink]], C.pink),
    ...say('WHAT IF OLD POLICY NEVER CHOSE A?', C.pink));

  await until(S(48));
  await play(new M.Indicate(missGroup, { color: C.pink }),
    ...say('NO RECORDED RESULTS FOR STUDIED + A', C.pink));

  await until(S(49));
  await play(new M.Indicate(w2_11, { color: C.muted }),
    ...fbox(['cannot divide by 0%', ['other weights cannot', C.pink], ['fill a missing group', C.pink]], C.pink),
    ...say('WEIGHTS CANNOT FILL MISSING DATA', C.pink));

  const ov00 = cellTag(0, 0, 'chance > 0%', C.green, false);
  const ov11 = cellTag(1, 1, 'chance > 0%', C.green, false);
  await until(S(50));
  await play(new M.FadeOut(missGroup), new M.FadeOut(res00), new M.FadeOut(res11),
    new M.FadeIn(ov00), new M.FadeIn(ov11),
    ...fbox(['every choice the new', 'policy can make needs:', ['  original chance > 0%', C.green]], C.green),
    ...say('EVERY CHOICE NEEDS CHANCE > 0%', C.green));

  await until(S(51));
  await play(new M.Indicate(ov00, { color: C.violet, runTime: 0.65 }),
    new M.Indicate(ov11, { color: C.violet, runTime: 0.65 }),
    ...say('THIS REQUIREMENT IS OVERLAP', C.violet));

  await until(S(52));
  await play(...fbox(['two requirements:', ['1. overlap (chance > 0%)', C.green], ['2. know original chances', C.cyan]], C.cyan),
    ...say('MUST KNOW ORIGINAL PROBABILITIES', C.cyan));

  const bigW = cellTag(0, 0, 'w = 20!', C.pink, true);
  await until(S(53));
  await play(new M.FadeOut(w2_00), new M.FadeIn(bigW), new M.Indicate(bigW, { color: C.pink }),
    ...fbox(['if original chance = 5%:', ['  weight = 100% ÷ 5% = 20', C.pink], 'one learner swings the', 'estimate wildly!'], C.pink),
    ...say('SMALL CHANCE → HUGE, UNSTABLE WEIGHT', C.pink));

  const w2_00Final = cellTag(0, 0, 'w = 2', C.green, true);
  await until(S(54));
  await play(new M.FadeOut(bigW), new M.FadeOut(ov00), new M.FadeOut(ov11), new M.FadeIn(w2_00Final),
    ...fbox([['off-policy evaluation', C.cyan], 'weighted past results', ['→ estimate (80%)', C.green], ['not a guarantee', C.amber]], C.amber),
    ...say('WEIGHTED PAST DATA → ESTIMATE, NOT GUARANTEE', C.amber));
}
