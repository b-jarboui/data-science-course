// 14.4.10 Cold start: recommending a book nobody has rated.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T: T0, pill: pill0, showA, until, play } = L;
  const T = (s, size, ...r) => T0(s, P ? Math.max(size, 15) : size, ...r);
  const pill = (s, c, size) => pill0(s, c, P ? Math.max(size || 17, 15) : size);

  // Chapter 14.4 fixed palette, book order, reader order, and exact data
  const COL = {
    Ana: C.cyan,
    Ben: '#60a5fa',
    Cara: '#fb923c',
    Dan: C.violet,
    Trail: C.green,
    River: '#2dd4bf',
    Clues: C.amber,
    Castle: C.violet,
    Island: '#fde047',
  };
  const READERS = ['Ana', 'Ben', 'Cara', 'Dan'];
  const BOOKS = ['Trail', 'River', 'Clues', 'Castle', 'Island'];
  const RATINGS = [
    [4, null, 2, null, null], // Ana
    [4, 5, 2, 1, null],       // Ben
    [2, 1, 4, 5, null],       // Cara
    [2, 2, 4, 4, null],       // Dan
  ];
  const FACTORS = ['(1, 0)', '(1, 0.5)', '(0, 1)', '(0.5, 1)'];

  // Layout zones: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.1;
  const PILL = P ? [0, 3.85, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.2, 0] : [4.55, -0.35, 0];
  // phone: enlarge a freshly built picture around an anchor (only before it is on screen)
  function zoom(m, k, from, to) {
    const c = m.getCenter(); m.scale(k);
    m.moveTo([to[0] + (c[0] - from[0]) * k, to[1] + (c[1] - from[1]) * k, c[2]]);
    return m;
  }
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 15 : 18);

  // One formula box at a time, never overlapping the main visual
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  // Drawing helpers (every part placed with moveTo; never wraps live objects)
  function fitText(text, size, color, maxW, mono = false, bold = false) {
    const t = T(text, size, color, mono, bold);
    const w = t.getWidth();
    if (maxW && w > maxW) t.scale(maxW / w);
    return t;
  }
  function fadeOutAll(list, runTime = 0.45) {
    return list.filter(Boolean).map(m => new M.FadeOut(m, { runTime }));
  }
  function arrow(a, b, color = C.amber, sw = 2.6, dashed = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, sz = Math.min(0.18, len * 0.28);
    const shaft = dashed
      ? new M.DashedLine({ start: [a[0], a[1], 0.02], end: [b[0], b[1], 0.02], color, strokeWidth: sw })
      : new M.Line({ start: [a[0], a[1], 0.02], end: [b[0], b[1], 0.02], color, strokeWidth: sw });
    const tip1 = new M.Line({
      start: [b[0] - ux * sz - uy * sz * 0.6, b[1] - uy * sz + ux * sz * 0.6, 0.02],
      end: [b[0], b[1], 0.02], color, strokeWidth: sw,
    });
    const tip2 = new M.Line({
      start: [b[0] - ux * sz + uy * sz * 0.6, b[1] - uy * sz - ux * sz * 0.6, 0.02],
      end: [b[0], b[1], 0.02], color, strokeWidth: sw,
    });
    return new M.VGroup(shaft, tip1, tip2);
  }
  function readerIcon(name, pos, r = 0.24) {
    const col = COL[name] || C.amber;
    const ring = new M.Circle({ radius: r, color: col, strokeWidth: 2.5 });
    ring.setFill(col, 0.22); ring.moveTo(pos);
    const head = new M.Circle({ radius: r * 0.34, color: col, strokeWidth: 1.5 });
    head.setFill(col, 0.95); head.moveTo([pos[0], pos[1] + r * 0.22, 0.01]);
    const body = new M.Arc({ radius: r * 0.56, startAngle: 0, angle: Math.PI, color: col });
    body.setFill(col, 0.9); body.moveTo([pos[0], pos[1] - r * 0.38, 0.01]);
    const lab = fitText(name, P ? 15 : 16, col, 1.4, false, true);
    lab.moveTo([pos[0], pos[1] - r - 0.26, 0]);
    return new M.VGroup(ring, head, body, lab);
  }
  function topicChip(label, color, pos, size = P ? 14 : 15, fillOp = 0.16) {
    const t = fitText(label, size, color, P ? 2.4 : 2.6, true, true);
    const wd = Math.max(1.25, t.getWidth() + 0.36), ht = P ? 0.38 : 0.40;
    const bg = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: ht / 2, color, strokeWidth: 2 });
    bg.setFill(color, fillOp); bg.moveTo(pos);
    t.moveTo([pos[0], pos[1], 0.01]);
    return new M.VGroup(bg, t);
  }
  function makeBookCard(title, color, pos, w, h, sub = '', subCol = C.muted) {
    const glow = new M.RoundedRectangle({ width: w + 0.12, height: h + 0.12, cornerRadius: 0.2, color, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(color, 0.05); glow.moveTo([pos[0], pos[1], -0.01]);
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo(pos);
    const bar = new M.Rectangle({ width: w - 0.24, height: 0.07, color, strokeWidth: 0 });
    bar.setFill(color, 0.9); bar.moveTo([pos[0], pos[1] + h / 2 - 0.14, 0.01]);
    const nm = fitText(title, P ? 21 : 22, color, w - 0.35, false, true);
    nm.moveTo([pos[0], pos[1] + (sub ? 0.18 : 0), 0.01]);
    const parts = [glow, body, bar, nm];
    if (sub) {
      const st = fitText(sub, P ? 14 : 15, subCol, w - 0.35, true, false);
      st.moveTo([pos[0], pos[1] - 0.26, 0.01]);
      parts.push(st);
    }
    return new M.VGroup(...parts);
  }

  // Reusable 4-reader x 5-book ratings table builder
  function buildTable() {
    const nameW = P ? 1.32 : 1.50;
    const colW = P ? 1.18 : 1.32;
    const totalW = nameW + 5 * colW;
    const leftX = CX - totalW / 2;
    const topY = P ? 2.95 : 1.38;
    const headH = 0.56;
    const rowH = P ? 1.2 : 0.68;

    const colX = c => leftX + nameW + (c + 0.5) * colW;
    const rowY = r => topY - headH - (r + 0.5) * rowH;
    const cellPos = (r, c) => [colX(c), rowY(r), 0];

    const frame = [];
    const bg = new M.RoundedRectangle({
      width: totalW + 0.16, height: headH + 4 * rowH + 0.14,
      cornerRadius: 0.16, color: C.line, strokeWidth: 2,
    });
    bg.setFill(C.card, 0.92);
    bg.moveTo([CX, topY - (headH + 4 * rowH) / 2, -0.01]);
    frame.push(bg);

    // Column headers (5 books)
    BOOKS.forEach((b, c) => {
      const cx = colX(c), hy = topY - headH / 2;
      const bar = new M.Rectangle({ width: colW - 0.14, height: 0.06, color: COL[b], strokeWidth: 0 });
      bar.setFill(COL[b], 0.9); bar.moveTo([cx, topY - 0.07, 0.01]);
      const lab = fitText(b, P ? 15 : 17, COL[b], colW - 0.12, false, true);
      lab.moveTo([cx, hy - 0.03, 0.01]);
      frame.push(bar, lab);
    });

    // Horizontal grid dividers
    for (let r = 0; r <= 4; r++) {
      const y = topY - headH - r * rowH;
      const ln = new M.Line({ start: [leftX, y, 0], end: [leftX + totalW, y, 0], color: C.line, strokeWidth: 1.5 });
      ln.setStrokeOpacity(0.7);
      frame.push(ln);
    }
    // Vertical dividers
    for (let c = 0; c <= 5; c++) {
      const x = leftX + nameW + c * colW;
      const ln = new M.Line({ start: [x, topY, 0], end: [x, topY - headH - 4 * rowH, 0], color: C.line, strokeWidth: 1.5 });
      ln.setStrokeOpacity(0.6);
      frame.push(ln);
    }

    // Reader names
    READERS.forEach((name, r) => {
      const ry = rowY(r);
      const dot = new M.Dot({ point: [leftX + 0.22, ry, 0.01], radius: 0.09, color: COL[name] });
      const lab = fitText(name, P ? 15 : 17, COL[name], nameW - 0.42, false, true);
      lab.moveTo([leftX + 0.38 + lab.getWidth() / 2, ry, 0.01]);
      frame.push(dot, lab);
    });

    // Cells: older books (cols 0..3) and Island (col 4)
    const olderCells = [];
    const islandCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = RATINGS[r][c];
        const txt = val == null ? '—' : `${val}★`;
        const col = val == null ? C.muted : (val >= 4 ? C.amber : C.ink);
        const t = T(txt, P ? 16 : 18, col, true, val != null && val >= 4);
        t.moveTo([colX(c), rowY(r), 0.01]);
        olderCells.push(t);
      }
      const dash = T('—', P ? 17 : 19, C.muted, true);
      dash.moveTo([colX(4), rowY(r), 0.01]);
      islandCells.push(dash);
    }

    // Island empty-column outline
    const islH = headH + 4 * rowH + 0.06;
    const islBox = new M.RoundedRectangle({
      width: colW - 0.06, height: islH, cornerRadius: 0.12, color: C.pink, strokeWidth: 2.8,
    });
    islBox.setFill(C.pink, 0.07);
    islBox.moveTo([colX(4), topY - (headH + 4 * rowH) / 2, 0.01]);

    return {
      frame, olderCells, islandCells, islBox,
      colX, rowY, cellPos, leftX, topY, headH, rowH, colW, nameW, totalW,
      bottomY: topY - headH - 4 * rowH,
    };
  }

  // =========================================================================
  // ACT 1 (Beats 0–2): A new book arrives — Island
  // =========================================================================
  const shelfY = P ? 1.15 : 0.25;
  const shelfLine = new M.Line({
    start: [P ? -3.1 : -4.8, shelfY - 0.95, 0],
    end: [P ? 3.1 : 4.8, shelfY - 0.95, 0],
    color: C.muted, strokeWidth: 2.5,
  });
  const introOld = ['Trail', 'River', 'Clues', 'Castle'].map((b, i) => {
    const x = (P ? -2.4 : -3.4) + i * (P ? 0.92 : 1.18);
    const r = new M.RoundedRectangle({ width: P ? 0.76 : 0.96, height: 1.25, cornerRadius: 0.1, color: COL[b], strokeWidth: 2 });
    r.setFill(C.card, 0.85); r.moveTo([x, shelfY - 0.26, 0]);
    const t = fitText(b, P ? 12 : 14, COL[b], P ? 0.66 : 0.84, false, true);
    t.moveTo([x, shelfY - 0.26, 0.01]);
    return new M.VGroup(r, t);
  });
  const newBookPos = [P ? 1.85 : 2.35, shelfY - 0.05, 0];
  const mysteryCard = makeBookCard('NEW BOOK', COL.Island, newBookPos, P ? 2.15 : 2.55, 1.65, '? ? ?', COL.Island);
  // phone: the opening picture is enlarged and sits in the middle of the tall screen
  const zp = m => zoom(m, 1.2, [0, shelfY - 0.26], [0, -0.6]);
  if (P) [shelfLine, ...introOld, mysteryCard].forEach(zp);

  await until(S(0));
  await play(
    new M.Create(shelfLine, { runTime: 0.6 }),
    new M.LaggedStart(introOld.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 0.7 }),
    new M.FadeIn(mysteryCard, { runTime: 0.9 }),
    ...say('NEW BOOK ARRIVES TODAY', COL.Island)
  );

  // Beat 1: Named Island, help readers discover it
  const islandIntro = makeBookCard('Island', COL.Island, newBookPos, P ? 2.15 : 2.55, 1.65, 'NEW', C.amber);
  const introRY = P ? -2.6 : -1.85;
  const introRPos = READERS.map((_, i) => [(i - 1.5) * (P ? 1.75 : 2.55), introRY, 0]);
  const introReaders = READERS.map((name, i) => readerIcon(name, introRPos[i], P ? 0.28 : 0.30));
  if (P) [islandIntro, ...introReaders].forEach(zp);

  await until(S(1));
  await play(
    new M.FadeOut(mysteryCard, { runTime: 0.45 }),
    new M.FadeIn(islandIntro, { runTime: 0.7 }),
    new M.LaggedStart(introReaders.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('BOOK: ISLAND · 4 READERS', COL.Island)
  );

  // Beat 2: How do we know who will enjoy Island?
  const qLines = introRPos.map(rp => {
    const ln = new M.DashedLine({
      start: [newBookPos[0], newBookPos[1] - 0.9, 0],
      end: [rp[0], rp[1] + 0.42, 0],
      color: C.amber, strokeWidth: 2,
    });
    const q = T('?', P ? 18 : 20, C.amber, true, true);
    q.moveTo([(newBookPos[0] + rp[0]) / 2, (newBookPos[1] - 0.9 + rp[1] + 0.42) / 2, 0.01]);
    return new M.VGroup(ln, q);
  });
  if (P) qLines.forEach(zp);

  await until(S(2));
  await play(
    new M.LaggedStart(qLines.map(q => new M.FadeIn(q)), { lagRatio: 0.1, runTime: 0.8 }),
    new M.Indicate(islandIntro, { color: COL.Island, runTime: 0.8 }),
    ...say('WHO WILL ENJOY ISLAND?', C.amber)
  );

  // =========================================================================
  // ACT 2 (Beats 3–6): The 5 books and 4 readers ratings table
  // =========================================================================
  const T1 = buildTable();

  await until(S(3));
  await play(
    ...fadeOutAll([shelfLine, ...introOld, islandIntro, ...introReaders, ...qLines], 0.45),
    ...say('5 BOOKS · 4 READERS', C.cyan)
  );
  await play(new M.LaggedStart(T1.frame.map(m => new M.FadeIn(m)), { lagRatio: 0.02, runTime: 0.9 }));

  // Beat 4: Older books already have ratings
  await until(S(4));
  await play(
    new M.LaggedStart(T1.olderCells.map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('OLDER BOOKS HAVE RATINGS', C.amber)
  );

  // Beat 5: Entire column for Island is empty
  await until(S(5));
  await play(
    new M.LaggedStart(T1.islandCells.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 0.7 }),
    new M.Create(T1.islBox, { runTime: 0.8 }),
    ...say('ISLAND COLUMN IS EMPTY', C.pink)
  );

  // Beat 6: Nobody has rated or bought Island yet
  await until(S(6));
  await play(
    new M.Indicate(T1.islBox, { color: C.pink, runTime: 0.8 }),
    ...fbox([['Island', COL.Island], ['ratings   = 0', C.pink], ['purchases = 0', C.pink]], C.pink),
    ...say('0 RATINGS · 0 PURCHASES', C.pink)
  );

  // =========================================================================
  // ACT 3 (Beats 7–13): Why collaborative filtering & matrix factorization fail
  // =========================================================================
  const anaRowHl = new M.RoundedRectangle({
    width: T1.totalW - 0.08, height: T1.rowH - 0.08, cornerRadius: 0.08, color: COL.Ana, strokeWidth: 2,
  });
  anaRowHl.setFill(COL.Ana, 0.06); anaRowHl.moveTo([CX, T1.rowY(0), 0.01]);
  const benRowHl = new M.RoundedRectangle({
    width: T1.totalW - 0.08, height: T1.rowH - 0.08, cornerRadius: 0.08, color: COL.Ben, strokeWidth: 2,
  });
  benRowHl.setFill(COL.Ben, 0.06); benRowHl.moveTo([CX, T1.rowY(1), 0.01]);

  await until(S(7));
  await play(
    new M.FadeIn(anaRowHl, { runTime: 0.6 }),
    new M.FadeIn(benRowHl, { runTime: 0.6 }),
    ...say('SIMILAR TASTES: ANA & BEN', C.cyan)
  );

  // Beat 8: Collaborative filtering
  await until(S(8));
  await play(
    ...fbox([['Collaborative filtering', C.cyan], 'match similar readers', 'use their past ratings'], C.cyan),
    ...say('COLLABORATIVE FILTERING', C.cyan)
  );

  // Beat 9: Ben helps predict Ana (River 5★ -> Ana's River)
  const cfRiverArrow = arrow(
    [T1.colX(1), T1.rowY(1) + 0.22, 0],
    [T1.colX(1), T1.rowY(0) - 0.22, 0],
    C.green, 3, false
  );
  const riverRing = new M.RoundedRectangle({
    width: T1.colW - 0.18, height: T1.rowH - 0.14, cornerRadius: 0.1, color: C.green, strokeWidth: 2.5,
  });
  riverRing.setFill(C.green, 0.12); riverRing.moveTo(T1.cellPos(1, 1));

  await until(S(9));
  await play(
    new M.FadeIn(riverRing, { runTime: 0.5 }),
    new M.FadeIn(cfRiverArrow, { runTime: 0.6 }),
    ...say('BEN (5★ RIVER) → PREDICTS ANA', C.green)
  );

  // Beat 10: Ben has not rated Island -> cannot predict
  const cfIslArrow = arrow(
    [T1.colX(4), T1.rowY(1) + 0.22, 0],
    [T1.colX(4), T1.rowY(0) - 0.22, 0],
    C.pink, 3, true
  );
  const noMark = T('✗', P ? 22 : 24, C.pink, true, true);
  noMark.moveTo([T1.colX(4) + 0.34, (T1.rowY(0) + T1.rowY(1)) / 2, 0.02]);

  await until(S(10));
  await play(
    ...fadeOutAll([riverRing, cfRiverArrow], 0.4),
    new M.FadeIn(cfIslArrow, { runTime: 0.6 }),
    new M.FadeIn(noMark, { runTime: 0.6 }),
    ...fbox([['Collaborative filtering', C.pink], 'Ben on Island = —', ['cannot predict', C.pink]], C.pink),
    ...say('NO RATING FROM BEN ON ISLAND', C.pink)
  );

  // Beat 11: Matrix factorization learns hidden numbers from known ratings
  const facY = T1.bottomY - (P ? 0.42 : 0.38);
  const facTags = FACTORS.map((f, c) => {
    const t = fitText(f, P ? 13 : 14, C.violet, T1.colW - 0.08, true, true);
    t.moveTo([T1.colX(c), facY, 0.01]);
    return t;
  });
  const facLab = fitText('factors:', P ? 13 : 14, C.violet, T1.nameW - 0.1, true, true);
  facLab.moveTo([T1.leftX + T1.nameW / 2, facY, 0.01]);

  await until(S(11));
  await play(
    ...fadeOutAll([anaRowHl, benRowHl, cfIslArrow, noMark], 0.45),
    new M.FadeIn(facLab, { runTime: 0.5 }),
    new M.LaggedStart(facTags.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.8 }),
    ...fbox([['Matrix factorization', C.violet], 'learns hidden numbers', 'from known ratings'], C.violet),
    ...say('MATRIX FACTORIZATION', C.violet)
  );

  // Beat 12: Without ratings, Island has (?, ?)
  const islFac = fitText('(?, ?)', P ? 14 : 15, C.pink, T1.colW - 0.08, true, true);
  islFac.moveTo([T1.colX(4), facY, 0.01]);

  await until(S(12));
  await play(
    new M.FadeIn(islFac, { runTime: 0.6 }),
    new M.Indicate(T1.islBox, { color: C.pink, runTime: 0.8 }),
    ...fbox([['Matrix factorization', C.pink], 'Island ratings = 0', ['factors = (?, ?)', C.pink]], C.pink),
    ...say('ISLAND FACTORS = (?, ?)', C.pink)
  );

  // Beat 13: Both methods need information we do not have yet
  await until(S(13));
  await play(
    ...fbox([['Collaborative filtering: ✗', C.pink], ['Matrix factorization:  ✗', C.pink], ['both need past ratings', C.amber]], C.amber),
    ...say('BOTH NEED PAST RATINGS', C.amber)
  );

  // =========================================================================
  // ACT 4 (Beats 14–18): New shop assistant & The Cold Start Problem
  // =========================================================================
  const asstY = P ? 0.2 : -0.15;
  const asstHead = new M.Circle({ radius: 0.28, color: C.amber, strokeWidth: 2.5 });
  asstHead.setFill(C.amber, 0.25); asstHead.moveTo([CX, asstY + 0.55, 0]);
  const asstBody = new M.Arc({ radius: 0.52, startAngle: 0, angle: Math.PI, color: C.amber });
  asstBody.setFill(C.amber, 0.25); asstBody.moveTo([CX, asstY - 0.02, 0]);
  const asstTag = fitText('New shop assistant', P ? 17 : 18, C.amber, 3.2, false, true);
  asstTag.moveTo([CX, asstY - 0.42, 0]);
  const asstGroup = new M.VGroup(asstHead, asstBody, asstTag);
  // phone: big assistant in the middle, books and readers stacked below it
  if (P) zoom(asstGroup, 1.6, [CX, asstY], [CX, asstY + 0.1]);
  const sideX = P ? 1.6 : 3.0, sideY = P ? asstY - 1.9 : asstY + 0.15;

  const blankBooks = [-1, 0, 1].map(k => {
    const x = CX - sideX + k * 0.45, y = sideY;
    const b = new M.RoundedRectangle({ width: 0.36, height: 0.72, cornerRadius: 0.06, color: C.muted, strokeWidth: 1.8 });
    b.setFill(C.card, 0.9); b.moveTo([x, y, 0]);
    const q = T('?', 15, C.muted, true, true); q.moveTo([x, y, 0.01]);
    return new M.VGroup(b, q);
  });
  const blankBooksLab = fitText('Books: ?', P ? 14 : 15, C.muted, 2.0, true);
  blankBooksLab.moveTo([CX - sideX, sideY - 0.6, 0]);

  const blankReaders = [-1, 0, 1].map(k => {
    const x = CX + sideX + k * 0.48, y = sideY;
    const c = new M.Circle({ radius: 0.2, color: C.muted, strokeWidth: 1.8 });
    c.setFill(C.card, 0.9); c.moveTo([x, y, 0]);
    const q = T('?', 14, C.muted, true, true); q.moveTo([x, y, 0.01]);
    return new M.VGroup(c, q);
  });
  const blankReadersLab = fitText('Readers: ?', P ? 14 : 15, C.muted, 2.0, true);
  blankReadersLab.moveTo([CX + sideX, sideY - 0.6, 0]);
  if (P) {
    [...blankBooks, blankBooksLab].forEach(m => zoom(m, 1.4, [CX - sideX, sideY], [CX - sideX, sideY]));
    [...blankReaders, blankReadersLab].forEach(m => zoom(m, 1.4, [CX + sideX, sideY], [CX + sideX, sideY]));
  }

  await until(S(14));
  await play(
    ...fadeOutAll([...T1.frame, ...T1.olderCells, ...T1.islandCells, T1.islBox, facLab, ...facTags, islFac], 0.45),
    ...hideBox(),
    ...say('A NEW SHOP ASSISTANT', C.amber)
  );
  await play(
    new M.FadeIn(asstGroup, { runTime: 0.7 }),
    new M.LaggedStart([...blankBooks, blankBooksLab, ...blankReaders, blankReadersLab].map(m => new M.FadeIn(m)), { lagRatio: 0.06, runTime: 0.8 })
  );

  // Beat 15: Needs some information before making a useful suggestion
  const needBox = new M.RoundedRectangle({ width: P ? 4.4 : 4.8, height: 0.65, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  const needY = asstY + (P ? 2.6 : 1.38);
  needBox.setFill(C.card, 0.95); needBox.moveTo([CX, needY, 0]);
  const needTxt = fitText('Need clues before suggesting...', P ? 15 : 16, C.ink, P ? 4.1 : 4.5, true);
  needTxt.moveTo([CX, needY, 0.01]);
  const needGroup = new M.VGroup(needBox, needTxt);

  await until(S(15));
  await play(
    new M.FadeIn(needGroup, { runTime: 0.6 }),
    ...say('NEEDS INFORMATION FIRST', C.muted)
  );

  // Beat 16: Same difficulty when something is new
  const coldCard = makeBookCard('Island', COL.Island, [CX, asstY - (P ? 3.6 : 1.58), 0], P ? 2.7 : 2.9, 1.05, '0 ratings · NEW', C.pink);

  await until(S(16));
  await play(
    new M.FadeIn(coldCard, { runTime: 0.7 }),
    ...say('SAME PROBLEM FOR A NEW BOOK', C.amber)
  );

  // Beat 17: We call this the cold start problem
  await until(S(17));
  await play(
    ...fbox([['Cold start problem', C.cyan], 'something new,', '0 past ratings'], C.cyan),
    ...say('THE COLD START PROBLEM', C.cyan)
  );

  // Beat 18: Cold start definition
  await until(S(18));
  await play(
    ...fbox([['Cold start', C.cyan], 'make recommendations', 'before enough past', 'information exists'], C.cyan),
    ...say('RECOMMEND BEFORE RATINGS EXIST', C.cyan)
  );

  // =========================================================================
  // ACT 5 (Beats 19–40): Use Island's topic (Adventure) & Jaccard similarity
  // =========================================================================
  // Arena layout:
  //   Laptop: left card x=-4.1, right card (Island) x=0.1, y=0.55; 4 reader score cards at y=-1.75
  //   Phone:  left card x=-1.85, right card (Island) x=1.85, y=1.90; 4 reader cards in 2x2 at y=-0.05 and -1.50
  const ARENA_Y = P ? 1.90 : 0.55;
  const CARD_W = P ? 3.32 : 3.55;
  const CARD_H = P ? 1.82 : 1.82;
  const LEFT_X = P ? -1.85 : -4.05;
  const RIGHT_X = P ? 1.85 : 0.05;
  const TOP1_Y = ARENA_Y - 0.02;
  const TOP2_Y = ARENA_Y - 0.52;

  // Build Island's persistent card at center first, then we move to RIGHT_X in Beat 21
  const islCenterPos = [CX, ARENA_Y, 0];
  const islRightPos = [RIGHT_X, ARENA_Y, 0];
  const islBigCard = makeBookCard('Island', COL.Island, islCenterPos, CARD_W, CARD_H, '0 ratings', C.muted);
  const islBigAtRight = makeBookCard('Island', COL.Island, islRightPos, CARD_W, CARD_H, '0 ratings', C.muted);
  // phone: Island alone is shown big in the middle before it moves to its place in the comparison
  if (P) zoom(islBigCard, 1.7, islCenterPos, [CX, -0.8]);

  await until(S(19));
  await play(
    ...fadeOutAll([asstGroup, ...blankBooks, blankBooksLab, ...blankReaders, blankReadersLab, needGroup, coldCard], 0.45),
    ...hideBox(),
    ...say('WE KNOW WHAT ISLAND IS ABOUT', COL.Island)
  );
  await play(new M.FadeIn(islBigCard, { runTime: 0.7 }));

  // Beat 20: Topic label on Island: Adventure
  const islTopicCenter = topicChip('Adventure', COL.Island, [CX, TOP1_Y - 0.25, 0], P ? 15 : 16, 0.22);
  const islTopicRight = topicChip('Adventure', COL.Island, [RIGHT_X, TOP1_Y, 0], P ? 14 : 15, 0.22);
  if (P) zoom(islTopicCenter, 1.7, islCenterPos, [CX, -0.8]);

  await until(S(20));
  await play(
    new M.FadeIn(islTopicCenter, { runTime: 0.6 }),
    ...say('ISLAND TOPIC: ADVENTURE', COL.Island)
  );

  // Beat 21: Find readers who enjoy Adventure — move Island right & show 4 reader score cards
  const rCardPos = P
    ? [[-1.85, -0.45, 0], [1.85, -0.45, 0], [-1.85, -2.40, 0], [1.85, -2.40, 0]]
    : [[-5.10, -1.75, 0], [-3.10, -1.75, 0], [-1.10, -1.75, 0], [0.90, -1.75, 0]];
  const rCardW = P ? 3.32 : 1.82;
  const rCardH = P ? 1.7 : 1.44;

  const readerCards = [];
  const readerBorders = [];
  READERS.forEach((name, i) => {
    const p = rCardPos[i], col = COL[name];
    const border = new M.RoundedRectangle({ width: rCardW, height: rCardH, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
    border.setFill(C.card, 0.94); border.moveTo(p);
    const dot = new M.Dot({ point: [p[0] - rCardW / 2 + 0.26, p[1] + rCardH / 2 - 0.28, 0.01], radius: 0.09, color: col });
    const nm = fitText(name, P ? 16 : 17, col, rCardW - 0.6, false, true);
    nm.moveTo([p[0] - rCardW / 2 + 0.42 + nm.getWidth() / 2, p[1] + rCardH / 2 - 0.28, 0.01]);
    readerBorders.push(border);
    readerCards.push(new M.VGroup(dot, nm));
  });

  // Helper for placing fav book + score inside a reader card
  function stampFav(i, text, col) {
    const p = rCardPos[i];
    const t = fitText(text, P ? 15 : 13, col, rCardW - 0.24, true, false);
    t.moveTo([p[0], p[1] + (P ? -0.04 : 0.02), 0.01]);
    return t;
  }
  function stampScore(i, text, col) {
    const p = rCardPos[i];
    const t = fitText(text, P ? 19 : 21, col, rCardW - 0.24, true, true);
    t.moveTo([p[0], p[1] - rCardH / 2 + 0.30, 0.01]);
    return t;
  }
  const hlRings = [];
  function highlightBorder(i, color, active = true) {
    if (!active) return new M.FadeOut(hlRings[i], { runTime: 0.4 });
    const r = new M.RoundedRectangle({ width: rCardW + 0.06, height: rCardH + 0.06, cornerRadius: 0.14, color, strokeWidth: 3.2 });
    r.setFill(color, 0); r.moveTo(rCardPos[i]);
    hlRings[i] = r;
    return new M.FadeIn(r, { runTime: 0.45 });
  }

  await until(S(21));
  await play(
    new M.Transform(islBigCard, islBigAtRight, { runTime: 0.7 }),
    new M.Transform(islTopicCenter, islTopicRight, { runTime: 0.7 }),
    new M.LaggedStart(READERS.map((_, i) => new M.FadeIn(readerBorders[i])), { lagRatio: 0.08, runTime: 0.7 }),
    new M.LaggedStart(READERS.map((_, i) => new M.FadeIn(readerCards[i])), { lagRatio: 0.08, runTime: 0.7 }),
    ...say('FIND READERS WHO LIKE ADVENTURE', C.cyan)
  );

  // Beat 22: Start with Ana: Trail 4★ and Clues 2★
  const anaTrailMini = makeBookCard('Trail  4★', COL.Trail, [LEFT_X, ARENA_Y + 0.44, 0], CARD_W, 0.80);
  const anaCluesMini = makeBookCard('Clues  2★', COL.Clues, [LEFT_X, ARENA_Y - 0.46, 0], CARD_W, 0.80);

  await until(S(22));
  await play(
    highlightBorder(0, COL.Ana, true),
    new M.FadeIn(anaTrailMini, { runTime: 0.6 }),
    new M.FadeIn(anaCluesMini, { runTime: 0.6 }),
    ...say('ANA: TRAIL 4★ · CLUES 2★', COL.Ana)
  );

  // Beat 23: Trail has the most stars -> Ana's favourite book
  const trailCard = makeBookCard('Trail  4★', COL.Trail, [LEFT_X, ARENA_Y, 0], CARD_W, CARD_H);
  // Move Trail title higher inside card so topic chips fit below cleanly
  const trailShell = (() => {
    const glow = new M.RoundedRectangle({ width: CARD_W + 0.12, height: CARD_H + 0.12, cornerRadius: 0.2, color: COL.Trail, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(COL.Trail, 0.05); glow.moveTo([LEFT_X, ARENA_Y, -0.01]);
    const body = new M.RoundedRectangle({ width: CARD_W, height: CARD_H, cornerRadius: 0.16, color: COL.Trail, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo([LEFT_X, ARENA_Y, 0]);
    const bar = new M.Rectangle({ width: CARD_W - 0.24, height: 0.07, color: COL.Trail, strokeWidth: 0 });
    bar.setFill(COL.Trail, 0.9); bar.moveTo([LEFT_X, ARENA_Y + CARD_H / 2 - 0.14, 0.01]);
    const nm = fitText('Trail  (4★)', P ? 19 : 20, COL.Trail, CARD_W - 0.3, false, true);
    nm.moveTo([LEFT_X, ARENA_Y + 0.52, 0.01]);
    return new M.VGroup(glow, body, bar, nm);
  })();
  const anaFavStamp = stampFav(0, 'Trail 4★', COL.Trail);

  // Also tidy Island's title to match height of comparison cards
  const islClean = (() => {
    const glow = new M.RoundedRectangle({ width: CARD_W + 0.12, height: CARD_H + 0.12, cornerRadius: 0.2, color: COL.Island, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(COL.Island, 0.05); glow.moveTo([RIGHT_X, ARENA_Y, -0.01]);
    const body = new M.RoundedRectangle({ width: CARD_W, height: CARD_H, cornerRadius: 0.16, color: COL.Island, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo([RIGHT_X, ARENA_Y, 0]);
    const bar = new M.Rectangle({ width: CARD_W - 0.24, height: 0.07, color: COL.Island, strokeWidth: 0 });
    bar.setFill(COL.Island, 0.9); bar.moveTo([RIGHT_X, ARENA_Y + CARD_H / 2 - 0.14, 0.01]);
    const nm = fitText('Island (new)', P ? 19 : 20, COL.Island, CARD_W - 0.3, false, true);
    nm.moveTo([RIGHT_X, ARENA_Y + 0.52, 0.01]);
    return new M.VGroup(glow, body, bar, nm);
  })();

  await until(S(23));
  await play(
    new M.FadeOut(anaCluesMini, { runTime: 0.45 }),
    new M.FadeOut(anaTrailMini, { runTime: 0.45 }),
    new M.FadeIn(trailShell, { runTime: 0.65 }),
    new M.Transform(islBigCard, islClean, { runTime: 0.55 }),
    new M.FadeIn(anaFavStamp, { runTime: 0.6 }),
    ...say('ANA’S FAVOURITE: TRAIL', COL.Trail)
  );

  // Beat 24: Trail has two topics: Adventure and Nature
  const trailAdv = topicChip('Adventure', COL.Trail, [LEFT_X, TOP1_Y, 0], P ? 14 : 15, 0.18);
  const trailNat = topicChip('Nature', COL.Trail, [LEFT_X, TOP2_Y, 0], P ? 14 : 15, 0.18);

  await until(S(24));
  await play(
    new M.FadeIn(trailAdv, { runTime: 0.6 }),
    new M.FadeIn(trailNat, { runTime: 0.6 }),
    ...say('TRAIL: ADVENTURE, NATURE', COL.Trail)
  );

  // Beat 25: Place topics of Trail beside topic of Island
  const vsTag = fitText('vs', P ? 16 : 18, C.muted, 0.7, true, true);
  vsTag.moveTo([(LEFT_X + RIGHT_X) / 2, ARENA_Y + 0.52, 0.01]);

  await until(S(25));
  await play(
    new M.FadeIn(vsTag, { runTime: 0.5 }),
    new M.Indicate(trailAdv, { color: COL.Island, runTime: 0.7 }),
    new M.Indicate(islTopicCenter, { color: COL.Island, runTime: 0.7 }),
    ...say('COMPARE TRAIL WITH ISLAND', C.amber)
  );

  // Beat 26: Adventure in both, Nature only in Trail
  const matchLine1 = new M.Line({
    start: [LEFT_X + 0.85, TOP1_Y, 0.02],
    end: [RIGHT_X - 0.85, TOP1_Y, 0.02],
    color: C.green, strokeWidth: 3.5,
  });
  const trailAdvBright = topicChip('Adventure', C.green, [LEFT_X, TOP1_Y, 0], P ? 14 : 15, 0.34);
  const islAdvBright = topicChip('Adventure', C.green, [RIGHT_X, TOP1_Y, 0], P ? 14 : 15, 0.34);
  const trailNatDim = topicChip('Nature', C.muted, [LEFT_X, TOP2_Y, 0], P ? 14 : 15, 0.08);

  await until(S(26));
  await play(
    new M.Transform(trailAdv, trailAdvBright, { runTime: 0.55 }),
    new M.Transform(islTopicCenter, islAdvBright, { runTime: 0.55 }),
    new M.Transform(trailNat, trailNatDim, { runTime: 0.55 }),
    new M.Create(matchLine1, { runTime: 0.6 }),
    ...say('ADVENTURE: SHARED · NATURE: ONLY TRAIL', C.green)
  );

  // Beat 27: 1 shared topic out of 2 different topics
  await until(S(27));
  await play(
    ...fbox([['Ana: Trail vs Island', COL.Ana], ['shared topics    = 1', C.green], ['different topics = 2', C.ink]], COL.Ana),
    ...say('1 SHARED OUT OF 2 DIFFERENT', C.cyan)
  );

  // Beat 28: 1 / 2 = 0.5
  const anaScore = stampScore(0, '0.5', C.amber);

  await until(S(28));
  await play(
    ...fbox([['Ana: Trail vs Island', COL.Ana], 'shared ÷ different', ['1 ÷ 2 = 0.5', C.amber]], C.amber),
    new M.FadeIn(anaScore, { runTime: 0.6 }),
    new M.Flash(anaScore, { color: C.amber, runTime: 0.6 }),
    ...say('ANA SIMILARITY = 0.5', C.amber)
  );

  // Beat 29: Similarity measures how closely two books match
  await until(S(29));
  await play(
    new M.Indicate(matchLine1, { color: C.amber, runTime: 0.8 }),
    ...say('SIMILARITY = HOW CLOSELY BOOKS MATCH', C.cyan)
  );

  // Beat 30: Ben's favourite book is River (5★)
  const riverShell = (() => {
    const glow = new M.RoundedRectangle({ width: CARD_W + 0.12, height: CARD_H + 0.12, cornerRadius: 0.2, color: COL.River, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(COL.River, 0.05); glow.moveTo([LEFT_X, ARENA_Y, -0.01]);
    const body = new M.RoundedRectangle({ width: CARD_W, height: CARD_H, cornerRadius: 0.16, color: COL.River, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo([LEFT_X, ARENA_Y, 0]);
    const bar = new M.Rectangle({ width: CARD_W - 0.24, height: 0.07, color: COL.River, strokeWidth: 0 });
    bar.setFill(COL.River, 0.9); bar.moveTo([LEFT_X, ARENA_Y + CARD_H / 2 - 0.14, 0.01]);
    const nm = fitText('River  (5★)', P ? 19 : 20, COL.River, CARD_W - 0.3, false, true);
    nm.moveTo([LEFT_X, ARENA_Y + 0.52, 0.01]);
    return new M.VGroup(glow, body, bar, nm);
  })();
  const benFavStamp = stampFav(1, 'River 5★', COL.River);
  const islAdvNeutral = topicChip('Adventure', COL.Island, [RIGHT_X, TOP1_Y, 0], P ? 14 : 15, 0.22);

  await until(S(30));
  await play(
    highlightBorder(0, COL.Ana, false),
    highlightBorder(1, COL.Ben, true),
    ...fadeOutAll([trailShell, trailAdv, trailNat, matchLine1], 0.45),
    new M.Transform(islTopicCenter, islAdvNeutral, { runTime: 0.45 }),
    new M.FadeIn(riverShell, { runTime: 0.65 }),
    new M.FadeIn(benFavStamp, { runTime: 0.6 }),
    ...fbox([['Ben: favourite book', COL.Ben], ['River, 5 stars', COL.River]], COL.Ben),
    ...say('BEN’S FAVOURITE: RIVER (5★)', COL.Ben)
  );

  // Beat 31: River also has Adventure and Nature
  const riverAdv = topicChip('Adventure', COL.River, [LEFT_X, TOP1_Y, 0], P ? 14 : 15, 0.18);
  const riverNat = topicChip('Nature', COL.River, [LEFT_X, TOP2_Y, 0], P ? 14 : 15, 0.18);

  await until(S(31));
  await play(
    new M.FadeIn(riverAdv, { runTime: 0.55 }),
    new M.FadeIn(riverNat, { runTime: 0.55 }),
    ...say('RIVER: ADVENTURE, NATURE', COL.River)
  );

  // Beat 32: River and Island share 1 out of 2
  const matchLine2 = new M.Line({
    start: [LEFT_X + 0.85, TOP1_Y, 0.02],
    end: [RIGHT_X - 0.85, TOP1_Y, 0.02],
    color: C.green, strokeWidth: 3.5,
  });
  const riverAdvBright = topicChip('Adventure', C.green, [LEFT_X, TOP1_Y, 0], P ? 14 : 15, 0.34);
  const islAdvBright2 = topicChip('Adventure', C.green, [RIGHT_X, TOP1_Y, 0], P ? 14 : 15, 0.34);
  const riverNatDim = topicChip('Nature', C.muted, [LEFT_X, TOP2_Y, 0], P ? 14 : 15, 0.08);

  await until(S(32));
  await play(
    new M.Transform(riverAdv, riverAdvBright, { runTime: 0.5 }),
    new M.Transform(islTopicCenter, islAdvBright2, { runTime: 0.5 }),
    new M.Transform(riverNat, riverNatDim, { runTime: 0.5 }),
    new M.Create(matchLine2, { runTime: 0.55 }),
    ...fbox([['Ben: River vs Island', COL.Ben], ['shared topics    = 1', C.green], ['different topics = 2', C.ink]], COL.Ben),
    ...say('1 SHARED OUT OF 2 DIFFERENT', C.green)
  );

  // Beat 33: Ben receives 0.5
  const benScore = stampScore(1, '0.5', C.amber);

  await until(S(33));
  await play(
    ...fbox([['Ben: River vs Island', COL.Ben], 'shared ÷ different', ['1 ÷ 2 = 0.5', C.amber]], C.amber),
    new M.FadeIn(benScore, { runTime: 0.6 }),
    new M.Flash(benScore, { color: C.amber, runTime: 0.6 }),
    ...say('BEN SIMILARITY = 0.5', C.amber)
  );

  // Beat 34: Cara's favourite book is Castle (5★)
  const castleShell = (() => {
    const glow = new M.RoundedRectangle({ width: CARD_W + 0.12, height: CARD_H + 0.12, cornerRadius: 0.2, color: COL.Castle, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(COL.Castle, 0.05); glow.moveTo([LEFT_X, ARENA_Y, -0.01]);
    const body = new M.RoundedRectangle({ width: CARD_W, height: CARD_H, cornerRadius: 0.16, color: COL.Castle, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo([LEFT_X, ARENA_Y, 0]);
    const bar = new M.Rectangle({ width: CARD_W - 0.24, height: 0.07, color: COL.Castle, strokeWidth: 0 });
    bar.setFill(COL.Castle, 0.9); bar.moveTo([LEFT_X, ARENA_Y + CARD_H / 2 - 0.14, 0.01]);
    const nm = fitText('Castle  (5★)', P ? 19 : 20, COL.Castle, CARD_W - 0.3, false, true);
    nm.moveTo([LEFT_X, ARENA_Y + 0.52, 0.01]);
    return new M.VGroup(glow, body, bar, nm);
  })();
  const caraFavStamp = stampFav(2, 'Castle 5★', COL.Castle);
  const islAdvNeutral2 = topicChip('Adventure', COL.Island, [RIGHT_X, TOP1_Y, 0], P ? 14 : 15, 0.22);

  await until(S(34));
  await play(
    highlightBorder(1, COL.Ben, false),
    highlightBorder(2, COL.Cara, true),
    ...fadeOutAll([riverShell, riverAdv, riverNat, matchLine2], 0.45),
    new M.Transform(islTopicCenter, islAdvNeutral2, { runTime: 0.45 }),
    new M.FadeIn(castleShell, { runTime: 0.65 }),
    new M.FadeIn(caraFavStamp, { runTime: 0.6 }),
    ...fbox([['Cara: favourite book', COL.Cara], ['Castle, 5 stars', COL.Castle]], COL.Cara),
    ...say('CARA’S FAVOURITE: CASTLE (5★)', COL.Cara)
  );

  // Beat 35: Castle has Mystery and History, no match with Island
  const casMys = topicChip('Mystery', COL.Castle, [LEFT_X, TOP1_Y, 0], P ? 14 : 15, 0.16);
  const casHis = topicChip('History', COL.Castle, [LEFT_X, TOP2_Y, 0], P ? 14 : 15, 0.16);
  const noMatch1 = T('≠', P ? 24 : 26, C.pink, true, true);
  noMatch1.moveTo([(LEFT_X + RIGHT_X) / 2, TOP1_Y, 0.02]);

  await until(S(35));
  await play(
    new M.FadeIn(casMys, { runTime: 0.55 }),
    new M.FadeIn(casHis, { runTime: 0.55 }),
    new M.FadeIn(noMatch1, { runTime: 0.6 }),
    ...say('MYSTERY, HISTORY ≠ ADVENTURE', C.pink)
  );

  // Beat 36: No shared topics -> Cara receives 0
  const caraScore = stampScore(2, '0', C.pink);

  await until(S(36));
  await play(
    ...fbox([['Cara: Castle vs Island', COL.Cara], ['shared topics    = 0', C.pink], 'different topics = 3', ['0 ÷ 3 = 0', C.pink]], C.pink),
    new M.FadeIn(caraScore, { runTime: 0.6 }),
    ...say('CARA SIMILARITY = 0', C.pink)
  );

  // Beat 37: Dan gives highest rating 4★ to both Clues and Castle
  const danClues = makeBookCard('Clues (4★)', COL.Clues, [LEFT_X, ARENA_Y + 0.46, 0], CARD_W, 0.84, 'Mystery, Crime', C.muted);
  const danCastle = makeBookCard('Castle (4★)', COL.Castle, [LEFT_X, ARENA_Y - 0.46, 0], CARD_W, 0.84, 'Mystery, History', C.muted);
  const danFavStamp = stampFav(3, 'Clues & Castle', COL.Dan);

  await until(S(37));
  await play(
    highlightBorder(2, COL.Cara, false),
    highlightBorder(3, COL.Dan, true),
    ...fadeOutAll([castleShell, casMys, casHis, noMatch1], 0.45),
    new M.FadeIn(danClues, { runTime: 0.6 }),
    new M.FadeIn(danCastle, { runTime: 0.6 }),
    new M.FadeIn(danFavStamp, { runTime: 0.6 }),
    ...fbox([['Dan: highest rating', COL.Dan], 'Clues, 4 stars', 'Castle, 4 stars'], COL.Dan),
    ...say('DAN: CLUES 4★ & CASTLE 4★', COL.Dan)
  );

  // Beat 38: Neither book has Adventure -> similarity 0
  const noMatch2 = T('≠', P ? 24 : 26, C.pink, true, true);
  noMatch2.moveTo([(LEFT_X + RIGHT_X) / 2, TOP1_Y, 0.02]);
  const danScore = stampScore(3, '0', C.pink);

  await until(S(38));
  await play(
    new M.FadeIn(noMatch2, { runTime: 0.55 }),
    ...fbox([['Dan: Clues & Castle', COL.Dan], 'neither has Adventure', ['0 ÷ 3 = 0  (both)', C.pink]], C.pink),
    new M.FadeIn(danScore, { runTime: 0.6 }),
    ...say('DAN SIMILARITY = 0', C.pink)
  );

  // Beat 39: Familiar formula for comparing topics
  const islCenterClean = (() => {
    const glow = new M.RoundedRectangle({ width: CARD_W + 0.12, height: CARD_H + 0.12, cornerRadius: 0.2, color: COL.Island, strokeWidth: 5 });
    glow.setStrokeOpacity(0.18); glow.setFill(COL.Island, 0.05); glow.moveTo([CX, ARENA_Y, -0.01]);
    const body = new M.RoundedRectangle({ width: CARD_W, height: CARD_H, cornerRadius: 0.16, color: COL.Island, strokeWidth: 2.5 });
    body.setFill(C.card, 0.96); body.moveTo([CX, ARENA_Y, 0]);
    const bar = new M.Rectangle({ width: CARD_W - 0.24, height: 0.07, color: COL.Island, strokeWidth: 0 });
    bar.setFill(COL.Island, 0.9); bar.moveTo([CX, ARENA_Y + CARD_H / 2 - 0.14, 0.01]);
    const nm = fitText('Island (new)', P ? 19 : 20, COL.Island, CARD_W - 0.3, false, true);
    nm.moveTo([CX, ARENA_Y + 0.52, 0.01]);
    return new M.VGroup(glow, body, bar, nm);
  })();
  const islTopicMid = topicChip('Adventure', COL.Island, [CX, TOP1_Y, 0], P ? 14 : 15, 0.22);

  await until(S(39));
  await play(
    highlightBorder(3, COL.Dan, false),
    ...fadeOutAll([danClues, danCastle, noMatch2, vsTag], 0.45),
    new M.Transform(islBigCard, islCenterClean, { runTime: 0.6 }),
    new M.Transform(islTopicCenter, islTopicMid, { runTime: 0.6 }),
    ...say('COMPARING TOPICS: THE FORMULA', C.cyan)
  );

  // Beat 40: Jaccard similarity formula
  await until(S(40));
  await play(
    ...fbox([['Jaccard similarity =', C.cyan], '  shared topics', '  ÷ different topics'], C.cyan),
    ...say('JACCARD SIMILARITY', C.cyan)
  );

  // =========================================================================
  // ACT 6 (Beats 41–43): Recommend Island to Ana and Ben (content-based)
  // =========================================================================
  await until(S(41));
  await play(
    highlightBorder(0, C.green, true),
    highlightBorder(1, C.green, true),
    ...fbox([['Scores for Island', C.cyan], ['Ana:  0.5', COL.Ana], ['Ben:  0.5', COL.Ben], ['Cara: 0', C.muted], ['Dan:  0', C.muted]], C.amber),
    ...say('ANA & BEN: 0.5 · CARA & DAN: 0', C.amber)
  );

  // Beat 42: Choose Ana and Ben as first readers to receive a recommendation
  const recArrA = arrow(
    [CX - 0.55, ARENA_Y - CARD_H / 2 - 0.04, 0],
    [rCardPos[0][0], rCardPos[0][1] + rCardH / 2 + 0.06, 0],
    C.green, 3, false
  );
  const recArrB = arrow(
    [CX + 0.55, ARENA_Y - CARD_H / 2 - 0.04, 0],
    [rCardPos[1][0], rCardPos[1][1] + rCardH / 2 + 0.06, 0],
    C.green, 3, false
  );
  const recPillA = pill('RECOMMEND', C.green, P ? 11 : 12);
  recPillA.moveTo([rCardPos[0][0], rCardPos[0][1] + rCardH / 2 + (P ? 0.22 : 0.26), 0.02]);
  const recPillB = pill('RECOMMEND', C.green, P ? 11 : 12);
  recPillB.moveTo([rCardPos[1][0], rCardPos[1][1] + rCardH / 2 + (P ? 0.22 : 0.26), 0.02]);

  await until(S(42));
  await play(
    new M.FadeIn(recArrA, { runTime: 0.6 }),
    new M.FadeIn(recArrB, { runTime: 0.6 }),
    new M.FadeIn(recPillA, { runTime: 0.6 }),
    new M.FadeIn(recPillB, { runTime: 0.6 }),
    ...say('RECOMMEND ISLAND TO ANA & BEN', C.green)
  );

  // Beat 43: Content-based recommendation
  await until(S(43));
  await play(
    ...fbox([['Content-based', C.green], 'uses book topics,', 'not past ratings'], C.green),
    ...say('CONTENT-BASED RECOMMENDATION', C.green)
  );

  // =========================================================================
  // ACT 7 (Beats 44–48): Ana reads Island and gives it 5 stars
  // =========================================================================
  const T2 = buildTable();
  const anaStarBadge = pill('ANA: 5★', COL.Island, P ? 15 : 16);
  anaStarBadge.moveTo([T2.colX(4), T2.topY + 0.34, 0.02]);

  await until(S(44));
  await play(
    ...fadeOutAll([
      islBigCard, islTopicCenter,
      ...readerBorders, ...readerCards,
      anaFavStamp, benFavStamp, caraFavStamp, danFavStamp,
      anaScore, benScore, caraScore, danScore,
      recArrA, recArrB, recPillA, recPillB, hlRings[0], hlRings[1],
    ], 0.45),
    ...hideBox(),
    ...say('ANA READS ISLAND → 5★', C.amber)
  );
  await play(
    ...T2.frame.map(m => new M.FadeIn(m, { runTime: 0.55 })),
    ...T2.olderCells.map(m => new M.FadeIn(m, { runTime: 0.55 })),
    ...T2.islandCells.map(m => new M.FadeIn(m, { runTime: 0.55 })),
    new M.FadeIn(T2.islBox, { runTime: 0.55 }),
    new M.FadeIn(anaStarBadge, { runTime: 0.65 })
  );

  // Beat 45: Place 5★ in Ana's empty box for Island
  const anaFive = T('5★', P ? 18 : 20, COL.Island, true, true);
  anaFive.moveTo([T2.colX(4), T2.rowY(0), 0.02]);
  const anaFiveGlow = new M.RoundedRectangle({
    width: T2.colW - 0.14, height: T2.rowH - 0.12, cornerRadius: 0.1, color: COL.Island, strokeWidth: 2.5,
  });
  anaFiveGlow.setFill(COL.Island, 0.16); anaFiveGlow.moveTo(T2.cellPos(0, 4));
  const warmIslBox = new M.RoundedRectangle({
    width: T2.colW - 0.06, height: T2.headH + 4 * T2.rowH + 0.06,
    cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5,
  });
  warmIslBox.setFill(C.amber, 0.05);
  warmIslBox.moveTo([T2.colX(4), T2.topY - (T2.headH + 4 * T2.rowH) / 2, 0.01]);

  await until(S(45));
  await play(
    new M.FadeOut(T2.islandCells[0], { runTime: 0.35 }),
    new M.FadeOut(anaStarBadge, { runTime: 0.35 }),
    new M.FadeIn(anaFiveGlow, { runTime: 0.55 }),
    new M.FadeIn(anaFive, { runTime: 0.55 }),
    new M.Flash(anaFive, { color: COL.Island, runTime: 0.6 }),
    new M.Transform(T2.islBox, warmIslBox, { runTime: 0.55 }),
    ...say('PLACE 5★ IN ANA’S BOX', COL.Island)
  );

  // Beat 46: Bookshop now has its first rating for the new book
  await until(S(46));
  await play(
    ...fbox([['Island ratings', C.amber], ['Ana = 5★', COL.Ana], ['total = 1 rating', C.green]], C.green),
    ...say('FIRST RATING FOR ISLAND', C.green)
  );

  // Beat 47: As more readers give ratings, we begin to learn
  const futureMarks = [1, 2, 3].map(r => {
    const t = T('?★', P ? 15 : 16, C.cyan, true, false);
    t.moveTo([T2.colX(4), T2.rowY(r), 0.02]);
    return t;
  });

  await until(S(47));
  await play(
    ...fadeOutAll([T2.islandCells[1], T2.islandCells[2], T2.islandCells[3]], 0.35),
    new M.LaggedStart(futureMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.18, runTime: 0.9 }),
    ...fbox([['More ratings arrive', C.cyan], 'cold start warms up', 'patterns begin to form'], C.cyan),
    ...say('MORE RATINGS → BETTER LEARNING', C.cyan)
  );

  // Beat 48: Combine topics with past ratings
  const topicNote = topicChip('Adventure', COL.Island, [T2.colX(4), T2.bottomY - 0.34, 0], P ? 15 : 14, 0.22);
  const topicNote2 = topicChip('Adventure', COL.Island, [T2.colX(4), T2.bottomY - 0.34, 0], P ? 15 : 14, 0.22);

  await until(S(48));
  await play(
    new M.FadeIn(topicNote, { runTime: 0.6 }),
    ...fbox([['Combine both', C.green], ['topics (Adventure)', COL.Island], ['+ past ratings', C.cyan], ['= stronger matches', C.green]], C.green),
    ...say('COMBINE TOPICS + PAST RATINGS', C.green)
  );

  // =========================================================================
  // ACT 8 (Beats 49–53): New-reader cold start, cautions, and final recap
  // =========================================================================
  const newRowY = T2.bottomY - T2.rowH / 2 - 0.04;
  const newRowBg = new M.RoundedRectangle({
    width: T2.totalW + 0.16, height: T2.rowH, cornerRadius: 0.12, color: C.pink, strokeWidth: 2.5,
  });
  newRowBg.setFill(C.pink, 0.09); newRowBg.moveTo([CX, newRowY, 0.01]);
  const newDot = new M.Dot({ point: [T2.leftX + 0.22, newRowY, 0.02], radius: 0.09, color: C.pink });
  const newName = fitText('New reader', P ? 13 : 15, C.pink, T2.nameW - 0.36, false, true);
  newName.moveTo([T2.leftX + 0.36 + newName.getWidth() / 2, newRowY, 0.02]);
  const newDashes = [0, 1, 2, 3, 4].map(c => {
    const t = T('—', P ? 16 : 18, C.pink, true);
    t.moveTo([T2.colX(c), newRowY, 0.02]);
    return t;
  });
  const newReaderRow = new M.VGroup(newRowBg, newDot, newName, ...newDashes);

  await until(S(49));
  await play(
    new M.FadeIn(newReaderRow, { runTime: 0.7 }),
    new M.FadeOut(topicNote, { runTime: 0.4 }),
    ...fbox([['New-reader cold start', C.pink], 'entire row is empty', '0 past ratings'], C.pink),
    ...say('NEW READER = EMPTY ROW', C.pink)
  );

  // Beat 50: Ask the reader which topics they enjoy
  const askChips = [
    topicChip('Adventure?', C.green, [CX - (P ? 2.1 : 2.3), newRowY - T2.rowH / 2 - 0.34, 0], P ? 12 : 13, 0.24),
    topicChip('Mystery?', C.muted, [CX, newRowY - T2.rowH / 2 - 0.34, 0], P ? 12 : 13, 0.10),
    topicChip('Nature?', C.green, [CX + (P ? 2.1 : 2.3), newRowY - T2.rowH / 2 - 0.34, 0], P ? 12 : 13, 0.24),
  ];

  await until(S(50));
  await play(
    new M.LaggedStart(askChips.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 0.75 }),
    ...fbox([['Ask the new reader', C.amber], 'Which topics do you', ['enjoy reading?', C.green]], C.amber),
    ...say('ASK WHICH TOPICS THEY ENJOY', C.amber)
  );

  // Beat 51: Sharing a topic does not guarantee enjoyment
  const restoredDashes = [1, 2, 3].map(r => {
    const t = T('—', P ? 17 : 19, C.muted, true);
    t.moveTo([T2.colX(4), T2.rowY(r), 0.01]);
    return t;
  });

  await until(S(51));
  await play(
    ...fadeOutAll([newReaderRow, ...askChips, ...futureMarks], 0.45),
    ...restoredDashes.map(d => new M.FadeIn(d, { runTime: 0.45 })),
    new M.FadeIn(topicNote2, { runTime: 0.6 }),
    ...fbox([['Caution', C.pink], 'same topic is a clue,', 'not a guarantee'], C.pink),
    ...say('SAME TOPIC ≠ GUARANTEED MATCH', C.pink)
  );

  // Beat 52: One 5★ rating does not mean everyone will enjoy Island
  await until(S(52));
  await play(
    new M.Indicate(anaFiveGlow, { color: C.amber, runTime: 0.8 }),
    ...fbox([['Caution', C.amber], 'Ana gave 5★', '1 rating ≠ everyone'], C.amber),
    ...say('ONE 5★ ≠ EVERYONE AGREES', C.amber)
  );

  // Beat 53: Final recap
  await until(S(53));
  await play(
    new M.Indicate(T2.islBox, { color: C.green, runTime: 0.9 }),
    ...fbox([['Cold start takeaway', C.green], ['1. Use topics first', COL.Island], ['2. Collect new ratings', C.cyan], ['3. Improve over time', C.green]], C.green),
    ...say('START WITH TOPICS · IMPROVE WITH RATINGS', C.green)
  );
}
