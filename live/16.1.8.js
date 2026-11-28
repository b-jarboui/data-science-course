// 16.1.8 Proxy variables: when one feature reveals another.
// Beat i = sentence i (0-based, 0..51). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Shared chapter 16.1 data (fixed, exact)
  const HOMES = ['A', 'B', 'C', 'D'];
  const BLOCKS = ['Cedar', 'Cedar', 'Park', 'Park'];
  const AGES = ['65 or older', '65 or older', 'Under 65', 'Under 65'];
  const OLDER = [true, true, false, false];
  const blockCol = b => b === 'Cedar' ? C.cyan : C.green;
  const ageCol = older => older ? C.violet : C.amber;

  // Responsive layout constants
  // Laptop: 14.22 x 8, content y in [-3.0, 2.3]
  // Phone:  8 x 14.22, content y in [-5.5, 4.3]
  const PILL = P ? [0, 3.92, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.55, 0] : [3.65, -2.05, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Drawing helpers
  function txt(s, size, color, p, mono = false, maxw = null, bold = false) {
    const t = T(String(s), size, color, mono, bold);
    if (maxw !== null && t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(p);
    return t;
  }

  function rrect(w, h, p, color, fillOp = 0, sw = 2, r = 0.12, fillCol = color) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: sw });
    if (fillOp > 0) box.setFill(fillCol, fillOp);
    box.moveTo(p);
    return box;
  }

  function ln(a, b, color = C.muted, sw = 2) {
    return new M.Line({ start: a, end: b, color, strokeWidth: sw });
  }

  function arrow(a, b, color = C.cyan, sw = 2.5, dashed = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hl = 0.16, hw = 0.09;
    const bx = b[0] - ux * hl, by = b[1] - uy * hl;
    const shaft = dashed
      ? new M.DashedLine({ start: a, end: [bx, by, 0], color, strokeWidth: sw })
      : new M.Line({ start: a, end: [bx, by, 0], color, strokeWidth: sw });
    const h1 = ln([bx - uy * hw, by + ux * hw, 0], b, color, sw);
    const h2 = ln([bx + uy * hw, by - ux * hw, 0], b, color, sw);
    return new M.VGroup(shaft, h1, h2);
  }

  const outs = list => list.filter(Boolean).map(o => new M.FadeOut(o));
  function clearList(list) { const a = outs(list); list.length = 0; return a; }

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan, pos = BOXP, maxwOverride = null) {
    const size = P ? 20 : 18, lh = P ? 0.38 : 0.34;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.96); r.moveTo(pos);
    const left = pos[0] - wd / 2 + 0.31, top = pos[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = maxwOverride ?? (P ? FW - 0.65 : 5.3);
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function dropBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  function makeHouse(x, y, name) {
    const s = P ? 0.85 : 1.0;
    const wall = new M.Rectangle({ width: 0.78 * s, height: 0.66 * s, color: C.cyan, strokeWidth: 2 });
    wall.setFill(C.card, 0.92); wall.moveTo([x, y, 0]);
    const rL = ln([x - 0.50 * s, y + 0.32 * s, 0], [x, y + 0.74 * s, 0], C.cyan, 2.8);
    const rR = ln([x, y + 0.74 * s, 0], [x + 0.50 * s, y + 0.32 * s, 0], C.cyan, 2.8);
    const door = new M.Rectangle({ width: 0.20 * s, height: 0.32 * s, color: C.cyan, strokeWidth: 1.5 });
    door.setFill(C.cyan, 0.25); door.moveTo([x, y - 0.17 * s, 0]);
    const lab = txt(`Home ${name}`, P ? 16 : 18, C.ink, [x, y - 0.54 * s, 0]);
    return new M.VGroup(wall, rL, rR, door, lab);
  }

  function makePerson(x, y, col = C.pink) {
    const head = new M.Circle({ radius: 0.11, color: col, strokeWidth: 2 });
    head.setFill(col, 0.9); head.moveTo([x, y + 0.16, 0]);
    const body = new M.Arc({ radius: 0.20, startAngle: 0, angle: Math.PI, color: col, strokeWidth: 2 });
    body.setFill(col, 0.85); body.moveTo([x, y - 0.11, 0]);
    const q = txt('?', 18, C.amber, [x + 0.26, y + 0.08, 0], true, null, true);
    return new M.VGroup(head, body, q);
  }

  function chip(label, p, col, w = 2.0, h = 0.54, size = 18) {
    const bg = rrect(w, h, p, col, 0.16, 2, 0.12, col);
    const t = txt(label, size, col, p, true, w - 0.22, true);
    return new M.VGroup(bg, t);
  }

  // ====================================================================
  // ACT 1: OPENING QUESTION (Sentences 0 - 3)
  // ====================================================================
  const H_Y = P ? 2.15 : 0.78;
  const H_SP = P ? 1.75 : 2.15;
  const houses = HOMES.map((h, i) => makeHouse((i - 1.5) * H_SP, H_Y, h));

  const mCardPos = [0, P ? -0.85 : -1.30, 0];
  const mCardW = P ? 5.2 : 5.4, mCardH = P ? 1.05 : 0.96;
  const openModel = new M.VGroup(
    rrect(mCardW, mCardH, mCardPos, C.cyan, 0.94, 2.2, 0.16, C.card),
    txt('URGENT VISIT MODEL', P ? 21 : 21, C.cyan, [0, mCardPos[1] + 0.19, 0], true, mCardW - 0.3, true),
    txt('Uses calls + pipe type', P ? 16 : 17, C.muted, [0, mCardPos[1] - 0.20, 0], false, mCardW - 0.3)
  );

  const openCalls = chip('CALLS', [P ? -1.8 : -2.35, P ? -2.25 : -2.42, 0], C.cyan, 1.85, 0.50, 16);
  const openPipe = chip('PIPE TYPE', [P ? 1.8 : 0.0, P ? -2.25 : -2.42, 0], C.cyan, 1.95, 0.50, 16);
  const openAddr = chip('+ ADDRESS', [P ? 0 : 2.45, P ? -3.15 : -2.42, 0], C.amber, 2.15, 0.54, 17);
  const openAddrArr = arrow(
    [P ? 0 : 2.45, P ? -2.86 : -2.13, 0],
    [P ? 0 : 1.55, mCardPos[1] - mCardH / 2 - 0.04, 0],
    C.amber, 2.5
  );

  const stripY = P ? 0.62 : -0.32;
  const pipeStrip = new M.VGroup(
    ln([-3.1 * (P ? 0.88 : 1), stripY, 0], [3.1 * (P ? 0.88 : 1), stripY, 0], C.cyan, 4),
    ...HOMES.map((_, i) => {
      const x = (i - 1.5) * H_SP;
      const d = new M.Dot({ point: [x, stripY, 0], radius: 0.12, color: C.cyan });
      d.setFill(C.cyan, 0.95);
      return d;
    }),
    txt('local water pipes', P ? 16 : 17, C.cyan, [0, stripY - 0.30, 0])
  );

  const peopleStrip = new M.VGroup(
    ...HOMES.map((_, i) => makePerson((i - 1.5) * H_SP, stripY + 0.04, C.pink))
  );

  // 0 — Water company wants to improve its model
  await until(S(0));
  await play(
    new M.LaggedStart(houses.map(h => new M.FadeIn(h)), { lagRatio: 0.14, runTime: 1.2 }),
    new M.FadeIn(openModel), new M.FadeIn(openCalls), new M.FadeIn(openPipe),
    ...say('WATER COMPANY: URGENT VISIT MODEL')
  );

  // 1 — Suggest adding address
  await until(S(1));
  await play(new M.FadeIn(openAddr), new M.Create(openAddrArr), ...say('IDEA: ADD HOME ADDRESS', C.amber));

  // 2 — Address may help learn where water problems occur
  await until(S(2));
  await play(new M.FadeIn(pipeStrip), new M.Indicate(openAddr, { color: C.cyan }), ...say('ADDRESS → LOCAL WATER PROBLEMS?'));

  // 3 — Or reveal something about the people living there?
  await until(S(3));
  await play(new M.FadeOut(pipeStrip), new M.FadeIn(peopleStrip), ...say('OR REVEAL INFO ABOUT PEOPLE?', C.pink));

  // ====================================================================
  // ACT 2: FOUR HOMES, ADDRESS BLOCK & AGE GROUP (Sentences 4 - 15)
  // ====================================================================
  const TX = P ? 0 : -2.90;
  const CW = P ? [1.10, 2.05, 3.65] : [1.20, 2.00, 3.20];
  const TW = CW[0] + CW[1] + CW[2];
  const TLEFT = TX - TW / 2;
  const colLeft = j => TLEFT + CW.slice(0, j).reduce((a, b) => a + b, 0);
  const colX = j => colLeft(j) + CW[j] / 2;
  const HEAD_Y = P ? 3.22 : 1.38;
  const ROW0_Y = P ? 2.48 : 0.62;
  const ROW_STEP = P ? 0.82 : 0.80;
  const ROW_H = P ? 0.70 : 0.68;
  const rowY = i => ROW0_Y - i * ROW_STEP;

  const baseRows = [];
  for (let i = 0; i < 4; i++) {
    const bg = rrect(TW, ROW_H, [TX, rowY(i), 0], C.line, i % 2 === 0 ? 0.85 : 0.55, 1.2, 0.09, C.card);
    const nm = txt(`Home ${HOMES[i]}`, 18, C.ink, [colX(0), rowY(i), 0], true, CW[0] - 0.14, true);
    baseRows.push(bg, nm);
  }
  const homeHdr = txt('Home', P ? 16 : 17, C.muted, [colX(0), HEAD_Y, 0], false, CW[0] - 0.10, true);
  const tableBase = new M.VGroup(...baseRows, homeHdr);

  const div1 = ln([colLeft(1), HEAD_Y + 0.20, 0], [colLeft(1), rowY(3) - ROW_H / 2, 0], C.line, 1.5);
  const div2 = ln([colLeft(2), HEAD_Y + 0.20, 0], [colLeft(2), rowY(3) - ROW_H / 2, 0], C.line, 1.5);
  const colDivs = new M.VGroup(div1, div2);

  const blkHdr = txt('Address block', P ? 15 : 16, C.cyan, [colX(1), HEAD_Y, 0], false, CW[1] - 0.10, true);
  const ageHdr = txt('Account age', P ? 15 : 16, C.violet, [colX(2), HEAD_Y, 0], false, CW[2] - 0.10, true);

  function colOutline(j, color) {
    const top = HEAD_Y + 0.25, bot = rowY(3) - ROW_H / 2 - 0.06;
    return rrect(CW[j] - 0.06, top - bot, [colX(j), (top + bot) / 2, 0], color, 0, 2.4, 0.10);
  }
  function pairOutline(r0, r1, color) {
    const top = rowY(r0) + ROW_H / 2 + 0.05, bot = rowY(r1) - ROW_H / 2 - 0.05;
    return rrect(TW + 0.08, top - bot, [TX, (top + bot) / 2, 0], color, 0, 2.6, 0.12);
  }

  // 4 — Look again at our four homes
  await until(S(4));
  await play(
    ...outs([...houses, openModel, openCalls, openPipe, openAddr, openAddrArr, peopleStrip]),
    new M.FadeIn(tableBase, { runTime: 0.9 }),
    ...say('OUR 4 HOMES')
  );

  // 5 — Add two new pieces of information beside each home
  const twoGuides = new M.VGroup(
    rrect(CW[1] - 0.12, ROW_H * 4 + 0.55, [colX(1), (rowY(0) + rowY(3)) / 2, 0], C.muted, 0, 1.5, 0.10),
    rrect(CW[2] - 0.12, ROW_H * 4 + 0.55, [colX(2), (rowY(0) + rowY(3)) / 2, 0], C.muted, 0, 1.5, 0.10)
  );
  await until(S(5));
  await play(new M.FadeIn(colDivs), new M.Create(twoGuides), ...say('+ 2 NEW COLUMNS'));

  // 6 — First is address block
  const colHi1 = colOutline(1, C.cyan);
  await until(S(6));
  await play(new M.FadeOut(twoGuides), new M.FadeIn(blkHdr), new M.Create(colHi1), ...say('ADDRESS BLOCK = NEARBY HOMES'));

  // 7 — Second is whether account holder is 65 or older
  const colHi2 = colOutline(2, C.violet);
  await until(S(7));
  await play(new M.FadeOut(colHi1), new M.FadeIn(ageHdr), new M.Create(colHi2), ...say('ACCOUNT HOLDER: 65+ OR YOUNGER?', C.violet));

  // Build block badges & age text cells (kept clean on left/center of age cell so guess chips fit on right!)
  const ageTextX = colX(2) - (P ? 0.42 : 0.38);
  const ageDotX = colX(2) - (P ? 1.38 : 1.24);
  const blockCells = HOMES.map((_, i) => {
    const col = blockCol(BLOCKS[i]);
    const bg = rrect(CW[1] - 0.34, ROW_H - 0.22, [colX(1), rowY(i), 0], col, 0.14, 1.8, 0.10, col);
    const lb = txt(BLOCKS[i], 18, col, [colX(1), rowY(i), 0], true, CW[1] - 0.44, true);
    return new M.VGroup(bg, lb);
  });
  const ageTextCells = HOMES.map((_, i) =>
    txt(AGES[i], P ? 17 : 17, C.ink, [ageTextX, rowY(i), 0], false, P ? 1.60 : 1.50)
  );

  // 8 — Home A: Cedar, 65+
  await until(S(8));
  await play(new M.FadeOut(colHi2), new M.FadeIn(blockCells[0]), new M.FadeIn(ageTextCells[0]), ...say('HOME A: CEDAR · 65 OR OLDER'));

  // 9 — Home B: Cedar, 65+
  await until(S(9));
  await play(new M.FadeIn(blockCells[1]), new M.FadeIn(ageTextCells[1]), ...say('HOME B: CEDAR · 65 OR OLDER'));

  // 10 — Home C: Park, under 65
  await until(S(10));
  await play(new M.FadeIn(blockCells[2]), new M.FadeIn(ageTextCells[2]), ...say('HOME C: PARK · UNDER 65', C.green));

  // 11 — Home D: Park, under 65
  await until(S(11));
  await play(new M.FadeIn(blockCells[3]), new M.FadeIn(ageTextCells[3]), ...say('HOME D: PARK · UNDER 65', C.green));

  // Purple & yellow marks
  const ageDots = HOMES.map((_, i) => {
    const col = ageCol(OLDER[i]), p = [ageDotX, rowY(i), 0];
    const halo = new M.Dot({ point: p, radius: 0.22, color: col }); halo.setFill(col, 0.22);
    const dot = new M.Dot({ point: p, radius: 0.12, color: col }); dot.setFill(col, 1);
    return new M.VGroup(halo, dot);
  });

  // 12 — Purple mark for 65 or older
  await until(S(12));
  await play(
    new M.FadeIn(ageDots[0]), new M.FadeIn(ageDots[1]),
    new M.Flash(ageDots[0].submobjects[1], { color: C.violet }),
    new M.Flash(ageDots[1].submobjects[1], { color: C.violet }),
    ...say('PURPLE MARK = 65 OR OLDER', C.violet)
  );

  // 13 — Yellow mark for younger
  await until(S(13));
  await play(
    new M.FadeIn(ageDots[2], { runTime: 0.9 }), new M.FadeIn(ageDots[3], { runTime: 0.9 }),
    new M.Flash(ageDots[2].submobjects[1], { color: C.amber, runTime: 0.9 }),
    new M.Flash(ageDots[3].submobjects[1], { color: C.amber, runTime: 0.9 }),
    ...say('YELLOW MARK = UNDER 65', C.amber)
  );

  // 14 — Both homes in Cedar have purple marks
  const cedarPair = pairOutline(0, 1, C.violet);
  await until(S(14));
  await play(
    new M.Create(cedarPair, { runTime: 0.9 }),
    new M.Indicate(ageDots[0], { color: C.violet, runTime: 0.9 }),
    new M.Indicate(ageDots[1], { color: C.violet, runTime: 0.9 }),
    ...say('CEDAR BLOCK → BOTH PURPLE', C.violet)
  );

  // 15 — Both homes in Park have yellow marks
  const parkPair = pairOutline(2, 3, C.amber);
  await until(S(15));
  await play(
    new M.FadeOut(cedarPair, { runTime: 0.8 }),
    new M.Create(parkPair, { runTime: 0.9 }),
    new M.Indicate(ageDots[2], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(ageDots[3], { color: C.amber, runTime: 0.9 }),
    ...say('PARK BLOCK → BOTH YELLOW', C.amber)
  );

  // ====================================================================
  // ACT 3: COVER AGE & GUESS — PROXY VARIABLE (Sentences 16 - 24)
  // ====================================================================
  const coverW = P ? 2.28 : 2.02;
  const coverX = colX(2) - (P ? 0.55 : 0.48);
  const coverCards = HOMES.map((_, i) => {
    const bg = rrect(coverW, ROW_H - 0.14, [coverX, rowY(i), 0], C.muted, 0.98, 2, 0.10, '#182240');
    const lb = txt('HIDDEN ?', P ? 15 : 15, C.muted, [coverX, rowY(i), 0], true, coverW - 0.2, true);
    return new M.VGroup(bg, lb);
  });

  // 16 — Cover age information with a card
  await until(S(16));
  await play(
    new M.FadeOut(parkPair),
    new M.LaggedStart(coverCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('COVER AGE WITH A CARD', C.muted)
  );

  // 17 — We can still see the address block
  const blkColHi = colOutline(1, C.cyan);
  await until(S(17));
  await play(
    new M.Create(blkColHi),
    new M.LaggedStart(blockCells.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('ADDRESS BLOCK IS STILL VISIBLE')
  );

  // Guess chips placed cleanly in the right slot of the Age column
  const guessX = colX(2) + (P ? 1.05 : 0.94);
  const checkX = colX(2) + (P ? 1.56 : 1.38);
  const guessChips = HOMES.map((_, i) => {
    const col = ageCol(OLDER[i]), p = [guessX, rowY(i), 0];
    const bg = rrect(P ? 0.78 : 0.70, ROW_H - 0.22, p, col, 0.16, 1.8, 0.10, col);
    const d = new M.Dot({ point: [p[0] + 0.15, p[1], 0], radius: 0.09, color: col }); d.setFill(col, 1);
    const g = txt('?', 16, col, [p[0] - 0.14, p[1], 0], true, null, true);
    return new M.VGroup(bg, g, d);
  });

  // 18 — Cedar -> guess purple
  await until(S(18));
  await play(
    new M.FadeOut(blkColHi),
    new M.FadeIn(guessChips[0]), new M.FadeIn(guessChips[1]),
    new M.Indicate(blockCells[0], { color: C.cyan }), new M.Indicate(blockCells[1], { color: C.cyan }),
    ...say('CEDAR → GUESS PURPLE', C.violet)
  );

  // 19 — Park -> guess yellow
  await until(S(19));
  await play(
    new M.FadeIn(guessChips[2]), new M.FadeIn(guessChips[3]),
    new M.Indicate(blockCells[2], { color: C.green }), new M.Indicate(blockCells[3], { color: C.green }),
    ...say('PARK → GUESS YELLOW', C.amber)
  );

  // 20 — Remove cards and check guesses
  await until(S(20));
  await play(
    new M.LaggedStart(coverCards.map(c => new M.FadeOut(c)), { lagRatio: 0.10, runTime: 0.9 }),
    ...say('REMOVE CARDS & CHECK')
  );

  // 21 — All four guesses are correct (short beat: 1.71s!)
  const checks = HOMES.map((_, i) => txt('✓', P ? 22 : 22, C.green, [checkX, rowY(i), 0], false, null, true));
  await until(S(21));
  await play(
    new M.LaggedStart(checks.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 0.8 }),
    ...say('ALL 4 GUESSES CORRECT ✓', C.green)
  );

  // Secondary panel zone (right on laptop, below table on phone)
  const RX = P ? 0 : 3.65;
  const panelY = P ? -2.20 : -0.25;
  const panelW = P ? 6.8 : 5.0;

  // 22 — One piece of info helps guess another
  const infoPanel = new M.VGroup(
    rrect(panelW, P ? 2.1 : 2.1, [RX, panelY, 0], C.cyan, 0.92, 2, 0.16, C.card),
    chip('FEATURE A', [RX - (P ? 1.85 : 1.38), panelY + 0.15, 0], C.cyan, P ? 2.1 : 1.75, 0.56, 16),
    arrow([RX - (P ? 0.65 : 0.42), panelY + 0.15, 0], [RX + (P ? 0.65 : 0.42), panelY + 0.15, 0], C.amber, 2.5),
    chip('FEATURE B', [RX + (P ? 1.85 : 1.38), panelY + 0.15, 0], C.violet, P ? 2.1 : 1.75, 0.56, 16),
    txt('helps us guess', P ? 16 : 16, C.amber, [RX, panelY - 0.55, 0], true)
  );
  await until(S(22));
  await play(
    ...outs([...guessChips, ...checks]),
    new M.FadeIn(infoPanel),
    ...say('ONE FEATURE REVEALS ANOTHER')
  );

  // 23 — Called a proxy variable
  const defPanel = new M.VGroup(
    rrect(panelW, P ? 2.2 : 2.2, [RX, panelY, 0], C.amber, 0.94, 2.2, 0.16, C.card),
    txt('PROXY VARIABLE', P ? 24 : 23, C.amber, [RX, panelY + 0.48, 0], true, panelW - 0.4, true),
    txt('One feature that reveals', P ? 17 : 17, C.ink, [RX, panelY - 0.08, 0], false, panelW - 0.4),
    txt('or stands in for another', P ? 17 : 17, C.ink, [RX, panelY - 0.50, 0], false, panelW - 0.4)
  );
  await until(S(23));
  await play(new M.FadeOut(infoPanel), new M.FadeIn(defPanel), ...say('PROXY VARIABLE', C.amber));

  // 24 — Address block acts as a proxy for age group
  const exPanel = new M.VGroup(
    rrect(panelW, P ? 2.2 : 2.2, [RX, panelY, 0], C.violet, 0.94, 2.2, 0.16, C.card),
    chip('ADDRESS BLOCK', [RX, panelY + 0.58, 0], C.cyan, P ? 3.4 : 3.0, 0.52, 16),
    txt('acts as a proxy for', P ? 15 : 15, C.muted, [RX, panelY, 0], true),
    chip('AGE GROUP (65+)', [RX, panelY - 0.58, 0], C.violet, P ? 3.4 : 3.0, 0.52, 16)
  );
  await until(S(24));
  await play(new M.FadeOut(defPanel), new M.FadeIn(exPanel), ...say('ADDRESS BLOCK = PROXY FOR AGE', C.violet));

  // ====================================================================
  // ACT 4: MEASURE THE MATCH — BAR CHART & FORMULA (Sentences 25 - 37)
  // ====================================================================
  const BAR_BASE = P ? -2.92 : -0.50;
  const BAR_H = P ? 1.60 : 1.55;
  const BAR_TOP = BAR_BASE + BAR_H;
  const CH_L = P ? -1.90 : 2.05;
  const CH_R = P ? 2.60 : 5.45;
  const CEDAR_X = P ? -0.55 : 2.95;
  const PARK_X = P ? 1.35 : 4.55;
  const BAR_W = P ? 1.05 : 0.95;

  const chartParts = [
    txt('Share aged 65+', P ? 18 : 18, C.ink, [(CH_L + CH_R) / 2, BAR_TOP + 0.50, 0], false, null, true),
    ln([CH_L, BAR_BASE, 0], [CH_R, BAR_BASE, 0], C.muted, 2.2),
    new M.DashedLine({ start: [CH_L, BAR_BASE + BAR_H * 0.5, 0], end: [CH_R, BAR_BASE + BAR_H * 0.5, 0], color: C.grid, strokeWidth: 1.4 }),
    new M.DashedLine({ start: [CH_L, BAR_TOP, 0], end: [CH_R, BAR_TOP, 0], color: C.grid, strokeWidth: 1.4 }),
    txt('0%', 15, C.muted, [CH_L - 0.42, BAR_BASE, 0], true),
    txt('50%', 15, C.muted, [CH_L - 0.46, BAR_BASE + BAR_H * 0.5, 0], true),
    txt('100%', 15, C.muted, [CH_L - 0.52, BAR_TOP, 0], true),
    txt('Cedar', P ? 17 : 17, C.cyan, [CEDAR_X, BAR_BASE - 0.30, 0], true, null, true),
    txt('Park', P ? 17 : 17, C.green, [PARK_X, BAR_BASE - 0.30, 0], true, null, true)
  ];
  const chartFrame = new M.VGroup(...chartParts);

  // 25 — Measure how closely address block matches age group
  await until(S(25));
  await play(new M.FadeOut(exPanel), new M.FadeIn(chartFrame), ...say('MEASURE THE MATCH'));

  // 26 — Start with two homes in Cedar block
  const cedarHi = pairOutline(0, 1, C.cyan);
  await until(S(26));
  await play(new M.Create(cedarHi, { runTime: 0.9 }), ...say('CEDAR BLOCK: 2 HOMES'));

  // 27 — Both are 65 or older
  await until(S(27));
  await play(
    new M.Indicate(ageDots[0], { color: C.violet }),
    new M.Indicate(ageDots[1], { color: C.violet }),
    ...say('BOTH ARE 65+ (2 OF 2)', C.violet)
  );

  // 28 — Two out of two gives 100%
  await until(S(28));
  await play(
    ...fbox(['Cedar block (aged 65+)', ['2 ÷ 2 = 100%', C.violet]], C.violet),
    ...say('2 OUT OF 2 = 100%', C.violet)
  );

  // 29 — Draw bar reaching 100% for Cedar
  const cedarBar = new M.Rectangle({ width: BAR_W, height: 0.04, color: C.violet, strokeWidth: 2 });
  cedarBar.setFill(C.violet, 0.85); cedarBar.moveTo([CEDAR_X, BAR_BASE + 0.02, 0]);
  const cedarBarFull = new M.Rectangle({ width: BAR_W, height: BAR_H, color: C.violet, strokeWidth: 2 });
  cedarBarFull.setFill(C.violet, 0.85); cedarBarFull.moveTo([CEDAR_X, BAR_BASE + BAR_H / 2, 0]);
  const cedarVal = txt('100%', P ? 18 : 18, C.violet, [CEDAR_X, BAR_TOP + 0.22, 0], true, null, true);
  await until(S(29));
  await play(
    new M.Transform(cedarBar, cedarBarFull, { runTime: 1.1 }),
    new M.FadeIn(cedarVal),
    ...say('CEDAR BAR = 100%', C.violet)
  );

  // 30 — Now look at two homes in Park block
  const parkHi = pairOutline(2, 3, C.green);
  await until(S(30));
  await play(new M.FadeOut(cedarHi, { runTime: 0.8 }), new M.Create(parkHi, { runTime: 0.9 }), ...say('PARK BLOCK: 2 HOMES', C.green));

  // 31 — Neither account holder is 65 or older
  await until(S(31));
  await play(
    new M.Indicate(ageDots[2], { color: C.amber }),
    new M.Indicate(ageDots[3], { color: C.amber }),
    ...say('NEITHER IS 65+ (0 OF 2)', C.amber)
  );

  // 32 — Zero out of two gives 0%
  await until(S(32));
  await play(
    ...fbox(['Park block (aged 65+)', ['0 ÷ 2 = 0%', C.amber]], C.amber),
    ...say('0 OUT OF 2 = 0%', C.amber)
  );

  // 33 — Draw bar of height zero for Park
  const parkBar = new M.Rectangle({ width: BAR_W, height: 0.06, color: C.amber, strokeWidth: 2 });
  parkBar.setFill(C.amber, 0.95); parkBar.moveTo([PARK_X, BAR_BASE + 0.03, 0]);
  const parkVal = txt('0%', P ? 18 : 18, C.amber, [PARK_X, BAR_BASE + 0.26, 0], true, null, true);
  await until(S(33));
  await play(new M.FadeOut(parkHi), new M.FadeIn(parkBar), new M.FadeIn(parkVal), ...say('PARK BAR = 0%', C.amber));

  // 34 — Write calculation as a short formula
  await until(S(34));
  await play(...fbox([['Share of 65+ in a block:', C.cyan]], C.cyan), ...say('WRITE IT AS A FORMULA'));

  // 35 — Share = count aged 65+ / all in that block
  await until(S(35));
  await play(
    ...fbox([['share = (aged 65+ in block)', C.ink], ['      ÷ (all homes in block)', C.cyan]], C.cyan),
    ...say('65+ COUNT ÷ ALL IN BLOCK')
  );

  // 36 — Multiply by 100 for percentage
  await until(S(36));
  await play(
    ...fbox([
      ['share (%) = (65+ ÷ all) × 100', C.ink],
      ['Cedar: 2÷2×100 = 100%', C.violet],
      ['Park:  0÷2×100 = 0%', C.amber]
    ], C.amber),
    ...say('MULTIPLY BY 100 FOR PERCENT', C.amber)
  );

  // 37 — Address block reveals age group perfectly
  await until(S(37));
  await play(
    new M.Indicate(cedarBar, { color: C.violet }),
    new M.Indicate(parkVal, { color: C.amber }),
    ...say('100% VS 0%: PERFECT MATCH', C.amber)
  );

  // ====================================================================
  // ACT 5: ORIGINAL VS NEW MODEL — INDIRECT USE (Sentences 38 - 46)
  // ====================================================================
  const act5 = [];
  const fCallsPos = P ? [-2.00, 2.95, 0] : [-4.35, 1.05, 0];
  const fPipePos  = P ? [-2.00, 2.15, 0] : [-4.35, 0.25, 0];
  const fAddrPos  = P ? [-2.00, 1.35, 0] : [-4.35, -0.75, 0];
  const fAgePos   = P ? [-2.00, 0.55, 0] : [-4.35, -1.65, 0];
  const featW = P ? 2.70 : 2.60, featH = 0.56;

  const fCalls = chip('CALLS', fCallsPos, C.cyan, featW, featH, 16);
  const fPipe  = chip('PIPE TYPE', fPipePos, C.cyan, featW, featH, 16);
  const fAddrDim = chip('ADDRESS BLOCK', fAddrPos, C.muted, featW, featH, 15);
  const fAgeDim  = chip('AGE 65+', fAgePos, C.muted, featW, featH, 16);

  const modPos = P ? [1.95, 2.05, 0] : [0.0, 0.20, 0];
  const modW = P ? 2.60 : 3.0, modH = P ? 1.40 : 1.32;
  const origMod = new M.VGroup(
    rrect(modW, modH, modPos, C.cyan, 0.94, 2.2, 0.16, C.card),
    txt('ORIGINAL', P ? 20 : 20, C.cyan, [modPos[0], modPos[1] + 0.18, 0], true, modW - 0.3, true),
    txt('MODEL', P ? 20 : 20, C.cyan, [modPos[0], modPos[1] - 0.18, 0], true, modW - 0.3, true)
  );
  const arrCalls = arrow(
    [fCallsPos[0] + featW / 2 + 0.06, fCallsPos[1], 0],
    P ? [modPos[0] - modW / 2 - 0.06, modPos[1] + 0.45, 0] : [modPos[0] - modW / 2 - 0.06, modPos[1] + 0.32, 0],
    C.cyan, 2.4
  );
  const arrPipe = arrow(
    [fPipePos[0] + featW / 2 + 0.06, fPipePos[1], 0],
    P ? [modPos[0] - modW / 2 - 0.06, modPos[1] + 0.08, 0] : [modPos[0] - modW / 2 - 0.06, modPos[1] - 0.04, 0],
    C.cyan, 2.4
  );

  // 38 — Original model uses only calls and pipe
  await until(S(38));
  await play(
    ...outs([tableBase, colDivs, blkHdr, ageHdr, ...blockCells, ...ageTextCells, ...ageDots, chartFrame, cedarBar, cedarVal, parkBar, parkVal]),
    ...dropBox(),
    new M.FadeIn(fCalls), new M.FadeIn(fPipe), new M.FadeIn(origMod),
    new M.Create(arrCalls), new M.Create(arrPipe),
    ...say('ORIGINAL MODEL: CALLS + PIPE ONLY')
  );
  act5.push(fCalls, fPipe, arrCalls, arrPipe);

  // 39 — Uses neither address block nor age group
  const xAddr = txt('×', 24, C.pink, [fAddrPos[0] + featW / 2 + 0.22, fAddrPos[1], 0], false, null, true);
  const xAge  = txt('×', 24, C.pink, [fAgePos[0] + featW / 2 + 0.25, fAgePos[1], 0], false, null, true);
  await until(S(39));
  await play(
    new M.FadeIn(fAddrDim), new M.FadeIn(fAgeDim), new M.FadeIn(xAddr), new M.FadeIn(xAge),
    ...say('NOT USED: ADDRESS OR AGE', C.muted)
  );
  act5.push(fAgeDim, xAge);

  // 40 — New model uses address block, not age group
  const fAddrOn = chip('ADDRESS BLOCK', fAddrPos, C.amber, featW, featH, 15);
  const newMod = new M.VGroup(
    rrect(modW, modH, modPos, C.amber, 0.94, 2.4, 0.16, C.card),
    txt('NEW MODEL', P ? 20 : 20, C.amber, [modPos[0], modPos[1] + 0.16, 0], true, modW - 0.3, true),
    txt('+ address block', P ? 15 : 15, C.ink, [modPos[0], modPos[1] - 0.22, 0], false, modW - 0.3)
  );
  const arrAddr = arrow(
    [fAddrPos[0] + featW / 2 + 0.06, fAddrPos[1], 0],
    P ? [modPos[0] - modW / 2 - 0.06, modPos[1] - 0.40, 0] : [modPos[0] - modW / 2 - 0.06, modPos[1] - 0.38, 0],
    C.amber, 2.6
  );
  await until(S(40));
  await play(
    new M.FadeOut(origMod), new M.FadeOut(fAddrDim), new M.FadeOut(xAddr),
    new M.FadeIn(newMod), new M.FadeIn(fAddrOn), new M.Create(arrAddr),
    ...say('NEW MODEL: USES ADDRESS, NOT AGE', C.amber)
  );
  act5.push(newMod, fAddrOn, arrAddr);

  // 41 — Could learn to treat the two address blocks differently
  const outCedarPos = P ? [-1.85, -0.95, 0] : [4.25, 0.85, 0];
  const outParkPos  = P ? [1.85, -0.95, 0]  : [4.25, -0.75, 0];
  const outW = P ? 2.85 : 2.90, outH = 0.66;
  const outCedar = chip('CEDAR BLOCK', outCedarPos, C.cyan, outW, outH, 16);
  const outPark  = chip('PARK BLOCK', outParkPos, C.green, outW, outH, 16);
  const arrOutC = arrow(
    P ? [modPos[0] - 0.75, modPos[1] - modH / 2 - 0.06, 0] : [modPos[0] + modW / 2 + 0.06, modPos[1] + 0.25, 0],
    P ? [outCedarPos[0] + outW / 2 - 0.30, outCedarPos[1] + outH / 2 + 0.06, 0] : [outCedarPos[0] - outW / 2 - 0.06, outCedarPos[1], 0],
    C.cyan, 2.4
  );
  const arrOutP = arrow(
    P ? [modPos[0] + 0.30, modPos[1] - modH / 2 - 0.06, 0] : [modPos[0] + modW / 2 + 0.06, modPos[1] - 0.25, 0],
    P ? [outParkPos[0], outParkPos[1] + outH / 2 + 0.06, 0] : [outParkPos[0] - outW / 2 - 0.06, outParkPos[1], 0],
    C.green, 2.4
  );
  await until(S(41));
  await play(
    new M.Create(arrOutC), new M.Create(arrOutP),
    new M.FadeIn(outCedar), new M.FadeIn(outPark),
    ...say('TREATS CEDAR & PARK DIFFERENTLY')
  );
  act5.push(arrOutC, arrOutP, outCedar, outPark);

  // 42 — Indirectly treat the two age groups differently
  const tagOlder = chip('● AGED 65+', [outCedarPos[0], outCedarPos[1] - 0.68, 0], C.violet, outW, 0.50, 15);
  const tagYoung = chip('● UNDER 65', [outParkPos[0], outParkPos[1] - 0.68, 0], C.amber, outW, 0.50, 15);
  await until(S(42));
  await play(
    new M.FadeIn(tagOlder), new M.FadeIn(tagYoung),
    ...say('INDIRECTLY TREATS AGE DIFFERENTLY', C.pink)
  );
  act5.push(tagOlder, tagYoung);

  // 43 — Age is sensitive information (fairness concern)
  const sensBox = rrect(featW + 0.22, featH + 0.20, fAgePos, C.pink, 0, 2.8, 0.14);
  const sensLabel = txt(
    'SENSITIVE INFO · FAIRNESS CONCERN',
    P ? 16 : 17, C.pink,
    [0, P ? -2.75 : -2.55, 0], true, FW - 0.9, true
  );
  await until(S(43));
  await play(new M.Create(sensBox), new M.FadeIn(sensLabel), ...say('AGE = SENSITIVE INFORMATION', C.pink));
  act5.push(sensBox, sensLabel);

  // 44 — Removing sensitive info does not always prevent learning about it
  const leakArr = P
    ? arrow([fAgePos[0] - featW / 2 - 0.22, fAgePos[1], 0], [fAddrPos[0] - featW / 2 - 0.22, fAddrPos[1], 0], C.pink, 2.8, true)
    : arrow([fAgePos[0] - featW / 2 - 0.35, fAgePos[1], 0], [fAddrPos[0] - featW / 2 - 0.35, fAddrPos[1], 0], C.pink, 2.8, true);
  const leakTag = txt('proxy', 15, C.pink,
    P ? [fAgePos[0], fAgePos[1] - 0.50, 0] : [fAgePos[0] - featW / 2 - 0.72, (fAgePos[1] + fAddrPos[1]) / 2, 0],
    true, null, true);
  await until(S(44));
  await play(
    new M.Create(leakArr), new M.FadeIn(leakTag),
    new M.Indicate(fAddrOn, { color: C.pink }),
    ...say('REMOVING AGE ≠ BLOCKING AGE', C.pink)
  );
  act5.push(leakArr, leakTag);

  // 45 — Checking for proxy variables finds indirect features
  const auditAddrHi = rrect(featW + 0.22, featH + 0.20, fAddrPos, C.green, 0, 2.8, 0.14);
  await until(S(45));
  await play(
    new M.Create(auditAddrHi),
    new M.Indicate(fAddrOn, { color: C.green }),
    ...say('AUDIT: CHECK FOR PROXY VARIABLES', C.green)
  );
  act5.push(auditAddrHi);

  // 46 — Examine whether using those features leads to unfair decisions
  const decBox = P
    ? rrect(7.0, 1.80, [0, -1.30, 0], C.green, 0, 2.4, 0.16)
    : rrect(3.35, 3.05, [4.25, -0.28, 0], C.green, 0, 2.4, 0.16);
  await until(S(46));
  await play(
    new M.Create(decBox),
    new M.Indicate(tagOlder, { color: C.green }),
    new M.Indicate(tagYoung, { color: C.green }),
    ...say('EXAMINE DECISIONS FOR FAIRNESS', C.green)
  );
  act5.push(decBox);

  // ====================================================================
  // ACT 6: CAUTIONS, SAMPLE SIZE & RECAP (Sentences 47 - 51)
  // ====================================================================
  const cNodePos = P ? [0, 1.85, 0] : [-3.75, -0.15, 0];
  const pipeOutPos = P ? [-1.85, -0.35, 0] : [2.55, 0.75, 0];
  const ageOutPos  = P ? [1.85, -0.35, 0]  : [2.55, -1.05, 0];
  const cW = P ? 3.2 : 3.5, cH = 0.80;

  const cautionBanner = new M.VGroup(
    rrect(P ? 6.8 : 9.4, 0.85, [0, P ? -2.45 : -2.35, 0], C.amber, 0.92, 2.2, 0.16, C.card),
    txt('Finding a proxy does NOT prove unfair use', P ? 17 : 19, C.amber, [0, P ? -2.45 : -2.35, 0], true, P ? 6.4 : 8.9, true)
  );
  const cAddr = chip('ADDRESS BLOCK', cNodePos, C.amber, P ? 3.2 : 3.1, 0.68, 17);

  // 47 — Finding a proxy does not prove unfair use
  await until(S(47));
  await play(
    ...clearList(act5),
    new M.FadeIn(cAddr), new M.FadeIn(cautionBanner),
    ...say('CAUTION: PROXY ≠ PROOF OF UNFAIRNESS', C.amber)
  );

  // 48 — Address may also contain useful info about local water pipes
  const usefulCard = new M.VGroup(
    rrect(cW, cH, pipeOutPos, C.cyan, 0.16, 2, 0.14, C.cyan),
    txt('LOCAL WATER PIPES', P ? 15 : 16, C.cyan, [pipeOutPos[0], pipeOutPos[1] + 0.15, 0], true, cW - 0.22, true),
    txt('useful repair signal', 15, C.ink, [pipeOutPos[0], pipeOutPos[1] - 0.17, 0], false, cW - 0.22)
  );
  const proxyCard = new M.VGroup(
    rrect(cW, cH, ageOutPos, C.violet, 0.16, 2, 0.14, C.violet),
    txt('AGE GROUP (65+)', P ? 15 : 16, C.violet, [ageOutPos[0], ageOutPos[1] + 0.15, 0], true, cW - 0.22, true),
    txt('proxy overlap', 15, C.ink, [ageOutPos[0], ageOutPos[1] - 0.17, 0], false, cW - 0.22)
  );
  const cArr1 = arrow(
    P ? [-0.5, cNodePos[1] - 0.38, 0] : [cNodePos[0] + 1.62, cNodePos[1] + 0.14, 0],
    P ? [pipeOutPos[0], pipeOutPos[1] + cH / 2 + 0.06, 0] : [pipeOutPos[0] - cW / 2 - 0.08, pipeOutPos[1], 0],
    C.cyan, 2.5
  );
  const cArr2 = arrow(
    P ? [0.5, cNodePos[1] - 0.38, 0] : [cNodePos[0] + 1.62, cNodePos[1] - 0.14, 0],
    P ? [ageOutPos[0], ageOutPos[1] + cH / 2 + 0.06, 0] : [ageOutPos[0] - cW / 2 - 0.08, ageOutPos[1], 0],
    C.violet, 2.5, true
  );
  await until(S(48));
  await play(
    new M.Create(cArr1), new M.Create(cArr2),
    new M.FadeIn(usefulCard), new M.FadeIn(proxyCard),
    ...say('ADDRESS ALSO SIGNALS LOCAL PIPES')
  );

  // 49 — Four homes are too few for the whole town
  const smPos = P ? [0, 1.90, 0] : [-3.85, -0.35, 0];
  const smW = P ? 5.8 : 3.4, smH = P ? 1.85 : 2.55;
  const smallBox = new M.VGroup(
    rrect(smW, smH, smPos, C.amber, 0.90, 2, 0.16, C.card),
    txt('OUR 4 HOMES', P ? 17 : 17, C.amber, [smPos[0], smPos[1] + smH / 2 - 0.32, 0], true, smW - 0.3, true),
    ...[-1.5, -0.5, 0.5, 1.5].map((k, i) => {
      const p = P
        ? [smPos[0] + k * 1.15, smPos[1] - 0.22, 0]
        : [smPos[0] + (i % 2 === 0 ? -0.65 : 0.65), smPos[1] + (i < 2 ? 0.15 : -0.65), 0];
      const d = new M.Dot({ point: p, radius: 0.18, color: ageCol(OLDER[i]) }); d.setFill(ageCol(OLDER[i]), 0.95);
      return d;
    })
  );

  const tnPos = P ? [0, -1.65, 0] : [2.15, -0.35, 0];
  const tnW = P ? 6.6 : 6.4, tnH = P ? 3.55 : 3.25;
  const townFrame = new M.VGroup(
    rrect(tnW, tnH, tnPos, C.muted, 0.85, 2, 0.16, C.card),
    txt('THE WHOLE TOWN', P ? 17 : 18, C.muted, [tnPos[0], tnPos[1] + tnH / 2 - 0.34, 0], true, tnW - 0.3, true)
  );
  const townPts = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      townPts.push([
        tnPos[0] + (c - 2.5) * (P ? 0.92 : 0.92),
        tnPos[1] + 0.62 - r * (P ? 0.66 : 0.62),
        0
      ]);
    }
  }
  const qDots = townPts.map(p => txt('?', 18, C.muted, p, true));

  await until(S(49));
  await play(
    ...outs([cAddr, cautionBanner, usefulCard, proxyCard, cArr1, cArr2]),
    new M.FadeIn(smallBox), new M.FadeIn(townFrame),
    new M.LaggedStart(qDots.map(q => new M.FadeIn(q)), { lagRatio: 0.02, runTime: 1.0 }),
    ...say('4 HOMES IS TOO SMALL A SAMPLE', C.amber)
  );

  // 50 — Need more data to check how closely connected
  const townPattern = [
    1, 1, 0, 1, 0, 0,
    1, 0, 1, 0, 1, 0,
    1, 1, 1, 0, 0, 1,
    0, 1, 0, 0, 1, 0
  ];
  const realDots = townPts.map((p, idx) => {
    const col = townPattern[idx] ? C.violet : C.amber;
    const d = new M.Dot({ point: p, radius: 0.14, color: col }); d.setFill(col, 0.92);
    return d;
  });
  const moreHi = rrect(tnW + 0.12, tnH + 0.12, tnPos, C.green, 0, 2.4, 0.18);
  await until(S(50));
  await play(
    ...outs(qDots),
    new M.Create(moreHi),
    new M.LaggedStart(realDots.map(d => new M.FadeIn(d)), { lagRatio: 0.03, runTime: 1.2 }),
    ...say('COLLECT MORE DATA TO CHECK', C.green)
  );

  // 51 — Recap: proxy variable can reveal info never given directly
  const r1Pos = P ? [0, 2.05, 0]  : [-4.45, 0.25, 0];
  const r2Pos = P ? [0, 0.25, 0]  : [0.0, 0.25, 0];
  const r3Pos = P ? [0, -1.55, 0] : [4.45, 0.25, 0];
  const rw = P ? 4.4 : 3.2, rh = 0.82;
  const rHidden = chip('HIDDEN INFO (AGE)', r1Pos, C.violet, rw, rh, 16);
  const rProxy  = chip('PROXY (ADDRESS)', r2Pos, C.cyan, rw, rh, 16);
  const rModel  = chip('MODEL', r3Pos, C.amber, P ? 3.2 : 2.6, rh, 17);
  const rArr1 = arrow(
    P ? [0, r1Pos[1] - rh / 2 - 0.06, 0] : [r1Pos[0] + rw / 2 + 0.08, r1Pos[1], 0],
    P ? [0, r2Pos[1] + rh / 2 + 0.06, 0] : [r2Pos[0] - rw / 2 - 0.08, r2Pos[1], 0],
    C.violet, 2.6, true
  );
  const rArr2 = arrow(
    P ? [0, r2Pos[1] - rh / 2 - 0.06, 0] : [r2Pos[0] + rw / 2 + 0.08, r2Pos[1], 0],
    P ? [0, r3Pos[1] + rh / 2 + 0.06, 0] : [r3Pos[0] - (P ? 1.6 : 1.3) - 0.08, r3Pos[1], 0],
    C.cyan, 2.6
  );

  await until(S(51));
  await play(
    ...outs([smallBox, townFrame, moreHi, ...realDots]),
    new M.FadeIn(rHidden), new M.Create(rArr1),
    new M.FadeIn(rProxy), new M.Create(rArr2),
    new M.FadeIn(rModel),
    ...fbox([
      ['Proxy variable:', C.amber],
      ['reveals hidden information we never', C.ink],
      ['gave directly to the model.', C.ink]
    ], C.cyan, P ? [0, -3.75, 0] : [0, -1.85, 0], P ? FW - 0.7 : 9.2),
    ...say('PROXY REVEALS HIDDEN INFORMATION')
  );
}
