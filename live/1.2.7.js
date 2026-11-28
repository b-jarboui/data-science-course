// 1.2.7 Weighted means: when bigger groups count more.
// Beat i = sentence i (0-based, 0..53). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Shared café numbers (chapters/1.2.md):
  // Morning: 8 customers, sum = 24, mean = 3 min
  // Lunch:  16 customers, sum = 24, mean = 1.5 min
  const M_RAW = [3, 1, 4, 2, 3, 6, 2, 3];
  const L_RAW = [1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 2, 1, 1, 1];

  // Responsive layout constants
  // Phone: 8 x 14.22, keep content within y in [-5.5, 4.3]
  // Laptop: 14.22 x 8, keep content within y in [-3.0, 2.3]
  const PILL = P ? [0, 1.75, 0] : [0, 1.90, 0];
  const BOXP = P ? [0, 3.15, 0] : [4.60, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Bar-chart geometry (24 stacks: 8 morning + gap + 16 lunch)
  const SP = P ? 0.27 : 0.32;
  const BW = P ? 0.20 : 0.24;
  const GAP = P ? 0.36 : 0.44;
  const X_START = P ? -3.10 : -6.10;
  const BASE = P ? -4.30 : -2.25;
  const PITCH = P ? 0.72 : 0.56;

  const mx = k => X_START + k * SP;
  const lx = k => X_START + 7 * SP + GAP + SP + k * SP;
  const MCX = (mx(0) + mx(7)) / 2;
  const LCX = (lx(0) + lx(15)) / 2;
  const AXIS_X = X_START - (P ? 0.24 : 0.30);
  const RIGHT_X = lx(15) + (P ? 0.22 : 0.26);

  const yAt = h => BASE + h * PITCH;
  const mSlot = (k, j) => [mx(k), BASE + (j + 0.5) * PITCH, 0];
  const lSlot = (k, j) => [lx(k), BASE + (j + 0.5) * PITCH, 0];
  const lHalfSlot = (k, which) => [lx(k), BASE + (1.25 + which * 0.5) * PITCH, 0];

  const wholeBlock = (p, color = C.cyan, w = BW) => {
    const b = new M.Rectangle({ width: w, height: PITCH * 0.86, color, strokeWidth: 1.2 });
    b.setFill(color, 0.84);
    b.moveTo(p);
    return b;
  };
  const halfBlock = (p, color = C.pink, w = BW) => {
    const b = new M.Rectangle({ width: w, height: PITCH * 0.41, color, strokeWidth: 1.2 });
    b.setFill(color, 0.86);
    b.moveTo(p);
    return b;
  };

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.40 : 0.39;
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
    const maxw = P ? FW - 0.8 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function hideBoxA() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  function personIcon(x, y, color, sc = 1) {
    const head = new M.Circle({ radius: 0.10 * sc, color }); head.setFill(color, 1); head.moveTo([x, y + 0.24 * sc, 0]);
    const body = new M.Arc({ radius: 0.18 * sc, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y, 0]);
    return new M.VGroup(head, body);
  }

  // --- Beat 0: quiet morning and busy lunch café shifts ---
  const mCardPos = P ? [0, -0.05, 0] : [-3.35, -0.45, 0];
  const lCardPos = P ? [0, -3.25, 0] : [2.85, -0.45, 0];
  const mCardW = P ? 6.6 : 5.0, mCardH = P ? 2.45 : 3.0;
  const lCardW = P ? 6.6 : 5.8, lCardH = P ? 2.95 : 3.0;

  const mCardBox = new M.RoundedRectangle({ width: mCardW, height: mCardH, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2 });
  mCardBox.setFill(C.card, 0.92); mCardBox.moveTo(mCardPos);
  const mCardTitle = T('Morning shift · quiet', P ? 22 : 22, C.cyan);
  mCardTitle.moveTo([mCardPos[0], mCardPos[1] + mCardH / 2 - 0.42, 0]);
  const mCardSub = T('8 customers', P ? 18 : 19, C.muted, true);
  mCardSub.moveTo([mCardPos[0], mCardPos[1] - mCardH / 2 + 0.36, 0]);
  const mIcons = Array.from({ length: 8 }, (_, k) =>
    personIcon(mCardPos[0] + (k - 3.5) * (P ? 0.68 : 0.54), mCardPos[1] - 0.12, C.cyan, P ? 1.0 : 0.9));
  const mCard = new M.VGroup(mCardBox, mCardTitle, mCardSub, ...mIcons);

  const lCardBox = new M.RoundedRectangle({ width: lCardW, height: lCardH, cornerRadius: 0.2, color: C.pink, strokeWidth: 2 });
  lCardBox.setFill(C.card, 0.92); lCardBox.moveTo(lCardPos);
  const lCardTitle = T('Lunch shift · busy', P ? 22 : 22, C.pink);
  lCardTitle.moveTo([lCardPos[0], lCardPos[1] + lCardH / 2 - 0.42, 0]);
  const lCardSub = T('16 customers', P ? 18 : 19, C.muted, true);
  lCardSub.moveTo([lCardPos[0], lCardPos[1] - lCardH / 2 + 0.36, 0]);
  const lIcons = Array.from({ length: 16 }, (_, k) => {
    const row = Math.floor(k / 8), col = k % 8;
    const px = lCardPos[0] + (col - 3.5) * (P ? 0.68 : 0.60);
    const py = lCardPos[1] + (row === 0 ? 0.16 : -0.46);
    return personIcon(px, py, C.pink, P ? 0.95 : 0.86);
  });
  const lCard = new M.VGroup(lCardBox, lCardTitle, lCardSub, ...lIcons);

  await until(S(0));
  await play(new M.FadeIn(mCard), new M.FadeIn(lCard), ...say('MORNING (8)  VS  LUNCH (16)'));

  // --- Beat 1: one typical wait time across both shifts ---
  const bothBox = new M.RoundedRectangle({
    width: P ? 7.1 : 11.9, height: P ? 6.45 : 3.55,
    cornerRadius: 0.24, color: C.amber, strokeWidth: 2
  });
  bothBox.moveTo(P ? [0, -1.78, 0] : [-0.05, -0.45, 0]);
  await until(S(1));
  await play(new M.Create(bothBox), ...say('ONE TYPICAL WAIT ACROSS BOTH?', C.amber));

  // --- Beat 2: each customer's wait as a stack of minute-blocks ---
  const floor = new M.Line({ start: [AXIS_X, BASE, 0], end: [RIGHT_X, BASE, 0], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: [AXIS_X, BASE, 0], end: [AXIS_X, yAt(6) + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const yTicks = [0, 1, 2, 3, 4, 5, 6].map(v => new M.VGroup(
    new M.Line({ start: [AXIS_X - 0.08, yAt(v), 0], end: [AXIS_X + 0.05, yAt(v), 0], color: C.muted, strokeWidth: 1.5 }),
    T(String(v), P ? 15 : 16, C.muted, true).moveTo([AXIS_X - (P ? 0.28 : 0.28), yAt(v), 0])
  ));
  const mFloorLab = T('Morning (8)', P ? 16 : 18, C.cyan, true);
  mFloorLab.moveTo([MCX, BASE - (P ? 0.36 : 0.32), 0]);
  const lFloorLab = T('Lunch (16)', P ? 16 : 18, C.pink, true);
  lFloorLab.moveTo([LCX, BASE - (P ? 0.36 : 0.32), 0]);
  const blockNote = T('1 block = 1 minute', P ? 15 : 16, C.muted);
  blockNote.moveTo([(AXIS_X + RIGHT_X) / 2, BASE - (P ? 0.78 : 0.66), 0]);

  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(mCard, lCard, bothBox), { runTime: 0.6 }), ...say('EACH BLOCK = 1 MINUTE'));
  await play(new M.Create(floor, { runTime: 0.7 }), new M.Create(yAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...yTicks, mFloorLab, lFloorLab, blockNote), { runTime: 0.7 }));

  // --- Beat 3: morning's 8 uneven stacks (1 to 6) ---
  const mStacks = M_RAW.map((v, k) => Array.from({ length: v }, (_, j) => wholeBlock(mSlot(k, j), C.cyan)));
  await until(S(3));
  await play(
    new M.LaggedStart(mStacks.map(st => new M.LaggedStart(st.map(b => new M.FadeIn(b)), { lagRatio: 0.08 })),
      { lagRatio: 0.1, runTime: 1.8 }),
    ...say('MORNING: 8 STACKS (1 TO 6 MIN)', C.cyan)
  );

  // --- Beat 4: lunch's 16 uneven stacks, mostly shorter ---
  const lStacks = L_RAW.map((v, k) => Array.from({ length: v }, (_, j) => wholeBlock(lSlot(k, j), C.pink)));
  await until(S(4));
  await play(
    new M.LaggedStart(lStacks.map(st => new M.LaggedStart(st.map(b => new M.FadeIn(b)), { lagRatio: 0.08 })),
      { lagRatio: 0.06, runTime: 1.9 }),
    ...say('LUNCH: 16 STACKS (SHORTER)', C.pink)
  );

  // --- Beat 5: level each shift by sharing its blocks equally ---
  await until(S(5));
  await play(...say('LEVEL EACH SHIFT SEPARATELY', C.amber));

  // --- Beat 6: no blocks added or lost, totals stay the same ---
  await until(S(6));
  await play(
    ...fbox([['Morning: 24 blocks', C.cyan], ['Lunch:   24 blocks', C.pink], ['Totals stay the same', C.muted]], C.violet),
    ...say('NO BLOCKS ADDED OR LOST', C.violet)
  );

  // --- Beat 7: morning's 8 stacks level to 3 minutes each ---
  // Excess in M_RAW [3,1,4,2,3,6,2,3]: stack 2 has +1, stack 5 has +3 (4 blocks total)
  // Short in M_RAW: stack 1 needs +2, stack 3 needs +1, stack 6 needs +1 (4 slots)
  const mNeed = [[1, 1], [1, 2], [3, 2], [6, 2]];
  const mMoves = [];
  for (const [toK, toJ] of mNeed) {
    const fromK = [2, 5].find(k => mStacks[k].length > 3);
    const b = mStacks[fromK].pop();
    mStacks[toK].push(b);
    mMoves.push(new M.Transform(b, wholeBlock(mSlot(toK, toJ), C.cyan), { pathArc: -0.7 }));
  }
  const mLvlLine = new M.DashedLine({ start: [mx(0) - BW / 2 - 0.05, yAt(3), 0], end: [mx(7) + BW / 2 + 0.05, yAt(3), 0], color: C.cyan });
  const mLvlTag = pill('3 MIN', C.cyan, P ? 16 : 17);
  mLvlTag.moveTo([MCX, yAt(3) + 0.42, 0]);

  await until(S(7));
  await play(
    new M.LaggedStart(mMoves, { lagRatio: 0.22, runTime: 1.5 }),
    new M.Create(mLvlLine, { runTime: 1.0 }),
    new M.FadeIn(mLvlTag, { runTime: 1.0 }),
    ...say('MORNING LEVELS TO 3 MIN', C.cyan)
  );

  // --- Beat 8: lunch's 16 stacks level to 1.5 minutes each ---
  // Every lunch stack keeps its base block lStacks[k][0]. The 8 excess whole blocks split into 16 half-blocks.
  const lunchBase = lStacks.map(st => st[0]);
  const lunchExcess = [];
  const lunchExcessPos = [];
  for (let k = 0; k < 16; k++) {
    while (lStacks[k].length > 1) {
      const j = lStacks[k].length - 1;
      lunchExcess.push(lStacks[k].pop());
      lunchExcessPos.push(lSlot(k, j));
    }
  }
  const lunchHalves = [];
  for (let i = 0; i < 8; i++) {
    const [ex, ey] = lunchExcessPos[i];
    lunchHalves.push(halfBlock([ex, ey - PITCH * 0.23, 0], C.pink));
    lunchHalves.push(halfBlock([ex, ey + PITCH * 0.23, 0], C.pink));
  }
  const lLvlLine = new M.DashedLine({ start: [lx(0) - BW / 2 - 0.05, yAt(1.5), 0], end: [lx(15) + BW / 2 + 0.05, yAt(1.5), 0], color: C.pink });
  const lLvlTag = pill('1.5 MIN', C.pink, P ? 16 : 17);
  lLvlTag.moveTo([LCX, yAt(1.5) + 0.42, 0]);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...lunchExcess), { runTime: 0.55 }),
    new M.FadeIn(new M.VGroup(...lunchHalves), { runTime: 0.55 }),
    ...say('LUNCH LEVELS TO 1.5 MIN', C.pink)
  );
  await play(
    new M.LaggedStart(
      lunchHalves.map((hb, k) => new M.Transform(hb, halfBlock(lHalfSlot(k, 0), C.pink), { pathArc: -0.45 })),
      { lagRatio: 0.04, runTime: 1.7 }
    ),
    new M.Create(lLvlLine, { runTime: 1.0 }),
    new M.FadeIn(lLvlTag, { runTime: 1.0 })
  );

  // --- Beat 9: leveled height is each shift's mean, or average ---
  await until(S(9));
  await play(
    new M.Indicate(mLvlTag, { color: C.amber }),
    new M.Indicate(lLvlTag, { color: C.amber }),
    ...fbox([['Morning mean = 3 min', C.cyan], ['Lunch mean   = 1.5 min', C.pink]], C.amber),
    ...say('LEVELED HEIGHT = SHIFT MEAN', C.amber)
  );

  // --- Beat 10: pause and see morning's 8 stacks beside lunch's 16 ---
  const mCountBadge = pill('8 STACKS', C.cyan, P ? 15 : 16);
  mCountBadge.moveTo([MCX, yAt(4.8), 0]);
  const lCountBadge = pill('16 STACKS', C.pink, P ? 15 : 16);
  lCountBadge.moveTo([LCX, yAt(4.8), 0]);
  await until(S(10));
  await play(new M.FadeIn(mCountBadge), new M.FadeIn(lCountBadge), ...say('8 STACKS BESIDE 16 STACKS'));

  // --- Beat 11: lunch served twice as many people, with shorter stacks ---
  await until(S(11));
  await play(
    new M.Indicate(lCountBadge, { color: C.pink }),
    new M.Indicate(lLvlTag, { color: C.pink }),
    ...say('LUNCH: TWICE AS MANY PEOPLE', C.pink)
  );

  // --- Beat 12: every customer counts equally, level all stacks together ---
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(mLvlLine, mLvlTag, lLvlLine, lLvlTag)),
    ...say('LEVEL ALL 24 STACKS TOGETHER', C.amber)
  );

  // --- Beat 13: morning's stacks are taller, take 1 block off each ---
  const morningBase = mStacks.flatMap(st => [st[0], st[1]]);
  const morningTop = mStacks.map(st => st[2]);
  morningTop.forEach(b => { b.setFill(C.amber, 0.92); b.setColor(C.amber); });
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(mCountBadge, lCountBadge)),
    new M.LaggedStart(morningTop.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('TAKE 1 BLOCK OFF EACH MORNING', C.amber)
  );

  // --- Beat 14: lowers morning from 3 to 2, leaving 8 spare blocks ---
  const SPARE_Y = yAt(3.55);
  const spareX = k => (P ? -2.2 + k * 0.62 : -4.45 + k * 0.64);
  const spareW = P ? 0.34 : 0.38;
  const spareNote = T('8 spare blocks', P ? 17 : 18, C.amber, true);
  spareNote.moveTo([(spareX(0) + spareX(7)) / 2, SPARE_Y + PITCH * 0.72, 0]);

  await until(S(14));
  await play(
    new M.LaggedStart(
      morningTop.map((b, k) => new M.Transform(b, wholeBlock([spareX(k), SPARE_Y, 0], C.amber, spareW), { pathArc: 0.35 })),
      { lagRatio: 0.08, runTime: 1.6 }
    ),
    new M.FadeIn(spareNote),
    ...fbox([['Morning: 3 → 2 min', C.cyan], ['Spare: 8 whole blocks', C.amber]], C.amber),
    ...say('MORNING: 3 → 2 (8 SPARE)', C.amber)
  );

  // --- Beat 15: cut each spare block in half to make 16 half-blocks ---
  const spareHalves = [];
  const cutLines = [];
  for (let k = 0; k < 8; k++) {
    const sx = spareX(k);
    spareHalves.push(halfBlock([sx, SPARE_Y - PITCH * 0.27, 0], C.amber, spareW));
    spareHalves.push(halfBlock([sx, SPARE_Y + PITCH * 0.27, 0], C.amber, spareW));
    cutLines.push(new M.DashedLine({ start: [sx - spareW * 0.6, SPARE_Y, 0], end: [sx + spareW * 0.6, SPARE_Y, 0], color: C.ink }));
  }
  const spareNote16 = T('16 half-blocks', P ? 17 : 18, C.amber, true);
  spareNote16.moveTo([(spareX(0) + spareX(7)) / 2, SPARE_Y + PITCH * 0.72, 0]);

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(...morningTop, spareNote), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...spareHalves, ...cutLines, spareNote16), { runTime: 0.7 }),
    ...fbox([['8 whole blocks', C.muted], ['= 16 half-blocks', C.amber]], C.amber),
    ...say('CUT IN HALF → 16 HALF-BLOCKS', C.amber)
  );

  // --- Beat 16: place one half-block on each of lunch's 16 stacks ---
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...cutLines, spareNote16), { runTime: 0.5 }),
    new M.LaggedStart(
      spareHalves.map((hb, k) => new M.Transform(hb, halfBlock(lHalfSlot(k, 1), C.amber), { pathArc: -0.5 })),
      { lagRatio: 0.04, runTime: 2.0 }
    ),
    ...say('1 HALF-BLOCK PER LUNCH STACK', C.amber)
  );

  // --- Beat 17: 1.5 + 0.5 brings every lunch stack up to 2 ---
  await until(S(17));
  await play(
    new M.LaggedStart(spareHalves.map(hb => new M.Indicate(hb, { color: C.pink })), { lagRatio: 0.04, runTime: 1.4 }),
    ...fbox([['Morning: 2 min', C.cyan], ['Lunch:   1.5 + 0.5 = 2 min', C.pink]], C.pink),
    ...say('1.5 + 0.5 = 2 MINUTES', C.pink)
  );

  // --- Beat 18: every stack across both shifts matches at 2 minutes ---
  const allLvlLine = new M.DashedLine({ start: [AXIS_X, yAt(2), 0], end: [RIGHT_X, yAt(2), 0], color: C.amber });
  const allLvlTag = pill('2 MIN EACH', C.amber, P ? 16 : 17);
  allLvlTag.moveTo([lx(12.5), yAt(2) + (P ? 0.5 : 0.44), 0]); // right part of lunch, clear of the morning bars and the 0.5-away label
  await until(S(18));
  await play(
    new M.Create(allLvlLine),
    new M.FadeIn(allLvlTag),
    ...say('ALL 24 STACKS = 2 MINUTES', C.amber)
  );

  // --- Beat 19: 2 is closer to lunch's 1.5 than to morning's 3 ---
  const ref3 = new M.DashedLine({ start: [mx(0) - 0.1, yAt(3), 0], end: [mx(7) + 0.1, yAt(3), 0], color: C.cyan });
  const ref15 = new M.DashedLine({ start: [lx(0) - 0.1, yAt(1.5), 0], end: [lx(15) + 0.1, yAt(1.5), 0], color: C.pink });
  const distM = new M.Line({ start: [MCX, yAt(2), 0], end: [MCX, yAt(3), 0], color: C.cyan, strokeWidth: 4 });
  const distMLab = T('1.0 away', P ? 15 : 16, C.cyan, true);
  distMLab.moveTo([MCX, yAt(3) + 0.28, 0]);
  const distL = new M.Line({ start: [LCX, yAt(1.5), 0], end: [LCX, yAt(2), 0], color: C.pink, strokeWidth: 4 });
  const distLLab = T('0.5 away', P ? 15 : 16, C.pink, true);
  distLLab.moveTo([LCX, yAt(2) + 0.85, 0]);

  await until(S(19));
  await play(
    new M.FadeIn(new M.VGroup(ref3, ref15, distM, distMLab, distL, distLLab, mCountBadge, lCountBadge)),
    ...fbox([['3.0 → 2.0  (1.0 away)', C.cyan], ['1.5 → 2.0  (0.5 away)', C.pink]], C.amber),
    ...say('2 IS CLOSER TO 1.5 THAN TO 3', C.amber)
  );

  // --- Beat 20: lunch pulled the result closer because it served more customers ---
  await until(S(20));
  await play(
    new M.Indicate(lCountBadge, { color: C.pink }),
    new M.Indicate(distLLab, { color: C.pink }),
    ...say('MORE CUSTOMERS = MORE PULL', C.pink)
  );

  // --- Beat 21: each shift's customer count is called its weight ---
  const mWtBadge = pill('WEIGHT = 8', C.cyan, P ? 15 : 16);
  mWtBadge.moveTo([MCX, yAt(4.8), 0]);
  const lWtBadge = pill('WEIGHT = 16', C.pink, P ? 15 : 16);
  lWtBadge.moveTo([LCX, yAt(4.8), 0]);
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(ref3, ref15, distM, distMLab, distL, distLLab, mCountBadge, lCountBadge)),
    new M.FadeIn(mWtBadge),
    new M.FadeIn(lWtBadge),
    ...say('CUSTOMER COUNT = WEIGHT', C.green)
  );

  // --- Beat 22: weight is not heaviness; it is how much a group counts ---
  await until(S(22));
  await play(
    ...fbox([['Weight = how much', C.green], ['a group counts', C.green], ['Morning: 8 · Lunch: 16', C.muted]], C.green),
    ...say('WEIGHT = HOW MUCH IT COUNTS', C.green)
  );

  // --- Beat 23: when bigger groups count more, combined average is a weighted mean ---
  await until(S(23));
  await play(
    new M.Indicate(allLvlTag, { color: C.amber }),
    ...fbox([['Weighted mean', C.amber], ['= 2 minutes', C.amber]], C.amber),
    ...say('WEIGHTED MEAN = 2 MINUTES', C.amber)
  );

  // --- Beat 24: moving blocks shows why; working with numbers is faster ---
  // Return stacks to each shift's leveled height (morning = 3, lunch = 1.5) for the numerical walkthrough.
  const morningTop2 = Array.from({ length: 8 }, (_, k) => wholeBlock(mSlot(k, 2), C.cyan));
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...spareHalves, allLvlLine, allLvlTag)),
    new M.FadeIn(new M.VGroup(...morningTop2)),
    ...say('FASTER WAY: USE NUMBERS', C.green)
  );

  // --- Beat 25: total minutes never changed, so let's add them up ---
  await until(S(25));
  await play(
    ...fbox([['Step 1: Total minutes', C.amber], ['Add morning + lunch', C.muted]], C.amber),
    ...say('STEP 1: FIND TOTAL MINUTES', C.amber)
  );

  // --- Beat 26: morning's 8 leveled stacks hold 3 minutes each ---
  const mFrame = new M.RoundedRectangle({
    width: (mx(7) - mx(0)) + BW + 0.16, height: 3 * PITCH + 0.14,
    cornerRadius: 0.10, color: C.cyan, strokeWidth: 2.5
  });
  mFrame.moveTo([MCX, BASE + 1.5 * PITCH, 0]);
  const mCalcTag = T('8 × 3', P ? 18 : 19, C.cyan, true);
  mCalcTag.moveTo([MCX, yAt(3.45), 0]);
  await until(S(26));
  await play(
    new M.Create(mFrame),
    new M.FadeIn(mCalcTag),
    ...fbox([['Morning:', C.cyan], ['8 stacks × 3 min', C.ink]], C.cyan),
    ...say('MORNING: 8 STACKS OF 3 MIN', C.cyan)
  );

  // --- Beat 27: 8 groups of 3 make 24 morning minutes ---
  const mCalc24 = T('8 × 3 = 24', P ? 17 : 18, C.cyan, true);
  mCalc24.moveTo([MCX, yAt(3.45), 0]);
  await until(S(27));
  await play(
    new M.FadeOut(mCalcTag),
    new M.FadeIn(mCalc24),
    ...fbox([['Morning:', C.cyan], ['8 × 3 = 24 min', C.amber]], C.cyan),
    ...say('8 × 3 = 24 MORNING MINUTES', C.cyan)
  );

  // --- Beat 28: lunch's 16 leveled stacks hold 1.5 minutes each ---
  const lFrame = new M.RoundedRectangle({
    width: (lx(15) - lx(0)) + BW + 0.16, height: 1.5 * PITCH + 0.14,
    cornerRadius: 0.10, color: C.pink, strokeWidth: 2.5
  });
  lFrame.moveTo([LCX, BASE + 0.75 * PITCH, 0]);
  const lCalcTag = T('16 × 1.5', P ? 18 : 19, C.pink, true);
  lCalcTag.moveTo([LCX, yAt(2.15), 0]);
  await until(S(28));
  await play(
    new M.FadeOut(mFrame),
    new M.Create(lFrame),
    new M.FadeIn(lCalcTag),
    ...fbox([['Morning: 8 × 3 = 24', C.cyan], ['Lunch:   16 × 1.5', C.pink]], C.pink),
    ...say('LUNCH: 16 STACKS OF 1.5 MIN', C.pink)
  );

  // --- Beat 29: split each lunch stack into 1 whole minute and 1 half-minute ---
  const splitLine = new M.DashedLine({ start: [lx(0) - BW / 2 - 0.08, yAt(1), 0], end: [lx(15) + BW / 2 + 0.08, yAt(1), 0], color: C.amber });
  lunchHalves.forEach(hb => { hb.setFill(C.amber, 0.9); hb.setColor(C.amber); });
  await until(S(29));
  await play(
    new M.FadeOut(lFrame),
    new M.Create(splitLine),
    ...fbox([['Lunch (16 × 1.5):', C.pink], ['1 whole + 1 half each', C.amber]], C.pink),
    ...say('SPLIT: 1 WHOLE + 1 HALF', C.pink)
  );

  // --- Beat 30: the 16 whole parts make 16 minutes ---
  lunchBase.forEach(b => { b.setFill(C.pink, 1.0); });
  lunchHalves.forEach(hb => { hb.setFill(C.amber, 0.3); });
  await until(S(30));
  await play(
    new M.LaggedStart(lunchBase.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.03, runTime: 1.2 }),
    ...fbox([['Lunch (16 × 1.5):', C.pink], ['16 wholes = 16 min', C.ink]], C.pink),
    ...say('16 WHOLES = 16 MINUTES', C.pink)
  );

  // --- Beat 31: those 16 halves pair up into 8 more minutes ---
  lunchBase.forEach(b => { b.setFill(C.pink, 0.35); });
  lunchHalves.forEach(hb => { hb.setFill(C.amber, 0.95); });
  const pairMarks = [];
  for (let p = 0; p < 8; p++) {
    const x1 = lx(2 * p), x2 = lx(2 * p + 1), py = yAt(1.70);
    pairMarks.push(new M.Line({ start: [x1, py, 0], end: [x2, py, 0], color: C.amber, strokeWidth: 2.5 }));
    pairMarks.push(T('1', 15, C.amber, true).moveTo([(x1 + x2) / 2, py + 0.22, 0]));
  }
  await until(S(31));
  await play(
    new M.FadeOut(lCalcTag),
    new M.LaggedStart(pairMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.04, runTime: 1.4 }),
    ...fbox([['Lunch (16 × 1.5):', C.pink], ['16 wholes = 16 min', C.muted], ['16 halves = 8 min', C.amber]], C.amber),
    ...say('16 HALVES = 8 MORE MINUTES', C.amber)
  );

  // --- Beat 32: 16 + 8 gives lunch 24 minutes too ---
  lunchBase.forEach(b => { b.setFill(C.pink, 0.84); });
  lunchHalves.forEach(hb => { hb.setFill(C.pink, 0.86); hb.setColor(C.pink); });
  const lCalc24 = T('16 × 1.5 = 24', P ? 17 : 18, C.pink, true);
  lCalc24.moveTo([LCX, yAt(2.25), 0]);
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...pairMarks, splitLine)),
    new M.FadeIn(lCalc24),
    ...fbox([['Lunch:', C.pink], ['16 + 8 = 24 min', C.pink]], C.pink),
    ...say('16 + 8 = 24 LUNCH MINUTES', C.pink)
  );

  // --- Beat 33: 24 morning + 24 lunch = 48 minutes in all ---
  await until(S(33));
  await play(
    new M.Indicate(mCalc24, { color: C.amber }),
    new M.Indicate(lCalc24, { color: C.amber }),
    ...fbox([['Morning: 24 min', C.cyan], ['Lunch:   24 min', C.pink], ['Total  = 48 min', C.amber]], C.amber),
    ...say('24 + 24 = 48 MINUTES TOTAL', C.amber)
  );

  // --- Beat 34: now count the customers, not the minutes ---
  await until(S(34));
  await play(
    new M.Indicate(mWtBadge, { color: C.green }),
    new M.Indicate(lWtBadge, { color: C.green }),
    ...say('STEP 2: COUNT CUSTOMERS', C.green)
  );

  // --- Beat 35: 8 in the morning + 16 at lunch = 24 customers ---
  await until(S(35));
  await play(
    ...fbox([['Total min = 48', C.amber], ['Customers = 8 + 16', C.green], ['          = 24', C.green]], C.green),
    ...say('8 + 16 = 24 CUSTOMERS', C.green)
  );

  // --- Beat 36: share those 48 minutes equally across all 24 customers ---
  const lunchTop2 = Array.from({ length: 16 }, (_, k) => halfBlock(lHalfSlot(k, 1), C.amber));
  const allLvlLine2 = new M.DashedLine({ start: [AXIS_X, yAt(2), 0], end: [RIGHT_X, yAt(2), 0], color: C.amber });
  const allLvlTag2 = pill('2 MIN EACH', C.amber, P ? 16 : 17);
  allLvlTag2.moveTo([LCX, yAt(2.65), 0]);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...morningTop2, mCalc24, lCalc24)),
    new M.FadeIn(new M.VGroup(...lunchTop2)),
    new M.Create(allLvlLine2),
    ...say('SHARE 48 MIN ACROSS 24', C.amber)
  );

  // --- Beat 37: 48 is twice 24, so everyone gets 2 minutes ---
  await until(S(37));
  await play(
    new M.FadeIn(allLvlTag2),
    ...fbox([['48 ÷ 24 = 2', C.amber], ['Overall mean: 2 minutes', C.green]], C.amber),
    ...say('48 ÷ 24 = 2 MINUTES EACH', C.amber)
  );

  // --- Beat 38: look at the 3 steps you just followed ---
  await until(S(38));
  await play(new M.Indicate(allLvlTag2, { color: C.cyan }), ...say('THE 3 STEPS', C.cyan));

  // --- Beat 39: first, each group's weight times its mean ---
  // Bars go back to each shift's own mean (morning 3, lunch 1.5) so the picture matches 8 × 3 and 16 × 1.5.
  const morningTop3 = Array.from({ length: 8 }, (_, k) => wholeBlock(mSlot(k, 2), C.cyan));
  const mStep1 = T('8 × 3 = 24', P ? 17 : 18, C.cyan, true); mStep1.moveTo([MCX, yAt(3.45), 0]);
  const lStep1 = T('16 × 1.5 = 24', P ? 17 : 18, C.pink, true); lStep1.moveTo([LCX, yAt(2.25), 0]);
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...lunchTop2, allLvlLine2, allLvlTag2)),
    new M.FadeIn(new M.VGroup(...morningTop3, mStep1, lStep1)),
    new M.Indicate(mWtBadge, { color: C.cyan }),
    ...fbox([['1. weight × mean', C.cyan], ['   8 × 3    = 24', C.ink], ['   16 × 1.5 = 24', C.ink]], C.cyan),
    ...say('STEP 1: WEIGHT × MEAN', C.cyan)
  );

  // --- Beat 40: second, add those group totals together ---
  await until(S(40));
  await play(
    ...fbox([['1. weight × mean', C.muted], ['2. add group totals', C.amber], ['   24 + 24 = 48', C.amber]], C.amber),
    ...say('STEP 2: ADD GROUP TOTALS', C.amber)
  );

  // --- Beat 41: third, share across all the weights added up ---
  const lunchTop3 = Array.from({ length: 16 }, (_, k) => halfBlock(lHalfSlot(k, 1), C.amber));
  const allLvlLine3 = new M.DashedLine({ start: [AXIS_X, yAt(2), 0], end: [RIGHT_X, yAt(2), 0], color: C.amber });
  const allLvlTag3 = pill('2 MIN EACH', C.amber, P ? 16 : 17);
  allLvlTag3.moveTo([LCX, yAt(2.65), 0]);
  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...morningTop3, mStep1, lStep1)),
    new M.FadeIn(new M.VGroup(...lunchTop3, allLvlLine3, allLvlTag3)),
    new M.Indicate(mWtBadge, { color: C.green }),
    new M.Indicate(lWtBadge, { color: C.green }),
    ...fbox([
      ['1. weight × mean', C.muted],
      ['2. add totals = 48', C.muted],
      ['3. ÷ all weights (24)', C.green],
      ['   48 ÷ 24 = 2 min', C.amber]
    ], C.green),
    ...say('STEP 3: DIVIDE BY ALL WEIGHTS', C.green)
  );

  // --- Beat 42: short formula on screen ---
  await until(S(42));
  await play(
    ...fbox([
      ['Total of (weight × mean)', C.ink],
      ['÷ all weights added', C.green],
      ['= (24 + 24) ÷ (8 + 16)', C.muted],
      ['= 2 minutes', C.amber]
    ], C.cyan),
    ...say('WEIGHTED MEAN FORMULA', C.cyan)
  );

  // --- Beat 43: use whenever you combine groups of different sizes ---
  await until(S(43));
  await play(
    new M.Indicate(mWtBadge, { color: C.cyan }),
    new M.Indicate(lWtBadge, { color: C.pink }),
    ...say('USE WHEN GROUP SIZES DIFFER', C.green)
  );

  // --- Beat 44: quiet and busy shifts, or small and large stores ---
  await until(S(44));
  await play(
    ...fbox([['When to use it:', C.green], ['• quiet & busy shifts', C.ink], ['• small & large stores', C.ink]], C.green),
    ...say('QUIET & BUSY · SMALL & LARGE', C.green)
  );

  // --- Beat 45: common trap — picking the halfway point ---
  // Clear bar chart and open a clean zoomed-in minutes line from 1.0 to 3.5 so 1.5, 2.0, 2.25, 3.0 read clearly.
  const NL_X0 = P ? -3.20 : -6.00;
  const NL_X1 = P ? 3.20 : 1.60;
  const NL_Y = P ? -2.6 : -0.55;
  const v2x = v => NL_X0 + (v - 1.0) / 2.5 * (NL_X1 - NL_X0);

  const nlLine = new M.Line({ start: [NL_X0, NL_Y, 0], end: [NL_X1, NL_Y, 0], color: C.muted, strokeWidth: 3 });
  const nlTicks = [1, 1.5, 2, 2.5, 3, 3.5].map(v => new M.VGroup(
    new M.Line({ start: [v2x(v), NL_Y - 0.10, 0], end: [v2x(v), NL_Y + 0.10, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 16 : 18, C.muted, true).moveTo([v2x(v), NL_Y - 0.42, 0])
  ));
  const nlUnit = T('minutes', P ? 16 : 17, C.muted);
  nlUnit.moveTo([NL_X1 - 0.35, NL_Y - 0.80, 0]);

  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(
      floor, yAxis, ...yTicks, mFloorLab, lFloorLab, blockNote,
      ...morningBase, ...lunchBase, ...lunchHalves, ...lunchTop3,
      mWtBadge, lWtBadge, allLvlLine3, allLvlTag3
    ), { runTime: 0.7 }),
    ...hideBoxA(),
    ...say('TRAP: THE HALFWAY POINT', C.violet)
  );
  await play(
    new M.Create(nlLine, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...nlTicks, nlUnit), { runTime: 0.7 })
  );

  // --- Beat 46: start with morning's 3 and lunch's 1.5 ---
  const dotM = new M.Dot({ point: [v2x(3), NL_Y, 0], radius: 0.14, color: C.cyan });
  const labM = pill('MORNING 3', C.cyan, P ? 15 : 16);
  labM.moveTo([v2x(3), NL_Y + 0.65, 0]);
  const dotL = new M.Dot({ point: [v2x(1.5), NL_Y, 0], radius: 0.14, color: C.pink });
  const labL = pill('LUNCH 1.5', C.pink, P ? 15 : 16);
  labL.moveTo([v2x(1.5), NL_Y + 0.65, 0]);

  await until(S(46));
  await play(
    new M.FadeIn(dotM), new M.FadeIn(labM), new M.Flash(dotM, { color: C.cyan }),
    new M.FadeIn(dotL), new M.FadeIn(labL), new M.Flash(dotL, { color: C.pink }),
    ...fbox([['Morning mean = 3', C.cyan], ['Lunch mean   = 1.5', C.pink]], C.violet),
    ...say('START WITH 3 AND 1.5', C.violet)
  );

  // --- Beat 47: add them together to get 4.5 ---
  await until(S(47));
  await play(
    ...fbox([['3 + 1.5 = 4.5', C.violet]], C.violet),
    ...say('3 + 1.5 = 4.5', C.violet)
  );

  // --- Beat 48: split in two — half of 4 is 2 ---
  await until(S(48));
  await play(
    ...fbox([['Half of 4.5:', C.violet], ['half of 4   = 2', C.ink]], C.violet),
    ...say('HALF OF 4 IS 2', C.violet)
  );

  // --- Beat 49: and half of the extra half is a quarter ---
  await until(S(49));
  await play(
    ...fbox([['Half of 4.5:', C.violet], ['half of 4   = 2', C.muted], ['half of 0.5 = 0.25', C.violet]], C.violet),
    ...say('HALF OF 0.5 IS 0.25', C.violet)
  );

  // --- Beat 50: halfway point lands at 2.25, not 2 ---
  const dotTrap = new M.Dot({ point: [v2x(2.25), NL_Y, 0], radius: 0.15, color: C.violet });
  const lineTrap = new M.DashedLine({ start: [v2x(2.25), NL_Y + 0.14, 0], end: [v2x(2.25), NL_Y + 1.25, 0], color: C.violet });
  const tagTrap = pill('HALFWAY 2.25 ✗', C.violet, P ? 15 : 16);
  tagTrap.moveTo([v2x(2.25), NL_Y + 1.58, 0]);

  const dotTrue = new M.Dot({ point: [v2x(2), NL_Y, 0], radius: 0.15, color: C.amber });
  const lineTrue = new M.DashedLine({ start: [v2x(2), NL_Y - 0.14, 0], end: [v2x(2), NL_Y - 1.15, 0], color: C.amber });
  const tagTrue = pill('TRUE MEAN 2 ✓', C.amber, P ? 15 : 16);
  tagTrue.moveTo([v2x(2), NL_Y - 1.50, 0]);

  await until(S(50));
  await play(
    new M.FadeIn(dotTrap), new M.Create(lineTrap), new M.FadeIn(tagTrap),
    new M.FadeIn(dotTrue), new M.Create(lineTrue), new M.FadeIn(tagTrue),
    ...fbox([['Halfway: 2 + 0.25 = 2.25 ✗', C.violet], ['True mean = 2 ✓', C.amber]], C.violet),
    ...say('HALFWAY = 2.25 (NOT 2!)', C.violet)
  );

  // --- Beat 51: gives quiet shift as much say as busy shift ---
  const eqL = T('equal say ✗', P ? 15 : 16, C.violet, true);
  eqL.moveTo([(v2x(1.5) + v2x(2.25)) / 2, NL_Y + 0.24, 0]);
  const eqM = T('equal say ✗', P ? 15 : 16, C.violet, true);
  eqM.moveTo([(v2x(2.25) + v2x(3.0)) / 2, NL_Y + 0.24, 0]);
  await until(S(51));
  await play(
    new M.FadeIn(eqL), new M.FadeIn(eqM),
    new M.Indicate(tagTrap, { color: C.violet }),
    ...say('TREATS 8 AND 16 AS EQUAL ✗', C.violet)
  );

  // --- Beat 52: halfway point works only if sizes match ---
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(eqL, eqM)),
    ...fbox([['Same sizes (8 vs 8):', C.green], ['halfway works ✓', C.green], ['Different sizes (8 vs 16):', C.muted], ['use weighted mean', C.amber]], C.cyan),
    ...say('HALFWAY ONLY IF SIZES MATCH', C.cyan)
  );

  // --- Beat 53: weighted mean lets larger groups pull more, true average ---
  const pullArrow = new M.Arrow({ start: [v2x(2.25), NL_Y + 0.30, 0], end: [v2x(2.0), NL_Y + 0.30, 0], color: C.pink, strokeWidth: 4 });
  const pullText = T('16 pulls harder', P ? 15 : 16, C.pink, true);
  pullText.moveTo([v2x(2.12), NL_Y + 1.0, 0]); // above the pill row, below the HALFWAY tag

  await until(S(53));
  await play(
    new M.FadeOut(lineTrap),
    new M.Create(pullArrow),
    new M.FadeIn(pullText),
    new M.Flash(dotTrue, { color: C.amber }),
    new M.Indicate(tagTrue, { color: C.amber }),
    ...fbox([['Overall mean: 2 minutes', C.amber], ['Bigger groups count more', C.green]], C.amber),
    ...say('OVERALL MEAN: 2 MINUTES', C.amber)
  );
}
