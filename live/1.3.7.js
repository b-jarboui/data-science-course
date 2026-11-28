// 1.3.7 Median absolute deviation (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 0..63). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const D1 = [3, 4, 4, 5, 6, 6, 7];
  const D2 = [3, 4, 4, 5, 6, 6, 21];
  const DIST1_SORT = [0, 1, 1, 1, 1, 2, 2];
  const DIST2_SORT = [0, 1, 1, 1, 1, 2, 16];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const X0 = P ? -3.35 : -6.35, X1 = P ? 3.35 : 1.95;
  const L0 = X1 - X0, CX = (X0 + X1) / 2;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.7, 0] : [4.55, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.9 : 4.2;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const LY = P ? 0.15 : -0.45;
  const ROW_Y = P ? -1.92 : -1.92;
  const x8 = v => X0 + ((v - 2) / 6) * L0;
  const x22 = v => X0 + (v / 22) * L0;
  const clampX = (x, w) => Math.max(X0 + w / 2, Math.min(X1 - w / 2, x));

  // Four horizontal tracks above LY for clean non-overlapping distance bars
  const TY = tr => LY + (P ? [0.34, 0.84, 1.38, 1.92][tr] : [0.26, 0.60, 1.06, 1.52][tr]);
  const TR7 = [3, 1, 2, 0, 1, 2, 3];
  const MED_TOP = P ? LY + 2.22 : LY + 1.70;
  const MED_TAG_Y = P ? LY + 2.53 : LY + 1.95;
  const DOT_R = P ? 0.11 : 0.105, HALO_R = P ? 0.24 : 0.23;
  const DOT_R22 = P ? 0.085 : 0.095, HALO_R22 = P ? 0.15 : 0.17;

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.39 : 0.39;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Drawing helpers (fresh objects, moveTo placement, setFill fills)
  const makeDot = (p, color = C.cyan, r = DOT_R) => {
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return d;
  };
  const makeHalo = (p, color = C.cyan, r = HALO_R) => {
    const h = new M.Dot({ point: p, radius: r, color });
    h.setFill(color, 0.18);
    return h;
  };
  const makeRing = (p, color, r = 0.24) => {
    const c = new M.Circle({ radius: r, color, strokeWidth: 3 });
    c.setFill(color, 0);
    c.moveTo(p);
    return c;
  };
  const styleDot = (dArr, hArr, k, col, dotOp = 1, haloOp = 0.18) => {
    dArr[k].setColor(col); dArr[k].setFill(col, dotOp);
    hArr[k].setColor(col); hArr[k].setFill(col, haloOp);
  };
  const dotPlotPos = (arr, k, fn, baseY, stepY = P ? 0.44 : 0.38) => {
    const v = arr[k], stack = arr.slice(0, k).filter(x => x === v).length;
    return [fn(v), baseY + (P ? 0.34 : 0.30) + stack * stepY, 0];
  };
  const makeTicks = (vals, fn, y) => {
    const items = [];
    for (const v of vals) {
      const x = fn(v);
      items.push(new M.Line({ start: [x, y - 0.08, 0], end: [x, y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(String(v), P ? 18 : 18, C.muted, true);
      t.moveTo([x, y - (P ? 0.34 : 0.30), 0]);
      items.push(t);
    }
    const unit = T('days', P ? 16 : 16, C.muted);
    unit.moveTo([X1 - 0.18, y - (P ? 0.66 : 0.57), 0]);
    items.push(unit);
    return new M.VGroup(...items);
  };
  const makeArrow = (x1, x2, y, color, sw = 3) => {
    const dir = x2 >= x1 ? 1 : -1;
    const tip = Math.min(0.16, Math.abs(x2 - x1) * 0.34);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const top = new M.Line({ start: [x2 - dir * tip, y + tip * 0.62, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const bot = new M.Line({ start: [x2 - dir * tip, y - tip * 0.62, 0], end: [x2, y, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, top, bot);
  };
  const measureBar = (xa, xb, y, color, sw = 3) => {
    const cap = 0.09;
    const bar = new M.Line({ start: [xa, y, 0], end: [xb, y, 0], color, strokeWidth: sw });
    const c1 = new M.Line({ start: [xa, y - cap, 0], end: [xa, y + cap, 0], color, strokeWidth: 2.5 });
    const c2 = new M.Line({ start: [xb, y - cap, 0], end: [xb, y + cap, 0], color, strokeWidth: 2.5 });
    return new M.VGroup(bar, c1, c2);
  };
  const distBar8 = (v, tr, color = C.cyan) => {
    const dir = v > 5 ? 1 : -1;
    const xa = x8(5), xb = x8(v) - dir * (DOT_R + 0.06);
    return measureBar(xa, xb, TY(tr), color, P ? 3.2 : 3);
  };
  const distLab8 = (v, tr, text, color = C.cyan) => {
    const mx = (x8(5) + x8(v)) / 2;
    const t = T(text, P ? 18 : 17, color, true);
    t.moveTo([mx, TY(tr) + (P ? 0.22 : 0.18), 0]);
    return t;
  };
  const makeBracket = (xa, xb, y, drop, label, color) => {
    const l = new M.Line({ start: [xa, y, 0], end: [xa, y - drop, 0], color, strokeWidth: 2.2 });
    const b = new M.Line({ start: [xa, y - drop, 0], end: [xb, y - drop, 0], color, strokeWidth: 2.2 });
    const r = new M.Line({ start: [xb, y - drop, 0], end: [xb, y, 0], color, strokeWidth: 2.2 });
    const t = T(label, P ? 16 : 16, color, true);
    t.moveTo([clampX((xa + xb) / 2, t.getWidth()), y - drop - 0.25, 0]);
    return new M.VGroup(l, b, r, t);
  };
  const makeParcelIcon = (x, y) => {
    const bw = P ? 0.62 : 0.72, bh = P ? 0.50 : 0.56;
    const box = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
    box.setFill(C.card, 0.95); box.moveTo([x, y, 0]);
    const vTape = new M.Line({ start: [x, y - bh / 2, 0], end: [x, y + bh / 2, 0], color: C.amber, strokeWidth: 2 });
    const hTape = new M.Line({ start: [x - bw / 2, y + 0.04, 0], end: [x + bw / 2, y + 0.04, 0], color: C.amber, strokeWidth: 2 });
    return new M.VGroup(box, vTape, hTape);
  };
  const makeCross = (x, y, rad, color = C.pink) => new M.VGroup(
    new M.Line({ start: [x - rad, y - rad, 0], end: [x + rad, y + rad, 0], color, strokeWidth: 2.5 }),
    new M.Line({ start: [x - rad, y + rad, 0], end: [x + rad, y - rad, 0], color, strokeWidth: 2.5 })
  );

  // Sorted distance card row geometry
  const CSP = P ? 0.94 : 1.06, CW = P ? 0.76 : 0.82, CH = P ? 0.76 : 0.64;
  const cardX = k => CX + (k - 3) * CSP;
  const makeCard = (x, y, val, color = C.cyan) => {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.13, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = T(String(val), P ? 20 : 21, color, true);
    t.moveTo([x, y, 0]);
    return { r, t };
  };
  const makeSlotOutline = (x, y) => {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.13, color: C.line, strokeWidth: 1.8 });
    r.setFill(C.card, 0.35); r.moveTo([x, y, 0]);
    return r;
  };
  const fitText = (t, maxW) => { if (t.getWidth() > maxW) t.scale(maxW / t.getWidth()); return t; };

  // ==================== ACT 1 (0–8): Café parcels, normal week, median = 5 ====================

  // 0: Imagine the café wants to tell customers how reliable its coffee bean deliveries are.
  const pSp = P ? 0.88 : 1.06, pY = P ? 0.55 : -0.15;
  const parcels = D1.map((_, k) => makeParcelIcon(CX + (k - 3) * pSp, pY));
  await until(S(0));
  await play(
    new M.LaggedStart(parcels.map(p => new M.FadeIn(p)), { lagRatio: 0.11, runTime: 1.5 }),
    ...fbox(['café coffee deliveries:', ['how reliable are they?', C.cyan]], C.cyan),
    ...say('CAFÉ COFFEE DELIVERIES')
  );

  // 1: Parcels do not all arrive on the same day.
  const spreadL = makeArrow(CX - 0.35, CX - 3 * pSp - 0.15, pY - 0.68, C.amber, 3);
  const spreadR = makeArrow(CX + 0.35, CX + 3 * pSp + 0.15, pY - 0.68, C.amber, 3);
  await until(S(1));
  await play(
    new M.FadeIn(spreadL, { runTime: 0.8 }), new M.FadeIn(spreadR, { runTime: 0.8 }),
    new M.LaggedStart(parcels.map(p => new M.Indicate(p, { color: C.amber })), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['parcels arrive', ['on different days', C.amber]], C.amber),
    ...say('NOT ALL ON THE SAME DAY', C.amber)
  );

  // 2: So how far from the middle does a typical parcel land?
  const introMid = new M.DashedLine({ start: [CX, pY - 0.45, 0], end: [CX, pY + 1.05, 0], color: C.amber });
  const introArrL = makeArrow(CX - 0.06, CX - 1.5 * pSp, pY + 0.72, C.cyan, 2.8);
  const introArrR = makeArrow(CX + 0.06, CX + 1.5 * pSp, pY + 0.72, C.cyan, 2.8);
  const introQ = T('typical distance = ?', P ? 19 : 20, C.amber, true);
  introQ.moveTo([CX, pY + 1.32, 0]);
  await until(S(2));
  await play(
    new M.Create(introMid), new M.FadeIn(introArrL), new M.FadeIn(introArrR), new M.FadeIn(introQ),
    ...fbox(['question:', ['how far from the middle', C.amber], ['does a parcel land?', C.amber]], C.amber),
    ...say('HOW FAR FROM THE MIDDLE?', C.amber)
  );

  // 3: Look at our seven parcels from a normal week, shown as glowing dots on a days line.
  const axis = new M.Line({ start: [X0, LY, 0], end: [X1, LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks8 = makeTicks([2, 3, 4, 5, 6, 7, 8], x8, LY);
  const pos8 = D1.map((_, k) => dotPlotPos(D1, k, x8, LY));
  const halos = pos8.map(p => makeHalo(p, C.cyan, HALO_R));
  const dots = pos8.map(p => makeDot(p, C.cyan, DOT_R));
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...parcels, spreadL, spreadR, introMid, introArrL, introArrR, introQ)),
    new M.Create(axis),
    new M.FadeIn(ticks8),
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.LaggedStart(halos.map(h => new M.FadeIn(h)), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('7 PARCELS · NORMAL WEEK')
  );

  // Value labels above each distinct day column (3, 4, 5, 6, 7)
  const colLabs = [3, 4, 5, 6, 7].map(v => {
    const cnt = D1.filter(x => x === v).length;
    const topY = LY + (P ? 0.34 : 0.30) + (cnt - 1) * (P ? 0.44 : 0.38) + 0.38;
    const t = T(String(v), P ? 18 : 19, C.cyan, true);
    t.moveTo([x8(v), topY, 0]);
    return t;
  });

  // 4: From fastest to slowest, one parcel took three days, and two took four days.
  await until(S(4));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Flash(dots[k], { color: C.cyan })), { lagRatio: 0.35, runTime: 1.8 }),
    new M.FadeIn(colLabs[0]), new M.FadeIn(colLabs[1]),
    ...fbox(['normal week (days)', ['3, 4, 4, ...', C.cyan]]),
    ...say('FASTEST: 3, 4, 4 DAYS')
  );

  // 5: One parcel took five days, right in the center.
  await until(S(5));
  await play(
    new M.Flash(dots[3], { color: C.amber }),
    new M.FadeIn(colLabs[2]),
    ...fbox(['normal week (days)', ['3, 4, 4, 5, ...', C.cyan]]),
    ...say('CENTER: 5 DAYS')
  );

  // 6: Then two took six days, and the slowest took seven days.
  await until(S(6));
  await play(
    new M.LaggedStart([4, 5, 6].map(k => new M.Flash(dots[k], { color: C.cyan })), { lagRatio: 0.35, runTime: 1.8 }),
    new M.FadeIn(colLabs[3]), new M.FadeIn(colLabs[4]),
    ...fbox(['normal week (days)', ['3, 4, 4, 5, 6, 6, 7', C.cyan]]),
    ...say('SLOWEST: 6, 6, 7 DAYS')
  );

  // 7: Three parcels arrived faster than five days, and three arrived slower.
  const boxH = P ? 1.28 : 1.15, boxY = LY + boxH / 2 + 0.08;
  const boxFast = new M.RoundedRectangle({ width: x8(4) - x8(3) + 0.72, height: boxH, cornerRadius: 0.13, color: C.cyan, strokeWidth: 2 });
  boxFast.setFill(C.cyan, 0.06); boxFast.moveTo([(x8(3) + x8(4)) / 2, boxY, 0]);
  const labFast = T('3 faster', P ? 16 : 17, C.cyan, true); labFast.moveTo([(x8(3) + x8(4)) / 2, boxY + boxH / 2 + 0.26, 0]);
  const boxSlow = new M.RoundedRectangle({ width: x8(7) - x8(6) + 0.72, height: boxH, cornerRadius: 0.13, color: C.cyan, strokeWidth: 2 });
  boxSlow.setFill(C.cyan, 0.06); boxSlow.moveTo([(x8(6) + x8(7)) / 2, boxY, 0]);
  const labSlow = T('3 slower', P ? 16 : 17, C.cyan, true); labSlow.moveTo([(x8(6) + x8(7)) / 2, boxY + boxH / 2 + 0.26, 0]);
  await until(S(7));
  await play(
    new M.Create(boxFast), new M.FadeIn(labFast),
    new M.Create(boxSlow), new M.FadeIn(labSlow),
    ...fbox(['3 faster: 3, 4, 4', '3 slower: 6, 6, 7'], C.cyan),
    ...say('3 FASTER  ·  3 SLOWER')
  );

  // 8: So five days is the middle delivery time. You already know its name: the median.
  const medLine8 = new M.DashedLine({ start: [x8(5), LY - 0.10, 0], end: [x8(5), MED_TOP, 0], color: C.amber });
  const medRing8 = makeRing(pos8[3], C.amber, 0.24);
  const medTag8 = pill('MEDIAN = 5', C.amber, P ? 16 : 16); medTag8.moveTo([x8(5), MED_TAG_Y, 0]);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(boxFast, labFast, boxSlow, labSlow)),
    new M.Create(medLine8), new M.FadeIn(medRing8), new M.FadeIn(medTag8),
    new M.Flash(dots[3], { color: C.amber }),
    ...fbox(['3, 4, 4, [5], 6, 6, 7', ['median = 5 days', C.amber]], C.amber),
    ...say('MEDIAN = 5 DAYS', C.amber)
  );

  // ==================== ACT 2 (9–16): Measuring Distances from 5 ====================

  // 9: Now imagine standing at five days and measuring how many days away each parcel sits.
  const trackPos8 = D1.map((v, k) => [x8(v), TY(TR7[k]), 0]);
  const drops8 = [
    new M.Line({ start: [x8(3), LY, 0], end: [x8(3), TY(3), 0], color: C.line, strokeWidth: 1.6 }),
    new M.Line({ start: [x8(4), LY, 0], end: [x8(4), TY(2), 0], color: C.line, strokeWidth: 1.6 }),
    new M.Line({ start: [x8(6), LY, 0], end: [x8(6), TY(2), 0], color: C.line, strokeWidth: 1.6 }),
    new M.Line({ start: [x8(7), LY, 0], end: [x8(7), TY(3), 0], color: C.line, strokeWidth: 1.6 })
  ];
  const standDot = makeDot([x8(5), LY, 0], C.amber, 0.09);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...colLabs, medRing8)),
    new M.FadeIn(new M.VGroup(...drops8, standDot)),
    ...D1.map((_, k) => new M.Transform(dots[k], makeDot(trackPos8[k], C.cyan, DOT_R), { runTime: 1.3 })),
    ...D1.map((_, k) => new M.Transform(halos[k], makeHalo(trackPos8[k], C.cyan, HALO_R), { runTime: 1.3 })),
    ...fbox(['stand at median = 5', ['measure days away', C.amber]], C.amber),
    ...say('STAND AT 5 · MEASURE DISTANCE', C.amber)
  );

  // 10: We only care about the size of each distance, not whether a parcel arrived earlier or later.
  const dirY = P ? LY - 1.15 : LY - 1.05;
  const dirL = T('← earlier', P ? 17 : 18, C.muted); dirL.moveTo([(x8(3) + x8(5)) / 2, dirY, 0]);
  const dirR = T('later →', P ? 17 : 18, C.muted); dirR.moveTo([(x8(5) + x8(7)) / 2, dirY, 0]);
  const xDirL = makeCross((x8(3) + x8(5)) / 2, dirY, 0.20, C.pink);
  const xDirR = makeCross((x8(5) + x8(7)) / 2, dirY, 0.20, C.pink);
  await until(S(10));
  await play(
    new M.FadeIn(dirL), new M.FadeIn(dirR),
    new M.Create(xDirL), new M.Create(xDirR),
    ...fbox(['distance from 5:', ['size only', C.cyan], ['ignore earlier / later', C.muted]], C.cyan),
    ...say('SIZE ONLY · IGNORE DIRECTION')
  );

  // 11: Let's measure those distances from five, moving across the line.
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(dirL, dirR, xDirL, xDirR)),
    new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.14, runTime: 1.8 }),
    ...fbox(['times: 3, 4, 4, 5, 6, 6, 7', ['distance from 5 = ?', C.amber]], C.cyan),
    ...say('MEASURE ACROSS THE LINE')
  );

  // 12: The three-day parcel is two days earlier than five, so its distance is two days.
  const distBar0 = distBar8(3, TR7[0], C.cyan);
  const distLab0 = distLab8(3, TR7[0], '2', C.cyan);
  await until(S(12));
  await play(
    new M.Create(distBar0), new M.FadeIn(distLab0), new M.Flash(dots[0], { color: C.cyan }),
    ...fbox(['3 days → from 5:', ['distance = 2', C.cyan]], C.cyan),
    ...say('3 DAYS → DISTANCE 2')
  );

  // 13: Both four-day parcels are one day earlier, so each has a distance of one day.
  const distBar1 = distBar8(4, TR7[1], C.cyan), distLab1 = distLab8(4, TR7[1], '1', C.cyan);
  const distBar2 = distBar8(4, TR7[2], C.cyan), distLab2 = distLab8(4, TR7[2], '1', C.cyan);
  await until(S(13));
  await play(
    new M.Create(distBar1), new M.FadeIn(distLab1),
    new M.Create(distBar2), new M.FadeIn(distLab2),
    new M.Flash(dots[1], { color: C.cyan }), new M.Flash(dots[2], { color: C.cyan }),
    ...fbox(['3 → 2', ['4 → 1,  4 → 1', C.cyan]], C.cyan),
    ...say('4, 4 DAYS → DISTANCE 1, 1')
  );

  // 14: The five-day parcel sits right on five, so its distance is zero days.
  const distLab3 = T('0', P ? 18 : 17, C.amber, true);
  distLab3.moveTo([x8(5) + 0.28, TY(0), 0]);
  await until(S(14));
  await play(
    new M.FadeIn(distLab3), new M.Flash(dots[3], { color: C.amber }),
    ...fbox(['3, 4, 4 → 2, 1, 1', ['5 → distance = 0', C.amber]], C.amber),
    ...say('5 DAYS → DISTANCE 0', C.amber)
  );

  // 15: Both six-day parcels are one day later, so each has a distance of one day.
  const distBar4 = distBar8(6, TR7[4], C.cyan), distLab4 = distLab8(6, TR7[4], '1', C.cyan);
  const distBar5 = distBar8(6, TR7[5], C.cyan), distLab5 = distLab8(6, TR7[5], '1', C.cyan);
  await until(S(15));
  await play(
    new M.Create(distBar4), new M.FadeIn(distLab4),
    new M.Create(distBar5), new M.FadeIn(distLab5),
    new M.Flash(dots[4], { color: C.cyan }), new M.Flash(dots[5], { color: C.cyan }),
    ...fbox(['3,4,4,5 → 2, 1, 1, 0', ['6 → 1,  6 → 1', C.cyan]], C.cyan),
    ...say('6, 6 DAYS → DISTANCE 1, 1')
  );

  // 16: And the seven-day parcel is two days later, so its distance is two days.
  const distBar6 = distBar8(7, TR7[6], C.cyan), distLab6 = distLab8(7, TR7[6], '2', C.cyan);
  await until(S(16));
  await play(
    new M.Create(distBar6), new M.FadeIn(distLab6), new M.Flash(dots[6], { color: C.cyan }),
    ...fbox(['all 7 distances:', ['2, 1, 1, 0, 1, 1, 2', C.cyan]], C.cyan),
    ...say('7 DAYS → DISTANCE 2')
  );

  // ==================== ACT 3 (17–21): Sort Distances & Pick the Middle ====================

  // 17: Now let's line up all seven distances from smallest to largest.
  const sortTitle1 = T('Sorted distances (days)', P ? 17 : 17, C.muted);
  sortTitle1.moveTo([CX, ROW_Y + CH / 2 + (P ? 0.34 : 0.24), 0]);
  const slotBoxes1 = DIST1_SORT.map((_, k) => makeSlotOutline(cardX(k), ROW_Y));
  await until(S(17));
  await play(
    new M.FadeIn(sortTitle1),
    new M.LaggedStart(slotBoxes1.map(s => new M.FadeIn(s)), { lagRatio: 0.06, runTime: 1.0 }),
    ...fbox(['7 distances:', '2, 1, 1, 0, 1, 1, 2', ['sort small → large', C.amber]], C.amber),
    ...say('SORT: SMALLEST → LARGEST', C.amber)
  );

  // 18: First comes zero, then four ones in a row, and then two twos.
  const cards1 = DIST1_SORT.map((v, k) => makeCard(cardX(k), ROW_Y, v, k === 0 ? C.amber : C.cyan));
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...slotBoxes1)),
    new M.LaggedStart(cards1.map(c => new M.FadeIn(c.r)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.LaggedStart(cards1.map(c => new M.FadeIn(c.t)), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['sorted distances:', ['0, 1, 1, 1, 1, 2, 2', C.cyan]], C.cyan),
    ...say('0, 1, 1, 1, 1, 2, 2')
  );

  // 19: With seven distances in order, the middle one sits in the fourth spot, with three on each side.
  const spots1 = DIST1_SORT.map((_, k) => {
    const t = T(`#${k + 1}`, P ? 15 : 15, k === 3 ? C.green : C.muted, true);
    t.moveTo([cardX(k), ROW_Y - CH / 2 - (P ? 0.28 : 0.22), 0]);
    return t;
  });
  const sideY1 = ROW_Y - CH / 2 - (P ? 0.66 : 0.52);
  const sideL1 = T('← 3 left', P ? 15 : 15, C.muted); sideL1.moveTo([cardX(1), sideY1, 0]);
  const sideR1 = T('3 right →', P ? 15 : 15, C.muted); sideR1.moveTo([cardX(5), sideY1, 0]);
  cards1[3].r.setColor(C.green);
  await until(S(19));
  await play(
    new M.LaggedStart(spots1.map(s => new M.FadeIn(s)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.FadeIn(sideL1), new M.FadeIn(sideR1),
    new M.Indicate(cards1[3].r, { color: C.green }),
    ...fbox(['7 ordered distances:', '3 left | [4th] | 3 right', ['middle = 4th spot', C.green]], C.green),
    ...say('4TH SPOT = MIDDLE', C.green)
  );

  // 20: Count to the fourth spot: first is zero, and the next four spots are all ones.
  await until(S(20));
  await play(
    new M.LaggedStart([0, 1, 2, 3, 4].map(k => new M.Indicate(cards1[k].r, { color: k === 3 ? C.green : C.amber })), { lagRatio: 0.25, runTime: 2.2 }),
    ...fbox(['1st: 0', '2nd–5th: 1, 1, 1, 1', ['4th spot = 1', C.green]], C.green),
    ...say('COUNT: 0, THEN FOUR 1S', C.green)
  );

  // 21: So the middle distance is one day.
  cards1[3].r.setColor(C.green); cards1[3].r.setFill(C.green, 0.24);
  const card1MidT = T('1', P ? 20 : 21, C.green, true); card1MidT.moveTo([cardX(3), ROW_Y, 0]);
  await until(S(21));
  await play(
    new M.FadeOut(cards1[3].t, { runTime: 0.6 }), new M.FadeIn(card1MidT, { runTime: 0.6 }),
    new M.Flash(cards1[3].r, { color: C.green, runTime: 0.7 }),
    ...fbox(['0, 1, 1, [1], 1, 2, 2', ['middle distance = 1 day', C.green]], C.green),
    ...say('MIDDLE DISTANCE = 1 DAY', C.green)
  );
  cards1[3].t = card1MidT;

  // ==================== ACT 4 (22–30): Naming the Median Absolute Deviation ====================

  // 22: Now we can name what you just found. (short: 1.64s)
  await until(S(22));
  await play(
    ...fbox(['naming what you found:', ['3 parts to the name', C.violet]], C.violet),
    ...say('LET’S NAME IT', C.violet)
  );

  // 23: A distance from a center point is called a deviation.
  const allDistBars = [distBar0, distBar1, distBar2, distBar4, distBar5, distBar6];
  await until(S(23));
  await play(
    new M.LaggedStart(allDistBars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.1, runTime: 1.3 }),
    ...fbox(['distance from center', ['= DEVIATION', C.violet]], C.violet),
    ...say('DISTANCE FROM CENTER = DEVIATION', C.violet)
  );

  // 24: Earlier, we measured deviations from the mean. Here, we measure them from the median.
  await until(S(24));
  await play(
    new M.Indicate(medLine8, { color: C.amber }),
    new M.Indicate(medTag8, { color: C.amber }),
    ...fbox(['before: from the mean', ['now:    from the median', C.amber]], C.amber),
    ...say('DEVIATIONS FROM THE MEDIAN', C.amber)
  );

  // 25: When we keep only the size and ignore earlier or later, we call it an absolute deviation.
  const allDistLabs = [distLab0, distLab1, distLab2, distLab3, distLab4, distLab5, distLab6];
  await until(S(25));
  await play(
    new M.LaggedStart(allDistLabs.map(l => new M.Indicate(l, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.5 }),
    ...fbox(['size only (no − or +)', ['= ABSOLUTE DEVIATION', C.cyan]], C.cyan),
    ...say('SIZE ONLY = ABSOLUTE DEVIATION', C.cyan)
  );

  // 26: Here, absolute does not mean total. (short: 2.68s)
  await until(S(26));
  await play(
    ...fbox([['absolute ≠ total', C.pink], ['(not adding them up)', C.muted]], C.pink),
    ...say('ABSOLUTE ≠ TOTAL', C.pink)
  );

  // 27: It just means the size on its own. (short: 1.94s)
  await until(S(27));
  await play(
    ...fbox([['absolute = size only', C.cyan], ['e.g. 2 days, 1 day', C.ink]], C.cyan),
    ...say('ABSOLUTE = SIZE ON ITS OWN', C.cyan)
  );

  // 28: And we picked the middle distance, which is the median of the distances.
  await until(S(28));
  await play(
    new M.Indicate(cards1[3].r, { color: C.green }),
    ...fbox(['middle of 0,1,1,[1],1,2,2', ['= MEDIAN of distances', C.green]], C.green),
    ...say('MEDIAN OF THE DISTANCES', C.green)
  );

  // 29: So the full name is the median absolute deviation.
  await until(S(29));
  await play(
    new M.Indicate(cards1[3].r, { color: C.amber }),
    ...fbox([['MEDIAN', C.green], ['ABSOLUTE', C.cyan], ['DEVIATION', C.violet], ['= 1 day', C.amber]], C.green),
    ...say('MEDIAN ABSOLUTE DEVIATION', C.green)
  );

  // 30: People often shorten it to M A D.
  await until(S(30));
  await play(
    new M.Flash(cards1[3].r, { color: C.amber }),
    ...fbox([['M A D', C.amber], ['Median Absolute Deviation', C.ink], ['= 1 day', C.green]], C.amber),
    ...say('SHORT NAME: MAD = 1 DAY', C.amber)
  );

  // ==================== ACT 5 (31–44): Late Week (7 → 21 Days) ====================

  // 31: Now let's test what happens when one parcel gets lost in the post.
  await until(S(31));
  await play(
    new M.Indicate(dots[6], { color: C.pink }),
    ...fbox(['late week test:', ['one parcel lost in post', C.pink]], C.pink),
    ...say('TEST: ONE PARCEL LOST!', C.pink)
  );

  // 32: That last parcel arrives in twenty-one days instead of seven, sliding far out to the right.
  const pos22 = D2.map((_, k) => dotPlotPos(D2, k, x22, LY, P ? 0.42 : 0.36));
  const ticks22 = makeTicks([0, 5, 10, 15, 20], x22, LY);
  const lab21 = T('21', P ? 18 : 19, C.pink, true);
  lab21.moveTo([x22(21) + 0.22 + lab21.getWidth() / 2, pos22[6][1], 0]);
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(
      ticks8, medLine8, medTag8, standDot, ...drops8,
      ...allDistBars, ...allDistLabs,
      sortTitle1, ...cards1.map(c => c.r), ...cards1.map(c => c.t), ...spots1, sideL1, sideR1
    )),
    new M.FadeIn(ticks22),
    ...D2.map((_, k) => new M.Transform(dots[k], makeDot(pos22[k], k === 6 ? C.pink : C.cyan, DOT_R22), { runTime: 1.5 })),
    ...D2.map((_, k) => new M.Transform(halos[k], makeHalo(pos22[k], k === 6 ? C.pink : C.cyan, HALO_R22), { runTime: 1.5 })),
    new M.FadeIn(lab21),
    ...fbox(['late week (days):', ['3, 4, 4, 5, 6, 6, 21', C.pink]], C.pink),
    ...say('7 DAYS → 21 DAYS', C.pink)
  );
  styleDot(dots, halos, 6, C.pink, 1, 0.24);

  // 33: First, check whether the middle delivery time changed.
  const medLine22 = new M.DashedLine({ start: [x22(5), LY - 0.10, 0], end: [x22(5), MED_TOP, 0], color: C.amber });
  await until(S(33));
  await play(
    new M.Create(medLine22),
    ...fbox(['step 1: check median', ['3, 4, 4, 5, 6, 6, 21', C.ink]], C.amber),
    ...say('DID THE MEDIAN CHANGE?', C.amber)
  );

  // 34: There are still three parcels below five days, and three parcels above it.
  const brY22 = LY + (P ? 1.55 : 1.32);
  const brBelow22 = T('3 below', P ? 16 : 16, C.cyan, true);
  brBelow22.moveTo([clampX(x22(3.5) - 0.25, brBelow22.getWidth()), brY22, 0]);
  const brAbove22 = makeBracket(x22(6), x22(21), brY22 - 0.12, -0.18, '', C.cyan);
  const labAbove22 = T('3 above', P ? 16 : 16, C.cyan, true);
  labAbove22.moveTo([(x22(6) + x22(21)) / 2, brY22 + 0.24, 0]);
  await until(S(34));
  await play(
    new M.FadeIn(brBelow22), new M.FadeIn(brAbove22), new M.FadeIn(labAbove22),
    new M.LaggedStart([0, 1, 2, 4, 5, 6].map(k => new M.Indicate(dots[k], { color: C.amber })), { lagRatio: 0.1, runTime: 1.5 }),
    ...fbox(['below 5: 3, 4, 4  (3)', 'above 5: 6, 6, 21 (3)'], C.cyan),
    ...say('STILL 3 BELOW · 3 ABOVE')
  );

  // 35: So the middle delivery time is still five days.
  const medTag22 = pill('MEDIAN = 5', C.amber, P ? 16 : 16);
  medTag22.moveTo([clampX(x22(5), 2.1), MED_TAG_Y, 0]);
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(brBelow22, brAbove22, labAbove22)),
    new M.FadeIn(medTag22), new M.Flash(dots[3], { color: C.amber }),
    ...fbox(['3 below | [5] | 3 above', ['median = 5 (unchanged)', C.amber]], C.amber),
    ...say('MEDIAN IS STILL 5 DAYS', C.amber)
  );

  // 36: Next, check each parcel's distance from five again.
  await until(S(36));
  await play(
    new M.Indicate(medLine22, { color: C.cyan }),
    ...fbox(['step 2: distances from 5', ['3, 4, 4, 5, 6, 6, 21', C.cyan]], C.cyan),
    ...say('CHECK DISTANCES FROM 5')
  );

  // 37: The first six parcels did not move, so their distances stay the same.
  const f6W = x22(6) - x22(3) + 0.56, f6H = P ? 1.15 : 1.02;
  const first6Box = new M.RoundedRectangle({ width: f6W, height: f6H, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
  first6Box.setFill(C.cyan, 0.08); first6Box.moveTo([(x22(3) + x22(6)) / 2, LY + f6H / 2 + 0.08, 0]);
  await until(S(37));
  await play(
    new M.Create(first6Box),
    new M.LaggedStart([0, 1, 2, 3, 4, 5].map(k => new M.Indicate(dots[k], { color: C.cyan })), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['first 6 unchanged:', ['distances: 2, 1, 1, 0, 1, 1', C.cyan]], C.cyan),
    ...say('FIRST 6: SAME DISTANCES')
  );

  // 38: Only the late parcel changes. (short: 2.18s)
  await until(S(38));
  await play(
    new M.FadeOut(first6Box, { runTime: 0.6 }),
    new M.Flash(dots[6], { color: C.pink, runTime: 0.7 }),
    ...fbox(['first 6: 2, 1, 1, 0, 1, 1', ['only 21-day changes', C.pink]], C.pink),
    ...say('ONLY THE LATE PARCEL CHANGES', C.pink)
  );

  // 39: From five days to twenty-one days is sixteen days.
  const bar16Y = LY + (P ? 1.28 : 1.12);
  const drop21 = new M.DashedLine({ start: [x22(21), pos22[6][1] + 0.15, 0], end: [x22(21), bar16Y, 0], color: C.pink });
  const distBar16 = measureBar(x22(5), x22(21), bar16Y, C.pink, 3.5);
  const distLab16 = T('16 days', P ? 19 : 19, C.pink, true);
  distLab16.moveTo([(x22(5) + x22(21)) / 2, bar16Y + 0.28, 0]);
  await until(S(39));
  await play(
    new M.Create(drop21), new M.Create(distBar16), new M.FadeIn(distLab16),
    ...fbox(['from 5 to 21:', ['21 − 5 = 16 days', C.pink]], C.pink),
    ...say('5 TO 21 = 16 DAYS', C.pink)
  );

  // 40: So its distance jumps from two days all the way to sixteen.
  await until(S(40));
  await play(
    new M.Indicate(distBar16, { color: C.amber }),
    new M.Indicate(distLab16, { color: C.amber }),
    ...fbox(['late parcel distance:', ['2 days → 16 days!', C.pink]], C.pink),
    ...say('DISTANCE JUMPS: 2 → 16', C.pink)
  );

  // 41: Now line up all seven distances from smallest to largest.
  const sortTitle2 = T('Late week: sorted distances (days)', P ? 17 : 17, C.muted);
  sortTitle2.moveTo([CX, ROW_Y + CH / 2 + (P ? 0.34 : 0.24), 0]);
  const slotBoxes2 = DIST2_SORT.map((_, k) => makeSlotOutline(cardX(k), ROW_Y));
  await until(S(41));
  await play(
    new M.FadeIn(sortTitle2),
    new M.LaggedStart(slotBoxes2.map(s => new M.FadeIn(s)), { lagRatio: 0.06, runTime: 1.0 }),
    ...fbox(['late week distances:', '2, 1, 1, 0, 1, 1, 16', ['sort small → large', C.cyan]], C.cyan),
    ...say('SORT THE 7 DISTANCES')
  );

  // 42: We have zero, then four ones in a row, a two, and finally sixteen.
  const cards2 = DIST2_SORT.map((v, k) => makeCard(cardX(k), ROW_Y, v, k === 6 ? C.pink : (k === 0 ? C.amber : C.cyan)));
  const spots2 = DIST2_SORT.map((_, k) => {
    const t = T(`#${k + 1}`, P ? 15 : 15, k === 3 ? C.green : C.muted, true);
    t.moveTo([cardX(k), ROW_Y - CH / 2 - (P ? 0.28 : 0.22), 0]);
    return t;
  });
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(...slotBoxes2)),
    new M.LaggedStart(cards2.map(c => new M.FadeIn(c.r)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.LaggedStart(cards2.map(c => new M.FadeIn(c.t)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...spots2)),
    ...fbox(['sorted distances:', ['0, 1, 1, 1, 1, 2, 16', C.pink]], C.pink),
    ...say('0, 1, 1, 1, 1, 2, 16')
  );

  // 43: Look at the fourth spot in the middle: it is still one day.
  cards2[3].r.setColor(C.green); cards2[3].r.setFill(C.green, 0.24);
  const card2MidT = T('1', P ? 20 : 21, C.green, true); card2MidT.moveTo([cardX(3), ROW_Y, 0]);
  const midPtr2 = T('still 1 day!', P ? 16 : 16, C.green, true);
  midPtr2.moveTo([cardX(3), ROW_Y - CH / 2 - (P ? 0.66 : 0.52), 0]);
  await until(S(43));
  await play(
    new M.FadeOut(cards2[3].t), new M.FadeIn(card2MidT), new M.FadeIn(midPtr2),
    new M.Flash(cards2[3].r, { color: C.green }),
    ...fbox(['0, 1, 1, [1], 1, 2, 16', ['4th spot = still 1 day', C.green]], C.green),
    ...say('4TH SPOT: STILL 1 DAY', C.green)
  );
  cards2[3].t = card2MidT;

  // 44: So the median absolute deviation stays at one day.
  await until(S(44));
  await play(
    new M.Indicate(cards2[3].r, { color: C.green }),
    ...fbox(['normal week: MAD = 1', ['late week:   MAD = 1', C.green], ['(did not move!)', C.amber]], C.green),
    ...say('MAD STAYS AT 1 DAY', C.green)
  );

  // ==================== ACT 6 (45–51): Compare Middle vs Average of Distances ====================

  // 45: Notice why picking the middle distance matters here.
  await until(S(45));
  await play(
    new M.Indicate(cards2[3].r, { color: C.green }),
    new M.Indicate(cards2[6].r, { color: C.pink }),
    ...fbox(['why pick the middle?', ['compare vs average', C.violet]], C.violet),
    ...say('WHY PICK THE MIDDLE?', C.violet)
  );

  // Comparison bar chart geometry
  const BX0 = P ? -1.65 : -4.20;
  const LBL_X = P ? -2.62 : -5.35;
  const BAR_U = P ? 1.12 : 1.48;
  const BAR_H = P ? 0.38 : 0.32;
  const NY_H = P ? 2.45 : 1.15, NY_S = P ? 1.95 : 0.72, NY_A = P ? 1.35 : 0.20, NY_M = P ? 0.75 : -0.32;
  const DIV_Y = P ? 0.05 : -0.80;
  const LY_H = P ? -0.55 : -1.22, LY_S = P ? -1.05 : -1.65, LY_A = P ? -1.65 : -2.17, LY_M = P ? -2.25 : -2.69;

  const makeCompBar = (val, y, color, label, valText) => {
    const w = val * BAR_U;
    const lbl = T(label, P ? 17 : 17, color, true); lbl.moveTo([LBL_X, y, 0]);
    const bar = new M.Rectangle({ width: w, height: BAR_H, color, strokeWidth: 2 });
    bar.setFill(color, 0.42); bar.moveTo([BX0 + w / 2, y, 0]);
    const vt = T(valText, P ? 17 : 17, color, true);
    vt.moveTo([BX0 + w + 0.14 + vt.getWidth() / 2, y, 0]);
    return { lbl, bar, vt };
  };

  // 46: Suppose instead you shared the distances equally, to find their average.
  const cmpNormHdr = fitText(T('Normal week:  0, 1, 1, 1, 1, 2, 2', P ? 18 : 19, C.cyan, true), L0);
  cmpNormHdr.moveTo([CX, NY_H, 0]);
  const cmpLateHdr = fitText(T('Late week:  0, 1, 1, 1, 1, 2, 16', P ? 18 : 19, C.pink, true), L0);
  cmpLateHdr.moveTo([CX, LY_H, 0]);
  const cmpDiv = new M.DashedLine({ start: [X0 + 0.2, DIV_Y, 0], end: [X1 - 0.2, DIV_Y, 0], color: C.line });
  await until(S(46));
  await play(
    new M.FadeOut(new M.VGroup(
      axis, ticks22, ...dots, ...halos, lab21, medLine22, medTag22, distBar16, distLab16, drop21,
      sortTitle2, ...cards2.map(c => c.r), ...cards2.map(c => c.t), ...spots2, midPtr2
    )),
    new M.FadeIn(cmpNormHdr), new M.Create(cmpDiv), new M.FadeIn(cmpLateHdr),
    ...fbox(['instead of middle:', ['share distances equally', C.amber], ['(find their average)', C.muted]], C.amber),
    ...say('WHAT IF WE AVERAGED DISTANCES?', C.amber)
  );

  // 47: In the normal week, the distances add up to eight days.
  const cmpNormSum = fitText(T('0 + 1 + 1 + 1 + 1 + 2 + 2 = 8 days', P ? 17 : 18, C.amber, true), L0);
  cmpNormSum.moveTo([CX, NY_S, 0]);
  await until(S(47));
  await play(
    new M.FadeIn(cmpNormSum),
    ...fbox(['normal distances:', '0+1+1+1+1+2+2', ['sum = 8 days', C.amber]], C.amber),
    ...say('NORMAL SUM = 8 DAYS', C.amber)
  );

  // 48: Eight days shared across seven parcels is just over one day each.
  const normAvg = makeCompBar(8 / 7, NY_A, C.amber, 'Average', '≈ 1.14 d');
  const normMad = makeCompBar(1, NY_M, C.green, 'MAD', '1 day');
  await until(S(48));
  await play(
    new M.FadeIn(normAvg.lbl), new M.Create(normAvg.bar), new M.FadeIn(normAvg.vt),
    new M.FadeIn(normMad.lbl), new M.Create(normMad.bar), new M.FadeIn(normMad.vt),
    ...fbox(['normal week:', ['average = 8 ÷ 7 ≈ 1.14', C.amber], ['MAD     = 1 day', C.green]], C.amber),
    ...say('8 ÷ 7 ≈ 1.14 DAYS EACH', C.amber)
  );

  // 49: In the late week, the distances add up to twenty-two days.
  const cmpLateSum = fitText(T('0 + 1 + 1 + 1 + 1 + 2 + 16 = 22 days', P ? 17 : 18, C.pink, true), L0);
  cmpLateSum.moveTo([CX, LY_S, 0]);
  await until(S(49));
  await play(
    new M.FadeIn(cmpLateSum),
    ...fbox(['late distances:', '0+1+1+1+1+2+16', ['sum = 22 days', C.pink]], C.pink),
    ...say('LATE SUM = 22 DAYS', C.pink)
  );

  // 50: Shared across seven parcels, that is a bit more than three days each.
  const lateAvg = makeCompBar(22 / 7, LY_A, C.pink, 'Average', '≈ 3.14 d');
  const lateMad = makeCompBar(1, LY_M, C.green, 'MAD', '1 day');
  await until(S(50));
  await play(
    new M.FadeIn(lateAvg.lbl), new M.Create(lateAvg.bar), new M.FadeIn(lateAvg.vt),
    new M.FadeIn(lateMad.lbl), new M.Create(lateMad.bar), new M.FadeIn(lateMad.vt),
    ...fbox(['late week:', ['average = 22 ÷ 7 ≈ 3.14', C.pink], ['MAD     = 1 day', C.green]], C.pink),
    ...say('22 ÷ 7 ≈ 3.14 DAYS EACH', C.pink)
  );

  // 51: One late parcel almost tripled that average. The middle distance did not move at all.
  const steadyTag = pill('UNCHANGED', C.green, 15);
  steadyTag.moveTo([BX0 + 1 * BAR_U + (P ? 2.15 : 2.35), LY_M, 0]);
  await until(S(51));
  await play(
    new M.Indicate(lateAvg.bar, { color: C.pink }),
    new M.Indicate(normMad.bar, { color: C.green }),
    new M.Indicate(lateMad.bar, { color: C.green }),
    new M.FadeIn(steadyTag),
    ...fbox([['average: 1.14 → 3.14 (~3×)', C.pink], ['MAD:     1 → 1 (steady!)', C.green]], C.green),
    ...say('AVERAGE ~3×  ·  MAD UNCHANGED', C.green)
  );

  // ==================== ACT 7 (52–56): The Three Steps & Formula ====================

  const STEP_W = P ? 6.6 : 7.4, STEP_H = P ? 1.05 : 0.86;
  const makeStepCard = (y, head, sub, color) => {
    const r = new M.RoundedRectangle({ width: STEP_W, height: STEP_H, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t1 = fitText(T(head, P ? 19 : 19, color, false, true), STEP_W - 0.5);
    t1.moveTo([CX, y + (P ? 0.21 : 0.17), 0]);
    const t2 = fitText(T(sub, P ? 16 : 16, C.ink, true), STEP_W - 0.5);
    t2.moveTo([CX, y - (P ? 0.22 : 0.18), 0]);
    return new M.VGroup(r, t1, t2);
  };

  // 52: Now the short version of the three steps you just did.
  const stepSlots = [[P ? 2.05 : 0.72, C.amber], [P ? 0.68 : -0.35, C.cyan], [P ? -0.69 : -1.42, C.green]].map(([y, col], i) => {
    const r = new M.RoundedRectangle({ width: STEP_W, height: STEP_H, cornerRadius: 0.16, color: col, strokeWidth: 1.5 });
    r.setFill(C.card, 0.5); r.moveTo([CX, y, 0]);
    const n = T(`step ${i + 1}`, 19, col, true); n.moveTo([CX, y, 0]);
    return new M.VGroup(r, n);
  });
  await until(S(52));
  await play(
    new M.LaggedStart(stepSlots.map(s => new M.FadeIn(s)), { lagRatio: 0.25, runTime: 1.2 }),
    new M.FadeOut(new M.VGroup(
      cmpNormHdr, cmpDiv, cmpNormSum,
      normAvg.lbl, normAvg.bar, normAvg.vt, normMad.lbl, normMad.bar, normMad.vt,
      cmpLateHdr, cmpLateSum,
      lateAvg.lbl, lateAvg.bar, lateAvg.vt, lateMad.lbl, lateMad.bar, lateMad.vt,
      steadyTag
    )),
    ...fbox(['how to find MAD:', ['3 simple steps', C.cyan]], C.cyan),
    ...say('3 SIMPLE STEPS')
  );

  // 53: First, find the median delivery time.
  const step1 = makeStepCard(P ? 2.05 : 0.72, '1. Find the median delivery time', '3, 4, 4, [5], 6, 6, 7  →  median = 5', C.amber);
  await until(S(53));
  await play(
    new M.FadeIn(step1, { runTime: 0.8 }),
    ...fbox([['1. Find the median', C.amber]], C.amber),
    ...say('STEP 1: FIND THE MEDIAN', C.amber)
  );

  // 54: Second, measure each parcel's distance from it, ignoring earlier or later.
  const step2 = makeStepCard(P ? 0.68 : -0.35, '2. Measure each distance (size only)', 'from 5  →  2, 1, 1, 0, 1, 1, 2', C.cyan);
  await until(S(54));
  await play(
    new M.FadeIn(step2, { runTime: 0.85 }),
    ...fbox(['1. Find the median', ['2. Distances (size only)', C.cyan]], C.cyan),
    ...say('STEP 2: MEASURE DISTANCES')
  );

  // 55: Third, sort those distances and pick the middle one.
  const step3 = makeStepCard(P ? -0.69 : -1.42, '3. Sort distances & pick the middle', '0, 1, 1, [1], 1, 2, 2  →  MAD = 1 day', C.green);
  await until(S(55));
  await play(
    new M.FadeIn(step3, { runTime: 0.85 }),
    ...fbox(['1. Find the median', '2. Distances (size only)', ['3. Sort & pick middle', C.green]], C.green),
    ...say('STEP 3: SORT & PICK MIDDLE', C.green)
  );

  // 56: On screen, in one line: M A D equals the median of the distances from the median.
  const fY = P ? -2.15 : -2.42, fH = P ? 0.82 : 0.72;
  const fRect = new M.RoundedRectangle({ width: STEP_W, height: fH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  fRect.setFill(C.amber, 0.14); fRect.moveTo([CX, fY, 0]);
  const fTxt = fitText(T('MAD = median of the distances from the median', P ? 17 : 18, C.amber, true, true), STEP_W - 0.45);
  fTxt.moveTo([CX, fY, 0]);
  const formulaBanner = new M.VGroup(fRect, fTxt);
  await until(S(56));
  await play(
    new M.FadeIn(formulaBanner),
    ...fbox([['MAD = median of the', C.amber], ['distances from the median', C.green]], C.amber),
    ...say('MAD IN ONE LINE', C.amber)
  );

  // ==================== ACT 8 (57–63): Use, Promise, Trap, Bridge & Recap ====================

  const LY_END = P ? 0.05 : -0.75;
  const BAND_H = P ? 1.28 : 1.15;

  // 57: Use this tool when you want a typical distance from the middle that one odd parcel cannot spoil.
  const axisEnd = new M.Line({ start: [X0, LY_END, 0], end: [X1, LY_END, 0], color: C.muted, strokeWidth: 3 });
  const ticksEnd8 = makeTicks([2, 3, 4, 5, 6, 7, 8], x8, LY_END);
  const posEnd8 = D1.map((_, k) => dotPlotPos(D1, k, x8, LY_END));
  const halosEnd = posEnd8.map(p => makeHalo(p, C.cyan, HALO_R));
  const dotsEnd = posEnd8.map(p => makeDot(p, C.cyan, DOT_R));
  const medLineEnd8 = new M.DashedLine({ start: [x8(5), LY_END - 0.10, 0], end: [x8(5), LY_END + BAND_H + 0.18, 0], color: C.amber });
  const medTagEnd8 = pill('MEDIAN = 5', C.amber, P ? 16 : 16);
  medTagEnd8.moveTo([x8(5), LY_END + BAND_H + (P ? 0.72 : 0.62), 0]);
  await until(S(57));
  await play(
    new M.FadeOut(new M.VGroup(...stepSlots, step1, step2, step3, formulaBanner)),
    new M.Create(axisEnd), new M.FadeIn(ticksEnd8),
    new M.LaggedStart(dotsEnd.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.0 }),
    new M.LaggedStart(halosEnd.map(h => new M.FadeIn(h)), { lagRatio: 0.08, runTime: 1.0 }),
    new M.Create(medLineEnd8), new M.FadeIn(medTagEnd8),
    ...fbox(['use MAD when:', ['typical spread from middle', C.green], ['one odd value can’t spoil', C.cyan]], C.green),
    ...say('TYPICAL DISTANCE · ODD-PROOF', C.green)
  );

  // 58: It also gives a simple promise: at least half the parcels sit within one M A D of the median.
  const bandEnd8 = new M.Rectangle({ width: x8(6) - x8(4), height: BAND_H, color: C.green, strokeWidth: 0 });
  bandEnd8.setFill(C.green, 0.16); bandEnd8.moveTo([x8(5), LY_END + BAND_H / 2, 0]);
  const edge4End8 = new M.DashedLine({ start: [x8(4), LY_END - 0.10, 0], end: [x8(4), LY_END + BAND_H, 0], color: C.green });
  const edge6End8 = new M.DashedLine({ start: [x8(6), LY_END - 0.10, 0], end: [x8(6), LY_END + BAND_H, 0], color: C.green });
  const spanY8 = LY_END - (P ? 1.15 : 1.02);
  const bandSpan8 = new M.VGroup(
    measureBar(x8(4), x8(6), spanY8, C.green, 3.5),
    T('5 ± 1 MAD  (4 to 6)', P ? 17 : 17, C.green, true).moveTo([x8(5), spanY8 - 0.32, 0])
  );
  await until(S(58));
  await play(
    new M.FadeIn(bandEnd8), new M.Create(edge4End8), new M.Create(edge6End8), new M.FadeIn(bandSpan8),
    ...fbox(['simple promise:', ['at least half sit within', C.green], ['median ± 1 MAD', C.amber]], C.green),
    ...say('PROMISE: ≥ HALF WITHIN 1 MAD', C.green)
  );

  // 59: For the café, five of the seven parcels arrived within one day of five days.
  const fiveTag = T('5 of 7 inside', P ? 17 : 17, C.green, true);
  fiveTag.moveTo([x8(5), LY_END + BAND_H + (P ? 0.24 : 0.20), 0]);
  await until(S(59));
  [1, 2, 3, 4, 5].forEach(k => styleDot(dotsEnd, halosEnd, k, C.green, 1, 0.24));
  [0, 6].forEach(k => styleDot(dotsEnd, halosEnd, k, C.muted, 0.35, 0.05));
  await play(
    new M.FadeIn(fiveTag),
    new M.LaggedStart([1, 2, 3, 4, 5].map(k => new M.Indicate(dotsEnd[k], { color: C.green })), { lagRatio: 0.14, runTime: 1.5 }),
    ...fbox(['within 1 day of 5:', ['4, 4, 5, 6, 6', C.green], ['5 of 7 parcels (> half)', C.amber]], C.green),
    ...say('5 OF 7 WITHIN 1 DAY OF 5', C.green)
  );

  // 60: Watch out for one trap, though. (short: 1.73s)
  await until(S(60));
  await play(
    ...fbox([['WATCH OUT:', C.pink], ['one trap to know', C.ink]], C.pink),
    ...say('WATCH OUT: ONE TRAP', C.pink)
  );

  // 61: Because this measure ignores extreme delays, it will not warn you about a rare, badly lost parcel.
  const posEnd22 = D2.map((_, k) => dotPlotPos(D2, k, x22, LY_END, P ? 0.42 : 0.36));
  const ticksEnd22 = makeTicks([0, 5, 10, 15, 20], x22, LY_END);
  const medLineEnd22 = new M.DashedLine({ start: [x22(5), LY_END - 0.10, 0], end: [x22(5), LY_END + BAND_H + 0.12, 0], color: C.amber });
  const medTagEnd22 = pill('MEDIAN = 5', C.amber, P ? 15 : 15);
  medTagEnd22.moveTo([clampX(x22(5), 2.0), LY_END + BAND_H + (P ? 0.48 : 0.42), 0]);
  const bandEnd22 = new M.Rectangle({ width: x22(6) - x22(4), height: BAND_H, color: C.green, strokeWidth: 2 });
  bandEnd22.setFill(C.green, 0.18); bandEnd22.moveTo([x22(5), LY_END + BAND_H / 2, 0]);
  const madEndTag = pill('MAD = 1', C.green, P ? 16 : 16);
  madEndTag.moveTo([clampX(x22(5), 1.8), LY_END - (P ? 1.22 : 1.05), 0]);
  const warnRing21 = makeRing(posEnd22[6], C.pink, 0.28);
  const warnLab21 = T('21 days!', P ? 18 : 19, C.pink, true);
  warnLab21.moveTo([clampX(x22(21), 1.4), posEnd22[6][1] + 0.56, 0]);
  await until(S(61));
  await play(
    new M.FadeOut(new M.VGroup(ticksEnd8, medLineEnd8, medTagEnd8, bandEnd8, edge4End8, edge6End8, bandSpan8, fiveTag)),
    new M.FadeIn(ticksEnd22),
    ...D2.map((_, k) => new M.Transform(dotsEnd[k], makeDot(posEnd22[k], k === 6 ? C.pink : (k >= 1 && k <= 5 ? C.green : C.cyan), DOT_R22), { runTime: 1.4 })),
    ...D2.map((_, k) => new M.Transform(halosEnd[k], makeHalo(posEnd22[k], k === 6 ? C.pink : (k >= 1 && k <= 5 ? C.green : C.cyan), HALO_R22), { runTime: 1.4 })),
    new M.FadeIn(bandEnd22), new M.Create(medLineEnd22), new M.FadeIn(medTagEnd22), new M.FadeIn(madEndTag),
    new M.Create(warnRing21), new M.FadeIn(warnLab21),
    ...fbox([['TRAP:', C.pink], ['ignores extreme delays', C.pink], ['21-day loss goes unseen', C.muted]], C.pink),
    ...say('TRAP: HIDES EXTREME DELAYS', C.pink)
  );
  styleDot(dotsEnd, halosEnd, 6, C.pink, 1, 0.26);

  // 62: Next, we will compare steady tools like this one with tools that react to big surprises.
  await until(S(62));
  await play(
    new M.Indicate(bandEnd22, { color: C.green }),
    new M.Indicate(warnRing21, { color: C.pink }),
    ...fbox(['coming next:', ['steady: median, IQR, MAD', C.green], ['reactive: mean, range, SD', C.pink]], C.violet),
    ...say('NEXT: STEADY vs REACTIVE', C.violet)
  );

  // 63: The median absolute deviation is the middle distance from the median, and it stays steady even when one parcel arrives very late.
  await until(S(63));
  await play(
    new M.Indicate(madEndTag, { color: C.green }),
    new M.Indicate(bandEnd22, { color: C.green }),
    new M.Flash(dotsEnd[3], { color: C.amber }),
    ...fbox([['MAD = 1 day', C.green], ['middle distance from median', C.ink], ['steady vs 21-day delay', C.amber]], C.green),
    ...say('MAD = STEADY MIDDLE DISTANCE', C.green)
  );
}
