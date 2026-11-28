// 21.1.7 Hybrid retrieval: fuse word search and meaning search by position (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [5.0, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // two ranked lists side by side; the points column sits beside them (laptop) or below them (phone)
  const LX = P ? -1.95 : -5.35, RX = P ? 1.95 : -2.15, HY = P ? 1.3 : 1.25;
  const RO = P ? -1.3 : -1.05, CO = P ? -0.15 : 0.1, PO = P ? 1.05 : 1.2;
  const CW = P ? 1.15 : 1.25, CH = 0.48;
  const rowY = r => (P ? 0.6 : 0.55) - r * (P ? 0.8 : 0.85);
  const cardP = (x, r) => [x + CO, rowY(r), 0];
  const FCX = P ? -2.6 : 0.3, FB = P ? -1.9 : 1.0, BS = P ? 1.6 : 0.7;
  const FHX = P ? 0 : 1.0, FHY = P ? -1.9 : 1.25;
  const fusY = i => (P ? -2.5 : 0.55) - i * 0.6;

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 3.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // page cards: page 4 amber, page 5 cyan, the others soft white
  const pcol = n => n === 4 ? C.amber : n === 5 ? C.cyan : C.ink;
  function card(n, p) {
    const col = pcol(n);
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(col, 0.14); r.moveTo(p);
    const t = T(`PAGE ${n}`, P ? 15 : 16, col, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  }
  const chip = (x, r, s, col = C.green) => { const t = T(s, P ? 15 : 16, col, true, true); t.moveTo([x + PO, rowY(r), 0]); return t; };
  const simple = ['+1', '+1/2', '+1/3'];

  // fused rows: card + bar (length = points) + points label
  function frow(n, i, pts, label) {
    const col = pcol(n), y = fusY(i), w = Math.max(0.04, pts * BS);
    const c = card(n, [FCX, y, 0]);
    const bar = new M.Rectangle({ width: w, height: 0.26, color: col, strokeWidth: 1 }); bar.setFill(col, 0.82); bar.moveTo([FB + w / 2, y, 0]);
    const lab = T(label, P ? 16 : 17, col, true, true); lab.moveTo([FB + w + 0.15 + lab.getWidth() / 2, y, 0]);
    return { n, c, bar, lab, pts, label };
  }
  const showRow = r => [new M.FadeIn(r.c), new M.Create(r.bar), new M.FadeIn(r.lab)];
  function moveRow(r, i, pts = r.pts, label = r.label) {
    const t = frow(r.n, i, pts, label);
    // the page card is swapped (old fades out, new one fades in at its new row) so its PAGE name always travels with its bar
    const a = [new M.FadeOut(r.c), new M.FadeIn(t.c), new M.Transform(r.bar, t.bar), new M.ReplacementTransform(r.lab, t.lab)];
    r.c = t.c; r.lab = t.lab; r.pts = pts; r.label = label;
    return a;
  }

  // 0-2 the question, the room code, the page with the answer
  const Y0 = P ? 0.3 : 0, ix = P ? -1.3 : -1.6;
  const head = new M.Circle({ radius: 0.2, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([ix, Y0 + 0.5, 0]);
  const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([ix, Y0 + 0.03, 0]);
  const visitor = new M.VGroup(head, body);
  await until(S(0)); await play(new M.FadeIn(visitor), ...say('“CAN I BOOK R12 FOR MY STUDY GROUP?”', C.amber));

  const roomP = [P ? 1.3 : 1.6, Y0, 0];
  const room = new M.Rectangle({ width: 1.6, height: 1.1, color: C.cyan, strokeWidth: 2 }); room.setFill(C.cyan, 0.1); room.moveTo(roomP);
  const roomT = T('R12', 26, C.cyan, true, true); roomT.moveTo(roomP);
  const roomN = T('study room', 16, C.muted); roomN.moveTo([roomP[0], Y0 - 0.85, 0]);
  await until(S(1)); await play(new M.FadeIn(room), new M.FadeIn(roomT), new M.FadeIn(roomN), ...say('R12 = A ROOM CODE'));

  const poolP = k => P ? [(k % 3 - 1) * 1.5, 0.7 - Math.floor(k / 3) * 0.8, 0] : [(k - 2.5) * 1.6, 0.3, 0];
  const pool = [1, 2, 3, 4, 5, 6].map((n, k) => card(n, poolP(k)));
  const ansY = P ? -1.0 : -0.6;
  const ans1 = T('Group study rooms R12 and R14', P ? 17 : 20, C.cyan); ans1.moveTo([0, ansY, 0]);
  const ans2 = T('hold six people.', P ? 17 : 20, C.cyan); ans2.moveTo([0, ansY - 0.45, 0]);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(visitor, room, roomT, roomN)),
    new M.LaggedStart(pool.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.4 }), ...say('THE ANSWER IS ON PAGE 5'));
  await play(new M.Indicate(pool[4], { color: C.cyan }), new M.FadeIn(ans1), new M.FadeIn(ans2));

  // 3 two empty top-3 lists
  const header = (x, a, b, col) => {
    const t1 = T(a, P ? 16 : 18, col, true, true); t1.moveTo([x, HY, 0]);
    const t2 = T(b, P ? 13 : 14, C.muted, true); t2.moveTo([x, HY - 0.3, 0]);
    return [t1, t2];
  };
  const wHead = header(LX, 'WORD SEARCH', 'BM25', C.cyan), mHead = header(RX, 'MEANING SEARCH', 'embeddings', C.violet);
  const frame = [], rankL = [];
  for (const x of [LX, RX]) for (let r = 0; r < 3; r++) {
    const o = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color: C.muted, strokeWidth: 1 });
    o.setStrokeOpacity(0.5); o.moveTo(cardP(x, r)); frame.push(o);
    const t = T(['1st', '2nd', '3rd'][r], P ? 15 : 16, C.muted, true); t.moveTo([x + RO, rowY(r), 0]); rankL.push(t);
  }
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...pool, ans1, ans2)),
    new M.LaggedStart([...wHead, ...mHead, ...frame, ...rankL].map(o => new M.FadeIn(o)), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('BOTH SEARCHES: KEEP THE TOP 3 PAGES'));

  // 4-5 word search: 5, 3, 4
  let wCards = [5, 3, 4].map((n, r) => card(n, cardP(LX, r)));
  await until(S(4)); await play(new M.FadeIn(wCards[0]), ...say('BM25 SEES THE RARE CODE R12'));
  await until(S(5)); await play(new M.LaggedStart([new M.FadeIn(wCards[1]), new M.FadeIn(wCards[2])], { lagRatio: 0.5, runTime: 1.4 }));

  // 6-9 meaning search: 2, 5, 1
  let mCards = [2, 5, 1].map((n, r) => card(n, cardP(RX, r)));
  await until(S(6)); await play(new M.FadeIn(mCards[0]), ...say('MEANING SEARCH: PAGE 2 FIRST', C.violet));
  await until(S(7)); await play(new M.Indicate(mCards[0], { color: C.violet }), ...say('“BOOK” PULLS TOWARD BORROWING BOOKS', C.violet));
  await until(S(8)); await play(...say('TO THE EMBEDDING, R12 ≈ NOTHING', C.muted));
  await until(S(9)); await play(new M.LaggedStart([new M.FadeIn(mCards[1]), new M.FadeIn(mCards[2])], { lagRatio: 0.5, runTime: 1.4 }));

  // 10-11 two winners; scores cannot be added
  await until(S(10)); await play(new M.Indicate(wCards[0], { color: C.amber }), new M.Indicate(mCards[0], { color: C.amber }), ...say('TWO LISTS, TWO WINNERS: TRUST WHICH?', C.amber));
  const scores = ['6.56', '1.42', '0.96'].map((s, r) => chip(LX, r, s, C.cyan));
  const wNote = T('BM25 score', 14, C.muted); wNote.moveTo([LX, rowY(2) - 0.6, 0]);
  const mNote = T('similarity, 0 to 1', 14, C.muted); mNote.moveTo([RX, rowY(2) - 0.6, 0]);
  await until(S(11));
  await play(new M.LaggedStart([...scores, wNote, mNote].map(o => new M.FadeIn(o)), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox([['BM25 score + similarity = ?', C.pink], ['like minutes + metres', C.muted]], C.pink), ...say('CANNOT ADD: DIFFERENT UNITS', C.pink));

  // 12-14 positions
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(...scores, wNote, mNote)), ...boxOut(),
    new M.LaggedStart(rankL.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('BOTH LISTS HAVE POSITIONS: 1ST, 2ND, 3RD', C.amber));
  const dash = [0, 1, 2].map(r => new M.DashedLine({ start: [LX + CO + CW / 2 + 0.1, rowY(r), 0], end: [RX + RO - 0.3, rowY(r), 0], color: C.amber }));
  await until(S(13)); await play(new M.LaggedStart(dash.map(d => new M.Create(d)), { lagRatio: 0.3, runTime: 1.2 }), ...say('POSITIONS COMPARE ACROSS LISTS', C.amber));
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...dash)), new M.Indicate(wCards[0], { color: C.green }), new M.Indicate(mCards[1], { color: C.green }), ...say('NEAR THE TOP OF BOTH → GOOD PAGE', C.green));

  // 15-16 points for positions
  let wChips = [0, 1, 2].map(r => chip(LX, r, simple[r])), mChips = [0, 1, 2].map(r => chip(RX, r, simple[r]));
  await until(S(15));
  await play(...say('POINTS FOR POSITIONS', C.green), ...fbox(['1st place → 1', '2nd place → 1/2', '3rd place → 1/3'], C.green),
    new M.LaggedStart([0, 1, 2].flatMap(r => [new M.FadeIn(wChips[r]), new M.FadeIn(mChips[r])]), { lagRatio: 0.5, runTime: Math.max(2, E(15) - S(15) - 0.6) }));
  const fusHead = T('POINTS', P ? 16 : 18, C.green, true, true); fusHead.moveTo([FHX, FHY, 0]);
  await until(S(16)); await play(new M.FadeIn(fusHead), ...fbox(['points =', 'word list + meaning list', ['missing from a list → 0', C.muted]], C.green), ...say('MISSING FROM A LIST → 0 POINTS', C.muted));

  // 17-19 add up each page (rows in page order 1..5)
  const rows = {};
  await until(S(17));
  await play(new M.Indicate(wChips[0], { color: C.amber }), new M.Indicate(mChips[1], { color: C.amber }), ...fbox(['page 5 = 1 + 1/2', ['       = 1.5', C.amber]]));
  rows[5] = frow(5, 4, 1.5, '1.5');
  await play(...showRow(rows[5]));
  await until(S(18));
  await play(new M.Indicate(mChips[0], { color: C.amber }), ...fbox(['page 2 = 0 + 1', ['       = 1', C.amber]]));
  rows[2] = frow(2, 1, 1, '1');
  await play(...showRow(rows[2]));
  await until(S(19));
  await play(new M.LaggedStart([wChips[1], wChips[2], mChips[2]].map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.4, runTime: 1.4 }),
    ...fbox(['page 3 = 1/2', 'page 4 = 1/3', 'page 1 = 1/3']));
  rows[3] = frow(3, 2, 1 / 2, '1/2'); rows[4] = frow(4, 3, 1 / 3, '1/3'); rows[1] = frow(1, 0, 1 / 3, '1/3');
  await play(new M.LaggedStart([...showRow(rows[3]), ...showRow(rows[4]), ...showRow(rows[1])], { lagRatio: 0.3, runTime: 2.4 }));

  // 20 sort by points
  const sorted = [5, 2, 3, 4, 1];
  await until(S(20));
  await play(...sorted.flatMap((n, i) => moveRow(rows[n], i)), ...say('SORT BY POINTS', C.amber));
  await play(new M.Indicate(rows[5].c, { color: C.amber }), new M.Indicate(rows[5].bar, { color: C.amber }), ...say('PAGE 5 WINS: 1.5', C.amber));

  // 21-23 the names
  await until(S(21)); await play(new M.LaggedStart(sorted.map(n => new M.Indicate(rows[n].c, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('FUSION = JOINING RANKINGS INTO ONE', C.green));
  await until(S(22)); await play(...fbox(['points = 1 ÷ position', ['reciprocal = one over', C.muted]], C.green), ...say('RECIPROCAL RANK FUSION', C.green));
  await until(S(23)); await play(new M.Indicate(wHead[0], { color: C.cyan }), new M.Indicate(mHead[0], { color: C.violet }), ...say('WORD + MEANING = HYBRID RETRIEVAL'));

  // 24-26 the usual constant 60
  await until(S(24)); await play(...fbox(['points =', '1 ÷ (60 + position)', ['60 = a fixed number', C.muted]], C.violet), ...say('REAL SYSTEMS ADD A FIXED NUMBER: 60', C.violet));
  const k60 = ['+1/61', '+1/62', '+1/63'];
  const wNew = [0, 1, 2].map(r => chip(LX, r, k60[r], C.violet)), mNew = [0, 1, 2].map(r => chip(RX, r, k60[r], C.violet));
  await until(S(25));
  await play(...[0, 1, 2].flatMap(r => [new M.ReplacementTransform(wChips[r], wNew[r]), new M.ReplacementTransform(mChips[r], mNew[r])]),
    ...fbox(['1st → 1/61 ≈ 0.0164', '2nd → 1/62 ≈ 0.0161', '3rd → 1/63 ≈ 0.0159'], C.violet), ...say('GENTLER GAPS BETWEEN PLACES', C.violet));
  wChips = wNew; mChips = mNew;
  const v60 = { 5: 1 / 61 + 1 / 62, 2: 1 / 61, 3: 1 / 62, 4: 1 / 63, 1: 1 / 63 };
  const l60 = { 5: '0.0325', 2: '0.0164', 3: '0.0161', 4: '0.0159', 1: '0.0159' };
  await until(S(26));
  await play(...sorted.flatMap((n, i) => moveRow(rows[n], i, v60[n] / v60[5] * 1.5, l60[n])),
    ...fbox(['page 5 = 1/61 + 1/62', ['       ≈ 0.0325', C.amber], 'page 2 = 1/61 ≈ 0.0164'], C.violet), ...say('PAGE 5 STILL WINS', C.amber));

  // 27-28 in words, and what it is for
  await until(S(27)); await play(...fbox(['fused score = sum over lists', ['of 1 ÷ position', C.amber]]), ...say('ADD UP 1 ÷ POSITION FROM EACH LIST', C.amber));
  await until(S(28)); await play(new M.Indicate(wHead[0], { color: C.green }), new M.Indicate(mHead[0], { color: C.green }), ...say('EXACT CODES + DIFFERENT WORDING', C.green));

  // 29-34 the trap: the novel question
  await until(S(29));
  await play(new M.FadeOut(new M.VGroup(...wCards, ...mCards, ...wChips, ...mChips, ...sorted.flatMap(n => [rows[n].c, rows[n].bar, rows[n].lab]))),
    ...boxOut(), ...say('TRAP: IN BOTH LISTS ≠ RIGHT PAGE', C.pink));
  await until(S(30)); await play(...say('“BRING A NOVEL BACK AFTER THE DEADLINE?”', C.amber));
  wCards = [2, 3, 6].map((n, r) => card(n, cardP(LX, r))); mCards = [4, 1, 2].map((n, r) => card(n, cardP(RX, r)));
  wChips = [0, 1, 2].map(r => chip(LX, r, simple[r])); mChips = [0, 1, 2].map(r => chip(RX, r, simple[r]));
  await until(S(31));
  await play(new M.LaggedStart([0, 1, 2].flatMap(r => [new M.FadeIn(wCards[r]), new M.FadeIn(wChips[r])])
    .concat([0, 1, 2].flatMap(r => [new M.FadeIn(mCards[r]), new M.FadeIn(mChips[r])])), { lagRatio: 0.3, runTime: Math.max(3, E(31) - S(31) - 0.6) }));
  await until(S(32));
  await play(new M.Indicate(wChips[0], { color: C.pink }), new M.Indicate(mChips[2], { color: C.pink }), ...fbox(['page 2 = 1 + 1/3', ['       ≈ 1.33', C.amber]], C.pink));
  const t2 = frow(2, 0, 4 / 3, '1.33');
  await play(...showRow(t2));
  await until(S(33));
  await play(new M.Indicate(mChips[0], { color: C.green }), ...fbox(['page 4 = 0 + 1', ['       = 1', C.amber], ['the right page', C.green]], C.green));
  const t4 = frow(4, 1, 1, '1');
  await play(...showRow(t4));
  await until(S(34)); await play(new M.Indicate(t2.c, { color: C.pink }), new M.Indicate(t2.bar, { color: C.pink }), ...say('PAGE 2 WINS: FIRST IN ONE, STILL IN THE OTHER', C.pink));

  // 35-37 limits, next lesson, summary
  await until(S(35)); await play(new M.LaggedStart(rankL.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('FUSION ONLY SEES POSITIONS', C.muted));
  await until(S(36)); await play(...say('NEXT: A CAREFUL READER', C.violet));
  await until(S(37)); await play(...fbox(P ? ['hybrid = word + meaning search', ['fused by points for positions', C.amber]] : ['hybrid =', 'word + meaning search', ['fused by points', C.amber], ['for positions', C.amber]]), ...say('HYBRID RETRIEVAL', C.cyan));
}
