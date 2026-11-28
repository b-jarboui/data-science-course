// 1.3.4 Variance: measuring spread with squares (live animation, script.v4.md).
// Beat i = sentence i (0-based, 0..53). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const D7 = [3, 4, 4, 5, 6, 6, 7];
  const DEVS = [-2, -1, -1, 0, 1, 1, 2];
  const DEV_TXT = ['−2', '−1', '−1', '0', '+1', '+1', '+2'];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.35;
  const L0 = P ? 6.4 : 7.4;
  const X0 = CX - L0 / 2;
  const STEP = L0 / 6; // days 2..8, so 5 sits at CX
  const n2x = v => X0 + (v - 2) * STEP;
  const LY = P ? -0.45 : -1.05;
  const PILL = P ? [0, 3.85, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.55, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // 4 horizontal tracks above the days line so deviation arrows never cross dots
  const TY = k => LY + (P ? 0.44 + k * 0.54 : 0.36 + k * 0.42);
  const MEAN_TOP = P ? 2.25 : 1.05;
  const MEAN_TAG_Y = P ? 2.62 : 1.35;
  const DOT_R = P ? 0.11 : 0.10;
  const HALO_R = P ? 0.24 : 0.22;

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
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
    const maxw = P ? FW - 0.9 : 3.95;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Visual helpers (moveTo placement, setFill fills, no wrapping live objects)
  function makeDot(p, color = C.cyan, r = DOT_R, hr = HALO_R) {
    const halo = new M.Dot({ point: p, radius: hr, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1);
    return { halo, d };
  }
  function moveDotA(dot, q, color = C.cyan, opts = {}, r = DOT_R, hr = HALO_R) {
    const t = makeDot(q, color, r, hr);
    return [new M.Transform(dot.halo, t.halo, opts), new M.Transform(dot.d, t.d, opts)];
  }
  function arrow(x1, y1, x2, y2, color, sw = 3) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const tip = Math.min(0.18, len * 0.35), wid = tip * 0.55;
    const shaft = new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: sw });
    const w1 = new M.Line({ start: [x2, y2, 0], end: [x2 - ux * tip - uy * wid, y2 - uy * tip + ux * wid, 0], color, strokeWidth: sw });
    const w2 = new M.Line({ start: [x2, y2, 0], end: [x2 - ux * tip + uy * wid, y2 - uy * tip - ux * wid, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, w1, w2);
  }
  function devArrow(v, y, color) {
    const x1 = n2x(5), dir = v > 5 ? 1 : -1, x2 = n2x(v) - dir * (DOT_R + 0.05);
    return arrow(x1, y, x2, y, color, P ? 3.2 : 3);
  }
  function devLab(v, y, text, color) {
    const mx = (n2x(5) + n2x(v)) / 2;
    const t = T(text, P ? 18 : 17, color, true);
    t.moveTo([mx, y + (P ? 0.22 : 0.18), 0]);
    return t;
  }
  function dropLine(v, topY) {
    return new M.Line({ start: [n2x(v), LY, 0], end: [n2x(v), topY, 0], color: C.line, strokeWidth: 1.6 });
  }
  function balBar(units, side, y, label, color) {
    const bu = STEP * 0.50, w = units * bu, h = P ? 0.34 : 0.28;
    const cx = n2x(5) + side * (w / 2);
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: 2 });
    r.setFill(color, 0.24); r.moveTo([cx, y, 0]);
    const t = T(label, P ? 18 : 17, color, true); t.moveTo([cx, y, 0]);
    return new M.VGroup(r, t);
  }
  function bracket(x1, x2, y, drop, label, color) {
    const a = new M.Line({ start: [x1, y, 0], end: [x1, y - drop, 0], color, strokeWidth: 2.5 });
    const b = new M.Line({ start: [x1, y - drop, 0], end: [x2, y - drop, 0], color, strokeWidth: 2.5 });
    const c = new M.Line({ start: [x2, y - drop, 0], end: [x2, y, 0], color, strokeWidth: 2.5 });
    const t = T(label, P ? 17 : 17, color, true); t.moveTo([(x1 + x2) / 2, y - drop - 0.26, 0]);
    return new M.VGroup(a, b, c, t);
  }
  function makeTile(pos, w, h, color = C.cyan, op = 0.78) {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1.6 });
    r.setFill(color, op); r.moveTo(pos);
    return r;
  }
  function tintTile(t, color, op = 0.85) {
    t.setFill(color, op); t.setColor(color);
  }

  // --- 0: seven café parcels of coffee beans --------------------------------
  const parcels = [];
  const pw = P ? 0.68 : 0.80, ph = P ? 0.56 : 0.64, psp = P ? 0.94 : 1.24, py = P ? 0.8 : -0.35;
  for (let k = 0; k < 7; k++) {
    const x = CX + (k - 3) * psp;
    const box = new M.RoundedRectangle({ width: pw, height: ph, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
    box.setFill(C.card, 0.95); box.moveTo([x, py, 0]);
    const tv = new M.Line({ start: [x, py - ph / 2, 0], end: [x, py + ph / 2, 0], color: C.amber, strokeWidth: 2 });
    const th = new M.Line({ start: [x - pw / 2, py, 0], end: [x + pw / 2, py, 0], color: C.amber, strokeWidth: 2 });
    const num = T(String(k + 1), P ? 16 : 18, C.muted, true); num.moveTo([x, py - ph / 2 - 0.28, 0]);
    parcels.push(new M.VGroup(box, tv, th, num));
  }
  await until(S(0));
  await play(
    new M.LaggedStart(parcels.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.5 }),
    ...fbox(['café mails coffee beans', ['how consistent are', C.cyan], ['the delivery times?', C.cyan]], C.cyan),
    ...say('HOW CONSISTENT ARE DELIVERIES?')
  );

  // --- 1-3: days line, 7 glowing dots, mean = 5 -----------------------------
  const axis = new M.Line({ start: [n2x(2), LY, 0], end: [n2x(8), LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 19 : 19, C.muted, true).moveTo([n2x(v), LY - (P ? 0.36 : 0.34), 0])
  ));
  const unit = T('days', P ? 17 : 17, C.muted);
  unit.moveTo([n2x(8) - 0.1, LY - (P ? 0.70 : 0.64), 0]);

  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...parcels)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...fbox(['normal week:', ['7 parcels on a days line', C.cyan]], C.cyan),
    ...say('NORMAL WEEK: 7 PARCELS')
  );

  const rowY = r => LY + (P ? 0.34 + r * 0.42 : 0.30 + r * 0.36);
  const initPos = [
    [n2x(3), rowY(0), 0], [n2x(4), rowY(0), 0], [n2x(4), rowY(1), 0],
    [n2x(5), rowY(0), 0],
    [n2x(6), rowY(0), 0], [n2x(6), rowY(1), 0], [n2x(7), rowY(0), 0]
  ];
  const dots7 = initPos.map(p => makeDot(p, C.cyan));
  const valLabs = [
    T('3', P ? 18 : 17, C.cyan, true).moveTo([n2x(3), rowY(0) + 0.34, 0]),
    T('4, 4', P ? 18 : 17, C.cyan, true).moveTo([n2x(4), rowY(1) + 0.34, 0]),
    T('5', P ? 18 : 17, C.cyan, true).moveTo([n2x(5), rowY(0) + 0.34, 0]),
    T('6, 6', P ? 18 : 17, C.cyan, true).moveTo([n2x(6), rowY(1) + 0.34, 0]),
    T('7', P ? 18 : 17, C.cyan, true).moveTo([n2x(7), rowY(0) + 0.34, 0])
  ];

  await until(S(2));
  await play(
    new M.LaggedStart(dots7.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.d)]), { lagRatio: 0.08, runTime: 1.7 }),
    new M.FadeIn(new M.VGroup(...valLabs)),
    ...fbox(['days:', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan),
    ...say('3, 4, 4, 5, 6, 6, 7 DAYS')
  );

  const meanLine = new M.Line({ start: [n2x(5), LY, 0], end: [n2x(5), MEAN_TOP, 0], color: C.amber, strokeWidth: 3.5 });
  const meanTag = pill('MEAN = 5', C.amber, P ? 18 : 17);
  meanTag.moveTo([n2x(5), MEAN_TAG_Y, 0]);

  await until(S(3));
  await play(
    new M.Create(meanLine),
    new M.FadeIn(meanTag),
    ...fbox(['total = 35 days', '35 ÷ 7 = 5 days', ['mean  = 5 days', C.amber]], C.amber),
    ...say('MEAN = 5 DAYS', C.amber)
  );

  // --- 4-9: deviation arrows from mean 5 on 4 clean tracks ------------------
  const tr7 = [3, 1, 2, 0, 1, 2, 3];
  const trackPos7 = D7.map((v, k) => [n2x(v), TY(tr7[k]), 0]);
  const drops7 = [dropLine(3, TY(3)), dropLine(4, TY(2)), dropLine(6, TY(2)), dropLine(7, TY(3))];
  const offIdx = [0, 1, 2, 4, 5, 6];
  const arrows7 = {};
  offIdx.forEach(k => { arrows7[k] = devArrow(D7[k], TY(tr7[k]), D7[k] < 5 ? C.green : C.pink); });

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...valLabs)),
    new M.FadeIn(new M.VGroup(...drops7)),
    ...D7.flatMap((_, k) => moveDotA(dots7[k], trackPos7[k], C.cyan, { runTime: 1.3 })),
    new M.LaggedStart(offIdx.map(k => new M.FadeIn(arrows7[k])), { lagRatio: 0.1, runTime: 1.5 }),
    ...fbox([['gap from mean (5)', C.cyan], ['early ←  |  → late', C.muted]], C.cyan),
    ...say('GAPS FROM THE MEAN (5)')
  );

  const labs7 = {};
  // 5: 3 days -> -2
  await until(S(5));
  const a0 = devArrow(3, TY(3), C.green);
  labs7[0] = devLab(3, TY(3), '−2', C.green);
  await play(
    new M.FadeOut(arrows7[0]), new M.FadeIn(a0), new M.FadeIn(labs7[0]),
    ...fbox([['3 − 5 = −2', C.green]], C.green),
    ...say('3 DAYS → GAP = −2', C.green)
  );
  arrows7[0] = a0;

  // 6: 4, 4 days -> -1 each
  await until(S(6));
  const a1 = devArrow(4, TY(1), C.green), a2 = devArrow(4, TY(2), C.green);
  labs7[1] = devLab(4, TY(1), '−1', C.green);
  labs7[2] = devLab(4, TY(2), '−1', C.green);
  await play(
    new M.FadeOut(arrows7[1]), new M.FadeOut(arrows7[2]),
    new M.FadeIn(a1), new M.FadeIn(a2),
    new M.FadeIn(labs7[1]), new M.FadeIn(labs7[2]),
    ...fbox([['3 − 5 = −2', C.green], ['4 − 5 = −1  (×2)', C.green]], C.green),
    ...say('4 DAYS → GAP = −1 EACH', C.green)
  );
  arrows7[1] = a1; arrows7[2] = a2;

  // 7: 5 days -> 0
  await until(S(7));
  labs7[3] = T('0', P ? 19 : 18, C.amber, true).moveTo([n2x(5) + 0.28, TY(0), 0]);
  await play(
    new M.FadeIn(labs7[3]), new M.Flash(dots7[3].d, { color: C.amber }),
    ...fbox([['5 − 5 = 0', C.amber]], C.amber),
    ...say('5 DAYS → GAP = 0', C.amber)
  );

  // 8: 6, 6 days -> +1 each
  await until(S(8));
  const a4 = devArrow(6, TY(1), C.pink), a5 = devArrow(6, TY(2), C.pink);
  labs7[4] = devLab(6, TY(1), '+1', C.pink);
  labs7[5] = devLab(6, TY(2), '+1', C.pink);
  await play(
    new M.FadeOut(arrows7[4]), new M.FadeOut(arrows7[5]),
    new M.FadeIn(a4), new M.FadeIn(a5),
    new M.FadeIn(labs7[4]), new M.FadeIn(labs7[5]),
    ...fbox([['6 − 5 = +1  (×2)', C.pink]], C.pink),
    ...say('6 DAYS → GAP = +1 EACH', C.pink)
  );
  arrows7[4] = a4; arrows7[5] = a5;

  // 9: 7 days -> +2
  await until(S(9));
  const a6 = devArrow(7, TY(3), C.pink);
  labs7[6] = devLab(7, TY(3), '+2', C.pink);
  await play(
    new M.FadeOut(arrows7[6]), new M.FadeIn(a6), new M.FadeIn(labs7[6]),
    ...fbox([['6 − 5 = +1  (×2)', C.pink], ['7 − 5 = +2', C.pink]], C.pink),
    ...say('7 DAYS → GAP = +2', C.pink)
  );
  arrows7[6] = a6;

  // --- 10-11: gaps cancel out to 0, hiding spread ---------------------------
  const BAL_Y = P ? -2.05 : -2.22;
  const balMid = new M.Line({ start: [n2x(5), BAL_Y - 0.22, 0], end: [n2x(5), BAL_Y + 0.22, 0], color: C.amber, strokeWidth: 2.5 });
  const barL4 = balBar(4, -1, BAL_Y, '−4', C.green);
  const barR4 = balBar(4, 1, BAL_Y, '+4', C.pink);
  const sum0Tag = pill('−4 + 4 = 0', C.amber, P ? 17 : 16);
  sum0Tag.moveTo([n2x(5), BAL_Y - (P ? 0.56 : 0.48), 0]);

  await until(S(10));
  await play(
    new M.Create(balMid), new M.FadeIn(barL4), new M.FadeIn(barR4), new M.FadeIn(sum0Tag),
    ...fbox([['early: −2 − 1 − 1 = −4', C.green], ['late:  +1 + 1 + 2 = +4', C.pink], ['total: −4 + 4 = 0', C.amber]], C.amber),
    ...say('EARLY + LATE CANCEL → 0', C.amber)
  );

  const spreadBr = bracket(n2x(3), n2x(7), BAL_Y + 0.14, 0.24, 'spread: 3 to 7 days', C.amber);
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(balMid, barL4, barR4, sum0Tag)),
    new M.FadeIn(spreadBr),
    new M.Indicate(dots7[0].d, { color: C.amber }),
    new M.Indicate(dots7[6].d, { color: C.amber }),
    ...fbox([['sum of gaps = 0', C.pink], ['hides the real spread!', C.amber]], C.pink),
    ...say('ZERO HIDES THE SPREAD', C.pink)
  );

  // --- 12-27: turn each gap into a real geometric square --------------------
  const U = P ? 0.62 : 0.72; // 1 day = U units on screen
  const GAP = P ? 0.18 : 0.24;
  const MID_W = P ? 0.42 : 0.54;
  const sqX = new Array(7);
  sqX[3] = CX;
  sqX[2] = CX - (MID_W / 2 + GAP + U / 2);
  sqX[1] = sqX[2] - (U + GAP);
  sqX[0] = sqX[1] - (U / 2 + GAP + U);
  sqX[4] = CX + (MID_W / 2 + GAP + U / 2);
  sqX[5] = sqX[4] + (U + GAP);
  sqX[6] = sqX[5] + (U / 2 + GAP + U);

  const SQ_BASE = P ? 0.35 : -0.75;
  const sqBase = new M.Line({ start: [sqX[0] - U - 0.15, SQ_BASE, 0], end: [sqX[6] + U + 0.15, SQ_BASE, 0], color: C.muted, strokeWidth: 2.5 });

  // Horizontal gap bar under each column matching the exact width of its square
  const gapBars = DEVS.map((d, k) => {
    const col = d < 0 ? C.green : (d > 0 ? C.pink : C.amber);
    const y = SQ_BASE - 0.22;
    if (d === 0) {
      const dot0 = new M.Dot({ point: [sqX[k], y, 0], radius: 0.08, color: C.amber });
      dot0.setFill(C.amber, 1);
      return dot0;
    }
    const w = Math.abs(d) * U;
    const bar = new M.RoundedRectangle({ width: w, height: 0.12, cornerRadius: 0.05, color: col, strokeWidth: 1.5 });
    bar.setFill(col, 0.82); bar.moveTo([sqX[k], y, 0]);
    return bar;
  });
  const gapLabs = DEVS.map((d, k) => {
    const col = d < 0 ? C.green : (d > 0 ? C.pink : C.amber);
    return T(DEV_TXT[k], P ? 18 : 17, col, true).moveTo([sqX[k], SQ_BASE - (P ? 0.58 : 0.54), 0]);
  });
  const dayLabs = D7.map((v, k) =>
    T(`${v}d`, P ? 16 : 16, C.muted, true).moveTo([sqX[k], SQ_BASE - (P ? 1.00 : 0.92), 0])
  );

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(
      axis, ...ticks, unit,
      ...dots7.flatMap(o => [o.halo, o.d]),
      ...drops7, meanLine, meanTag,
      ...offIdx.map(k => arrows7[k]),
      ...Object.values(labs7),
      spreadBr
    )),
    new M.Create(sqBase),
    new M.FadeIn(new M.VGroup(...gapBars, ...gapLabs, ...dayLabs)),
    ...fbox([['stop − and + cancelling:', C.cyan], ['turn each gap into', C.ink], ['a square', C.amber]], C.cyan),
    ...say('TURN EACH GAP INTO A SQUARE')
  );

  await until(S(13));
  await play(
    new M.LaggedStart(offIdx.map(k => new M.Indicate(gapBars[k], { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox([['square area', C.amber], ['= gap × gap', C.cyan]], C.amber),
    ...say('AREA = GAP × GAP', C.amber)
  );

  await until(S(14));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(gapLabs[k], { color: C.amber })), { lagRatio: 0.15, runTime: 1.4 }),
    ...fbox([['(−) × (−) = (+)', C.green], ['minus flips the sign', C.muted], ['back to positive!', C.green]], C.green),
    ...say('(−) × (−)  →  POSITIVE (+)', C.green)
  );

  await until(S(15));
  await play(
    new M.Indicate(gapBars[0], { color: C.amber }),
    new M.Indicate(gapLabs[0], { color: C.amber }),
    ...fbox([['3-day parcel:', C.cyan], ['gap = −2 days', C.green]], C.cyan),
    ...say('START LEFT: 3 DAYS (GAP −2)', C.green)
  );

  // Build all 12 individual unit tiles so they can move cleanly into the sharing pool later
  const TW = U * 0.90;
  const tiles = [];
  const tilePos2x2 = cx => [
    [cx - U / 2, SQ_BASE + U / 2, 0],
    [cx + U / 2, SQ_BASE + U / 2, 0],
    [cx - U / 2, SQ_BASE + 1.5 * U, 0],
    [cx + U / 2, SQ_BASE + 1.5 * U, 0]
  ];
  // tiles[0..3]: col 0 (2x2)
  tilePos2x2(sqX[0]).forEach(p => tiles.push(makeTile(p, TW, TW, C.cyan, 0.78)));
  // tiles[4..7]: cols 1, 2, 4, 5 (1x1 each)
  [1, 2, 4, 5].forEach(k => tiles.push(makeTile([sqX[k], SQ_BASE + U / 2, 0], TW, TW, C.cyan, 0.78)));
  // tiles[8..11]: col 6 (2x2)
  tilePos2x2(sqX[6]).forEach(p => tiles.push(makeTile(p, TW, TW, C.cyan, 0.78)));

  function makeSqBorder(k, side, color = C.cyan) {
    const r = new M.Rectangle({ width: side * U, height: side * U, color, strokeWidth: 2.6 });
    r.setFill(color, 0);
    r.moveTo([sqX[k], SQ_BASE + (side * U) / 2, 0]);
    return r;
  }
  const sqBorders = {
    0: makeSqBorder(0, 2, C.cyan),
    1: makeSqBorder(1, 1, C.cyan),
    2: makeSqBorder(2, 1, C.cyan),
    4: makeSqBorder(4, 1, C.cyan),
    5: makeSqBorder(5, 1, C.cyan),
    6: makeSqBorder(6, 2, C.cyan)
  };
  const lab4 = x => {
    const bg = new M.Circle({ radius: P ? 0.24 : 0.26, color: C.card, strokeWidth: 0 });
    bg.setFill(C.card, 0.95); bg.moveTo([x, SQ_BASE + U, 0]);
    return new M.VGroup(bg, T('4', P ? 22 : 24, C.ink, true).moveTo([x, SQ_BASE + U, 0]));
  };
  const areaLabs = {
    0: lab4(sqX[0]),
    1: T('1', P ? 19 : 20, C.ink, true).moveTo([sqX[1], SQ_BASE + U / 2, 0]),
    2: T('1', P ? 19 : 20, C.ink, true).moveTo([sqX[2], SQ_BASE + U / 2, 0]),
    3: T('0', P ? 19 : 20, C.amber, true).moveTo([sqX[3], SQ_BASE + 0.34, 0]),
    4: T('1', P ? 19 : 20, C.ink, true).moveTo([sqX[4], SQ_BASE + U / 2, 0]),
    5: T('1', P ? 19 : 20, C.ink, true).moveTo([sqX[5], SQ_BASE + U / 2, 0]),
    6: lab4(sqX[6])
  };

  const dimLeft = T('2', P ? 17 : 18, C.amber, true).moveTo([sqX[0] - U - 0.24, SQ_BASE + U, 0]);
  await until(S(16));
  await play(
    new M.LaggedStart(tiles.slice(0, 4).map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.3 }),
    new M.Create(sqBorders[0]),
    new M.FadeIn(areaLabs[0]),
    new M.FadeIn(dimLeft),
    ...fbox([['(−2) × (−2) = 4', C.cyan], ['2 × 2 square = 4', C.amber]], C.cyan),
    ...say('(−2) × (−2) = 4')
  );

  const dimTop = T('2 days', P ? 17 : 17, C.amber, true).moveTo([sqX[0], SQ_BASE + 2 * U + 0.28, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(dimTop),
    new M.LaggedStart(tiles.slice(0, 4).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox([['feet × feet = sq. feet', C.muted], ['2 days × 2 days', C.cyan], ['= 4 square days', C.amber]], C.amber),
    ...say('4 SQUARE DAYS', C.amber)
  );

  await until(S(18));
  await play(
    new M.Indicate(sqBorders[0], { color: C.violet }),
    ...fbox([['“square days” sounds odd', C.violet], ['we revisit that trap soon', C.muted]], C.violet),
    ...say('ODD UNIT: SQUARE DAYS (TRAP)', C.violet)
  );

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(dimLeft, dimTop)),
    new M.Indicate(gapBars[1], { color: C.amber }),
    new M.Indicate(gapBars[2], { color: C.amber }),
    ...fbox([['two 4-day parcels:', C.cyan], ['gap = −1 day each', C.green]], C.green),
    ...say('4-DAY PARCELS: GAP = −1', C.green)
  );

  await until(S(20));
  await play(
    new M.FadeIn(tiles[4]), new M.FadeIn(tiles[5]),
    new M.Create(sqBorders[1]), new M.Create(sqBorders[2]),
    new M.FadeIn(areaLabs[1]), new M.FadeIn(areaLabs[2]),
    ...fbox([['(−1) × (−1) = 1', C.cyan], ['1 square day each', C.amber]], C.cyan),
    ...say('(−1) × (−1) = 1 EACH')
  );

  await until(S(21));
  await play(
    new M.Flash(gapBars[3], { color: C.amber }),
    new M.FadeIn(areaLabs[3]),
    ...fbox([['5-day parcel: gap = 0', C.amber], ['0 × 0 = 0 (no square)', C.amber]], C.amber),
    ...say('5 DAYS: GAP 0 → NO SQUARE', C.amber)
  );

  await until(S(22));
  await play(
    new M.LaggedStart([4, 5, 6].map(k => new M.Indicate(gapLabs[k], { color: C.amber })), { lagRatio: 0.14, runTime: 1.2 }),
    ...fbox([['late gaps mirror early:', C.pink], ['+1, +1, +2', C.pink]], C.pink),
    ...say('LATE SIDE MIRRORS EARLY', C.pink)
  );

  await until(S(23));
  await play(
    new M.LaggedStart(tiles.slice(6, 12).map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.6 }),
    new M.Create(sqBorders[4]), new M.Create(sqBorders[5]), new M.Create(sqBorders[6]),
    new M.FadeIn(areaLabs[4]), new M.FadeIn(areaLabs[5]), new M.FadeIn(areaLabs[6]),
    ...fbox([['(+1) × (+1) = 1  (×2)', C.cyan], ['(+2) × (+2) = 4', C.cyan]], C.cyan),
    ...say('SQUARES: 4, 1, 1, 0, 1, 1, 4')
  );

  // 24-27: doubling a gap makes its square 4x bigger
  const tag1x = pill('1×', C.amber, P ? 16 : 16);
  tag1x.moveTo([sqX[5], SQ_BASE + U + 0.42, 0]);
  const tag4x = pill('4×', C.pink, P ? 16 : 16);
  tag4x.moveTo([sqX[6], SQ_BASE + 2 * U + 0.42, 0]);

  await until(S(24));
  tintTile(tiles[7], C.amber, 0.85);
  tiles.slice(8, 12).forEach(t => tintTile(t, C.pink, 0.85));
  await play(
    new M.FadeIn(tag1x), new M.FadeIn(tag4x),
    ...fbox([['gap 1 → area 1', C.amber], ['gap 2 → area 4', C.pink], ['2× gap → 4× area!', C.pink]], C.pink),
    ...say('DOUBLE GAP → 4× AREA', C.pink)
  );

  await until(S(25));
  await play(
    new M.Indicate(sqBorders[6], { color: C.pink }),
    new M.Indicate(tag4x, { color: C.amber }),
    ...say('WHY COUNT A 2-DAY DELAY 4×?', C.pink)
  );

  await until(S(26));
  await play(
    new M.Indicate(sqBorders[5], { color: C.amber }),
    new M.Indicate(sqBorders[6], { color: C.pink }),
    ...fbox([['1 day late → small (1)', C.amber], ['2 days late → big (4)', C.pink], ['big delays hurt trust', C.ink]], C.pink),
    ...say('BIG DELAYS HURT TRUST MOST', C.pink)
  );

  await until(S(27));
  tintTile(tiles[7], C.cyan, 0.78);
  tiles.slice(8, 12).forEach(t => tintTile(t, C.cyan, 0.78));
  await play(
    new M.FadeOut(new M.VGroup(tag1x, tag4x)),
    ...fbox([['drop minus: 1 vs 2 (2×)', C.muted], ['squaring:   1 vs 4 (4×)', C.pink], ['big gaps stand out!', C.amber]], C.amber),
    ...say('SQUARING HIGHLIGHTS BIG GAPS', C.amber)
  );

  // --- 28-31: add all seven square areas together ---------------------------
  await until(S(28));
  await play(
    ...fbox([['add all 7 areas:', C.amber], ['4 + 1 + 1 + 0 + 1 + 1 + 4', C.cyan]], C.amber),
    ...say('ADD ALL 7 SQUARE AREAS', C.amber)
  );

  await until(S(29));
  [0, 1, 2, 3, 8, 9, 10, 11].forEach(i => tintTile(tiles[i], C.amber, 0.88));
  await play(
    new M.Indicate(sqBorders[0], { color: C.amber }),
    new M.Indicate(sqBorders[6], { color: C.amber }),
    ...fbox([['end squares:', C.muted], ['4 + 4 = 8', C.amber]], C.amber),
    ...say('END SQUARES: 4 + 4 = 8', C.amber)
  );

  await until(S(30));
  [4, 5, 6, 7].forEach(i => tintTile(tiles[i], C.amber, 0.88));
  await play(
    new M.LaggedStart([1, 2, 4, 5].map(k => new M.Indicate(sqBorders[k], { color: C.amber })), { lagRatio: 0.12, runTime: 1.3 }),
    new M.Flash(areaLabs[3], { color: C.amber }),
    ...fbox([['ends:   4 + 4 = 8', C.muted], ['small:  8 + 4 = 12', C.amber], ['middle: 12 + 0 = 12', C.amber]], C.amber),
    ...say('8 + 1 + 1 + 1 + 1 + 0 = 12', C.amber)
  );

  await until(S(31));
  tiles.forEach(t => tintTile(t, C.cyan, 0.80));
  await play(
    ...fbox([['total of 7 squares', C.ink], ['= 12 square days', C.amber]], C.amber),
    ...say('TOTAL = 12 SQUARE DAYS', C.amber)
  );

  // --- 32-33: why not stop at 12? busier week has bigger total --------------
  await until(S(32));
  await play(...say('WHY NOT STOP AT 12?', C.violet));

  const BUSY_Y = P ? -1.95 : -2.35;
  const bw = P ? 0.34 : 0.40, bsp = P ? 0.44 : 0.50;
  const busySquares = Array.from({ length: 14 }, (_, i) =>
    makeTile([CX + (i - 6.5) * bsp, BUSY_Y, 0], bw, bw, C.violet, 0.72)
  );
  const busyLab = T('14 steady parcels (1 each) → total = 14', P ? 16 : 16, C.violet, true);
  busyLab.moveTo([CX, BUSY_Y - (P ? 0.46 : 0.40), 0]);

  await until(S(33));
  await play(
    new M.LaggedStart(busySquares.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.4 }),
    new M.FadeIn(busyLab),
    ...fbox([['7 parcels  → total = 12', C.cyan], ['14 parcels → total = 14', C.violet], ['more parcels → bigger sum', C.muted]], C.violet),
    ...say('MORE PARCELS → BIGGER TOTAL', C.violet)
  );

  // --- 34-41: share 12 square days equally across 7 parcels -> variance -----
  const SH_SP = P ? 0.92 : 1.04;
  const SH_U = P ? 0.72 : 0.78;
  const SH_TW = SH_U * 0.90;
  const SH_BASE = P ? -2.55 : -2.25;
  const shX = k => CX + (k - 3) * SH_SP;
  const shBase = new M.Line({ start: [shX(0) - SH_SP / 2, SH_BASE, 0], end: [shX(6) + SH_SP / 2, SH_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const shSlots = D7.map((_, k) => T(String(k + 1), P ? 17 : 17, C.green, true).moveTo([shX(k), SH_BASE - 0.32, 0]));

  // Pool of 12 tiles in a neat 2 x 6 grid above the 7 parcel slots
  const POOL_Y = P ? 0.95 : 0.45;
  const P_STEP = P ? 0.62 : 0.64;
  const P_TW = P ? 0.54 : 0.56;
  const poolPos = i => {
    const r = Math.floor(i / 6), c = i % 6;
    return [CX + (c - 2.5) * P_STEP, POOL_Y + (0.5 - r) * P_STEP, 0];
  };
  const poolLab = T('12 square days', P ? 18 : 18, C.cyan, true).moveTo([CX, POOL_Y + P_STEP + (P ? 0.35 : 0.28), 0]);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(
      ...busySquares, busyLab,
      sqBase, ...gapBars, ...gapLabs, ...dayLabs,
      ...Object.values(sqBorders), ...Object.values(areaLabs)
    )),
    new M.Create(shBase),
    new M.FadeIn(new M.VGroup(...shSlots, poolLab)),
    new M.LaggedStart(tiles.map((t, i) => new M.Transform(t, makeTile(poolPos(i), P_TW, P_TW, C.cyan, 0.80))), { lagRatio: 0.04, runTime: 1.8 }),
    ...fbox([['total = 12 square days', C.cyan], ['share across 7 parcels', C.green]], C.green),
    ...say('SHARE 12 EQUALLY ACROSS 7', C.green)
  );

  await until(S(35));
  await play(
    new M.LaggedStart(shSlots.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox([['equal share =', C.muted], ['average square area', C.green], ['per parcel', C.ink]], C.green),
    ...say('AVERAGE SQUARE AREA PER PARCEL', C.green)
  );

  await until(S(36));
  await play(
    ...fbox([['VARIANCE', C.amber], ['average square area', C.ink], ['per parcel', C.muted]], C.amber),
    ...say('CALLED THE VARIANCE', C.amber)
  );

  await until(S(37));
  await play(
    new M.LaggedStart(tiles.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.05, runTime: 1.4 }),
    ...fbox([['12 square days', C.cyan], ['÷ 7 parcels', C.green]], C.cyan),
    ...say('SHARE 12 ACROSS 7 PARCELS')
  );

  // 38: reference lines at 1 (7x1=7) and 2 (7x2=14)
  const xL = shX(0) - SH_SP / 2, xR = shX(6) + SH_SP / 2;
  const y1 = SH_BASE + SH_U, y2 = SH_BASE + 2 * SH_U;
  const g1Line = new M.DashedLine({ start: [xL, y1, 0], end: [xR, y1, 0], color: C.muted, strokeWidth: 2 });
  const g2Line = new M.DashedLine({ start: [xL, y2, 0], end: [xR, y2, 0], color: C.muted, strokeWidth: 2 });
  const g1Lab = T('1', P ? 17 : 18, C.muted, true).moveTo([xR + 0.28, y1, 0]);
  const g2Lab = T('2', P ? 17 : 18, C.muted, true).moveTo([xR + 0.28, y2, 0]);

  await until(S(38));
  await play(
    new M.Create(g1Line), new M.Create(g2Line),
    new M.FadeIn(g1Lab), new M.FadeIn(g2Lab),
    ...fbox([['7 × 1 = 7', C.muted], ['7 × 2 = 14', C.muted], ['each share: 1 to 2', C.amber]], C.amber),
    ...say('BETWEEN 1 AND 2 EACH', C.amber)
  );

  // 39: deal 1 whole square to each of the 7 parcels, leaving 5 amber tiles
  const leftLab = T('5 left over', P ? 18 : 18, C.amber, true).moveTo([CX, POOL_Y + (P ? 0.64 : 0.60), 0]);
  const dealAnims = [];
  for (let k = 0; k < 7; k++) {
    dealAnims.push(new M.Transform(tiles[k], makeTile([shX(k), SH_BASE + SH_U / 2, 0], SH_TW, SH_TW, C.cyan, 0.82), { pathArc: -0.25 }));
  }
  const remAnims = [];
  for (let j = 0; j < 5; j++) {
    remAnims.push(new M.Transform(tiles[7 + j], makeTile([CX + (j - 2) * P_STEP, POOL_Y, 0], P_TW, P_TW, C.amber, 0.85)));
  }

  await until(S(39));
  await play(
    new M.FadeOut(poolLab), new M.FadeIn(leftLab),
    new M.LaggedStart(dealAnims, { lagRatio: 0.14, runTime: 1.9 }),
    ...remAnims,
    ...fbox([['give 1 to each: uses 7', C.cyan], ['12 − 7 = 5 left over', C.amber]], C.amber),
    ...say('1 EACH (7 USED) · 5 LEFT OVER', C.amber)
  );

  // 40: split the 5 leftover squares 7 ways -> +0.71 on top of each parcel
  const fracH = (5 / 7) * SH_U - 0.04;
  const topParts = D7.map((_, k) =>
    makeTile([shX(k), SH_BASE + SH_U + (5 / 14) * SH_U, 0], SH_TW, fracH, C.amber, 0.84)
  );
  const plusLab = T('+0.71 each', P ? 17 : 17, C.amber, true).moveTo([CX, y2 + 0.36, 0]);

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...tiles.slice(7), leftLab)),
    new M.LaggedStart(topParts.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 1.5 }),
    new M.FadeIn(plusLab),
    ...fbox([['5 leftover ÷ 7 parcels', C.amber], ['≈ +0.71 sq. days each', C.amber]], C.amber),
    ...say('5 ÷ 7 ≈ +0.71 TO EACH', C.amber)
  );

  // 41: variance ≈ 1.71 square days — just under 2
  const yVar = SH_BASE + (12 / 7) * SH_U;
  const varLine = new M.DashedLine({ start: [xL, yVar, 0], end: [xR, yVar, 0], color: C.amber, strokeWidth: 3 });
  const varTag = pill('1.71 EACH', C.amber, P ? 17 : 17);
  varTag.moveTo([CX, y2 + 0.45, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(plusLab),
    new M.Create(varLine),
    new M.FadeIn(varTag),
    ...fbox([['1 + 0.71 = 1.71', C.ink], ['variance ≈ 1.71 sq. days', C.amber], ['(just under 2)', C.muted]], C.amber),
    ...say('VARIANCE ≈ 1.71 SQUARE DAYS', C.amber)
  );

  // --- 42-46: formula & statistics terms ------------------------------------
  await until(S(42));
  await play(
    ...fbox([['variance =', C.amber], ['  total squared gaps', C.cyan], ['  ÷ number of parcels', C.green]], C.cyan),
    ...say('THE METHOD IN ONE SHORT LINE')
  );

  await until(S(43));
  await play(
    ...fbox([['gap from the mean', C.muted], ['= deviation', C.cyan]], C.cyan),
    ...say('GAP FROM MEAN = DEVIATION')
  );

  await until(S(44));
  await play(
    ...fbox([['deviation × deviation', C.cyan], ['= squared deviation', C.amber]], C.amber),
    ...say('GAP × GAP = SQUARED DEVIATION', C.amber)
  );

  await until(S(45));
  await play(
    ...fbox([['variance =', C.amber], ['  sum of squared deviations', C.cyan], ['  ÷ count', C.green]], C.amber),
    ...say('SUM OF SQUARES ÷ COUNT', C.amber)
  );

  await until(S(46));
  await play(
    new M.Indicate(varTag, { color: C.amber }),
    ...fbox([['variance = 12 ÷ 7', C.cyan], ['         ≈ 1.71 sq. days', C.amber]], C.amber),
    ...say('12 ÷ 7 ≈ 1.71 SQUARE DAYS', C.amber)
  );

  // --- 47-48: comparing two weeks (mean 5) + zero variance ------------------
  const Y_TOP = P ? 0.85 : 0.05;
  const Y_BOT = P ? -1.65 : -1.85;
  const C_DR = P ? 0.09 : 0.085, C_HR = P ? 0.18 : 0.17;
  const C_DY = P ? 0.22 : 0.17;

  function makeCompAxis(y) {
    const ln = new M.Line({ start: [n2x(2), y, 0], end: [n2x(8), y, 0], color: C.muted, strokeWidth: 2.5 });
    const tks = [2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
      new M.Line({ start: [n2x(v), y - 0.06, 0], end: [n2x(v), y + 0.06, 0], color: C.muted, strokeWidth: 1.8 }),
      T(String(v), P ? 16 : 16, C.muted, true).moveTo([n2x(v), y - 0.28, 0])
    ));
    const ml = new M.DashedLine({ start: [n2x(5), y, 0], end: [n2x(5), y + (P ? 1.45 : 1.15), 0], color: C.amber, strokeWidth: 2.5 });
    return { ln, tks, ml };
  }
  const stAx = makeCompAxis(Y_TOP);
  const scAx = makeCompAxis(Y_BOT);

  // Steady week: 4, 5, 5, 5, 5, 5, 6 (mean = 5, var = 2/7 ≈ 0.29)
  const stPos = [
    [n2x(4), Y_TOP + 0.20, 0],
    [n2x(5), Y_TOP + 0.20, 0],
    [n2x(5), Y_TOP + 0.20 + C_DY, 0],
    [n2x(5), Y_TOP + 0.20 + 2 * C_DY, 0],
    [n2x(5), Y_TOP + 0.20 + 3 * C_DY, 0],
    [n2x(5), Y_TOP + 0.20 + 4 * C_DY, 0],
    [n2x(6), Y_TOP + 0.20, 0]
  ];
  const stDots = stPos.map(p => makeDot(p, C.green, C_DR, C_HR));
  const stLab = pill('STEADY · VAR ≈ 0.29', C.green, P ? 16 : 16);
  stLab.moveTo([n2x(2) + (P ? 1.75 : 1.85), Y_TOP + (P ? 0.92 : 0.72), 0]);

  // Scattered week: 2, 3, 4, 5, 6, 7, 8 (mean = 5, var = 28/7 = 4.0)
  const scDots = [2, 3, 4, 5, 6, 7, 8].map(v => makeDot([n2x(v), Y_BOT + 0.22, 0], C.pink, C_DR, C_HR));
  const scLab = pill('SCATTERED · VAR = 4.0', C.pink, P ? 16 : 16);
  scLab.moveTo([n2x(2) + (P ? 1.85 : 1.95), Y_BOT + (P ? 0.88 : 0.68), 0]);

  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(
      ...tiles.slice(0, 7), ...topParts,
      shBase, ...shSlots, g1Line, g1Lab, g2Line, g2Lab, varLine, varTag
    )),
    new M.Create(stAx.ln), new M.FadeIn(new M.VGroup(...stAx.tks, stAx.ml, stLab)),
    new M.Create(scAx.ln), new M.FadeIn(new M.VGroup(...scAx.tks, scAx.ml, scLab)),
    ...stDots.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.d)]),
    ...scDots.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.d)]),
    ...fbox([['both average 5 days:', C.amber], ['steady    → var ≈ 0.29', C.green], ['scattered → var = 4.0', C.pink]], C.pink),
    ...say('LARGER VARIANCE = MORE SCATTERED', C.pink)
  );

  // 48: every parcel = 5 days -> variance = 0
  const stLab0 = pill('ALL 5 DAYS · VAR = 0', C.green, P ? 16 : 16);
  stLab0.moveTo([n2x(2) + (P ? 1.40 : 1.50), Y_TOP + (P ? 0.92 : 0.72), 0]);

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(scAx.ln, ...scAx.tks, scAx.ml, scLab, ...scDots.flatMap(o => [o.halo, o.d]), stLab)),
    new M.FadeIn(stLab0),
    ...moveDotA(stDots[0], [n2x(5), Y_TOP + 0.20 + 5 * C_DY, 0], C.green, { pathArc: -0.25, runTime: 1.3 }, C_DR, C_HR),
    ...moveDotA(stDots[6], [n2x(5), Y_TOP + 0.20 + 6 * C_DY, 0], C.green, { pathArc: 0.25, runTime: 1.3 }, C_DR, C_HR),
    ...fbox([['all 7 parcels = 5 days', C.cyan], ['every gap = 0', C.muted], ['variance = 0', C.green]], C.green),
    ...say('ALL AT 5 DAYS → VARIANCE = 0', C.green)
  );

  // --- 49-53: unit trap (square days), side length preview, recap -----------
  const AVG_C = P ? [0, 0.15, 0] : [CX, -0.30, 0];
  const AVG_S = P ? 2.40 : 2.20;
  const avgSq = new M.Rectangle({ width: AVG_S, height: AVG_S, color: C.pink, strokeWidth: 3 });
  avgSq.setFill(C.pink, 0.16); avgSq.moveTo(AVG_C);
  const gLines = [];
  for (let i = 1; i <= 2; i++) {
    const off = -AVG_S / 2 + (AVG_S / 3) * i;
    gLines.push(new M.Line({ start: [AVG_C[0] + off, AVG_C[1] - AVG_S / 2, 0], end: [AVG_C[0] + off, AVG_C[1] + AVG_S / 2, 0], color: C.line, strokeWidth: 1.4 }));
    gLines.push(new M.Line({ start: [AVG_C[0] - AVG_S / 2, AVG_C[1] + off, 0], end: [AVG_C[0] + AVG_S / 2, AVG_C[1] + off, 0], color: C.line, strokeWidth: 1.4 }));
  }
  const avgGrid = new M.VGroup(...gLines);
  const avgT1 = T('area ≈ 1.71', P ? 22 : 22, C.ink, true).moveTo([AVG_C[0], AVG_C[1] + 0.24, 0]);
  const avgT2 = T('square days', P ? 20 : 20, C.pink, true).moveTo([AVG_C[0], AVG_C[1] - 0.24, 0]);

  await until(S(49));
  await play(
    new M.FadeOut(new M.VGroup(stAx.ln, ...stAx.tks, stAx.ml, stLab0, ...stDots.flatMap(o => [o.halo, o.d]))),
    new M.Create(avgSq), new M.FadeIn(avgGrid), new M.FadeIn(avgT1), new M.FadeIn(avgT2),
    ...fbox([['TRAP: units!', C.pink], ['1.71 = square days', C.pink], ['NOT ordinary days', C.amber]], C.pink),
    ...say('TRAP: SQUARE DAYS ≠ DAYS', C.pink)
  );

  const cmpY = AVG_C[1] - AVG_S / 2 - (P ? 0.72 : 0.62);
  const cmpFloor = pill('FLOOR: SQ. FEET ✓', C.green, P ? 16 : 16);
  cmpFloor.moveTo([AVG_C[0] - (P ? 1.85 : 1.95), cmpY, 0]);
  const cmpCal = pill('CALENDAR: SQ. DAYS ?', C.pink, P ? 16 : 16);
  cmpCal.moveTo([AVG_C[0] + (P ? 1.85 : 1.95), cmpY, 0]);

  await until(S(50));
  await play(
    new M.FadeIn(cmpFloor), new M.FadeIn(cmpCal),
    ...fbox([['floor: square feet ✓', C.green], ['calendar: square days ?', C.pink]], C.pink),
    ...say('SQUARE FEET ✓  ·  SQUARE DAYS ?', C.pink)
  );

  const warnTag = pill('≠  1.71 DAYS LATE', C.pink, P ? 18 : 18);
  warnTag.moveTo([AVG_C[0], cmpY, 0]);

  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(cmpFloor, cmpCal)),
    new M.FadeIn(warnTag),
    ...fbox([['1.71 sq. days', C.pink], ['≠ “almost 2 days late”', C.pink]], C.pink),
    ...say('DO NOT READ AS ~2 DAYS LATE', C.pink)
  );

  // 52: highlight the side length -> back to ordinary days
  const bY = AVG_C[1] - AVG_S / 2;
  const sideLine = new M.Line({ start: [AVG_C[0] - AVG_S / 2, bY, 0], end: [AVG_C[0] + AVG_S / 2, bY, 0], color: C.green, strokeWidth: 6 });
  const sideDotL = new M.Dot({ point: [AVG_C[0] - AVG_S / 2, bY, 0], radius: 0.10, color: C.green }); sideDotL.setFill(C.green, 1);
  const sideDotR = new M.Dot({ point: [AVG_C[0] + AVG_S / 2, bY, 0], radius: 0.10, color: C.green }); sideDotR.setFill(C.green, 1);
  const sideLab = T('side length = ? days', P ? 19 : 19, C.green, true).moveTo([AVG_C[0], bY - 0.42, 0]);

  await until(S(52));
  await play(
    new M.FadeOut(warnTag),
    new M.Create(sideLine), new M.FadeIn(sideDotL), new M.FadeIn(sideDotR), new M.FadeIn(sideLab),
    ...fbox([['area = 1.71 sq. days', C.muted], ['side length = ? days', C.green], ['back to ordinary days', C.cyan]], C.green),
    ...say('NEXT: SIDE LENGTH → ORDINARY DAYS', C.green)
  );

  // 53: one-sentence recap
  await until(S(53));
  avgSq.setColor(C.amber); avgSq.setFill(C.amber, 0.18);
  await play(
    new M.Indicate(avgSq, { color: C.amber }),
    ...fbox([['VARIANCE', C.amber], ['average of squared gaps', C.cyan], ['12 ÷ 7 ≈ 1.71 sq. days', C.amber]], C.amber),
    ...say('AVERAGE SQUARED GAP = CONSISTENCY', C.amber)
  );
}
