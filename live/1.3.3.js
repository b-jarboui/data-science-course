// 1.3.3 Deviations from the mean (live animation, script.v5.md).
// Beat i = sentence i (0-based, 0..58). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const D7 = [3, 4, 4, 5, 6, 6, 7];
  const D3 = [4, 4, 7];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.3;
  const L0 = P ? 6.6 : 7.5;
  const X0 = CX - L0 / 2;
  const STEP = L0 / 6; // days 2..8, so 5 is centered at CX
  const n2x = v => X0 + (v - 2) * STEP;
  const LY = P ? -0.2 : -0.95;
  const PILL = P ? [0, 3.85, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.4, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // 4 clean horizontal tracks above the days line so deviation arrows never cross dots
  const TY = k => LY + (P ? 0.45 + k * 0.57 : 0.37 + k * 0.44);
  const MEAN_TOP = P ? 2.48 : 1.12;
  const MEAN_TAG_Y = P ? 2.84 : 1.38;
  const STACK_Y = j => LY + (P ? 0.3 + j * 0.31 : 0.24 + j * 0.24);
  const DOT_R = P ? 0.11 : 0.10;
  const HALO_R = P ? 0.24 : 0.22;

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.4 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.05;
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

  // Visual helpers (only verified manim-web primitives, moveTo positioning, setFill fills)
  function makeDot(p, color = C.cyan) {
    const halo = new M.Dot({ point: p, radius: HALO_R, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: DOT_R, color }); d.setFill(color, 1);
    return { halo, d };
  }
  function moveDotA(dot, q, color = C.cyan, opts = {}) {
    const t = makeDot(q, color);
    return [new M.Transform(dot.halo, t.halo, opts), new M.Transform(dot.d, t.d, opts)];
  }
  function paintDot(dot, color) {
    dot.halo.setFill(color, 0.24); dot.halo.setColor(color);
    dot.d.setFill(color, 1); dot.d.setColor(color);
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
    const t = T(text, P ? 19 : 17, color, true);
    t.moveTo([mx, y + (P ? 0.23 : 0.18), 0]);
    return t;
  }
  function bracket(x1, x2, y, drop, label, color) {
    const a = new M.Line({ start: [x1, y, 0], end: [x1, y - drop, 0], color, strokeWidth: 2.5 });
    const b = new M.Line({ start: [x1, y - drop, 0], end: [x2, y - drop, 0], color, strokeWidth: 2.5 });
    const c = new M.Line({ start: [x2, y - drop, 0], end: [x2, y, 0], color, strokeWidth: 2.5 });
    const t = T(label, P ? 18 : 18, color, true); t.moveTo([(x1 + x2) / 2, y - drop - 0.28, 0]);
    return new M.VGroup(a, b, c, t);
  }
  function dropLine(v, topY) {
    return new M.Line({ start: [n2x(v), LY, 0], end: [n2x(v), topY, 0], color: C.line, strokeWidth: 1.6 });
  }
  function balBar(units, side, y, label, color) {
    const bu = STEP * 0.52, w = units * bu, h = P ? 0.34 : 0.28;
    const cx = n2x(5) + side * (w / 2);
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: 2 });
    r.setFill(color, 0.24); r.moveTo([cx, y, 0]);
    const t = T(label, P ? 18 : 17, color, true); t.moveTo([cx, y, 0]);
    return new M.VGroup(r, t);
  }
  function segRect(x1, x2, y, color = C.amber) {
    const r = new M.Rectangle({ width: Math.abs(x2 - x1) * 0.86, height: P ? 0.18 : 0.15, color, strokeWidth: 2 });
    r.setFill(color, 0.85); r.moveTo([(x1 + x2) / 2, y, 0]);
    return r;
  }

  // --- 0-1: seven café parcels of coffee beans ------------------------------
  const parcels = [];
  const pw = P ? 0.68 : 0.82, ph = P ? 0.56 : 0.66, psp = P ? 0.94 : 1.28, py = P ? 1.3 : -0.25;
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
  await play(new M.LaggedStart(parcels.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.5 }),
    ...fbox(['7 parcels of coffee beans', ['days to arrive: ?', C.cyan]]), ...say('7 COFFEE PARCELS'));

  await until(S(1));
  await play(new M.LaggedStart(parcels.map(p => new M.Indicate(p, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox(['which took fewer days?', 'which took longer?', ['by how much?', C.amber]], C.amber),
    ...say('FEWER DAYS? LONGER? HOW MUCH?', C.amber));

  // --- 2-6: glowing dots on the days line -----------------------------------
  const axis = new M.Line({ start: [n2x(2), LY, 0], end: [n2x(8), LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 20 : 19, C.muted, true).moveTo([n2x(v), LY - (P ? 0.38 : 0.34), 0])
  ));
  const unit = T('days', P ? 18 : 17, C.muted);
  unit.moveTo([n2x(8) - 0.1, LY - (P ? 0.74 : 0.64), 0]);

  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(...parcels)), new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...fbox(['1 dot = 1 parcel', ['line marked in days', C.cyan]]),
    ...say('EACH DOT = ONE PARCEL'));

  // Initial dot-plot positions for D7 = [3, 4, 4, 5, 6, 6, 7]
  const rowY = r => LY + (P ? 0.34 + r * 0.42 : 0.30 + r * 0.36);
  const initPos = [
    [n2x(3), rowY(0), 0], [n2x(4), rowY(0), 0], [n2x(4), rowY(1), 0],
    [n2x(5), rowY(0), 0],
    [n2x(6), rowY(0), 0], [n2x(6), rowY(1), 0], [n2x(7), rowY(0), 0]
  ];
  const dots7 = initPos.map(p => makeDot(p, C.cyan));
  const valLabs = [
    T('3', P ? 18 : 17, C.cyan, true).moveTo([n2x(3), rowY(0) + 0.36, 0]),
    T('4, 4', P ? 18 : 17, C.cyan, true).moveTo([n2x(4), rowY(1) + 0.36, 0]),
    T('5', P ? 18 : 17, C.cyan, true).moveTo([n2x(5), rowY(0) + 0.36, 0]),
    T('6, 6', P ? 18 : 17, C.cyan, true).moveTo([n2x(6), rowY(1) + 0.36, 0]),
    T('7', P ? 18 : 17, C.cyan, true).moveTo([n2x(7), rowY(0) + 0.36, 0]),
  ];

  await until(S(3));
  await play(
    new M.LaggedStart([0, 1, 2].flatMap(k => [new M.FadeIn(dots7[k].halo), new M.FadeIn(dots7[k].d)]), { lagRatio: 0.14, runTime: 1.4 }),
    new M.FadeIn(valLabs[0]), new M.FadeIn(valLabs[1]),
    ...fbox([['faster: 3, 4, 4', C.cyan]]),
    ...say('FASTER: 3, 4, 4 DAYS')
  );

  await until(S(4));
  await play(new M.FadeIn(dots7[3].halo), new M.FadeIn(dots7[3].d), new M.Flash(dots7[3].d, { color: C.cyan }),
    new M.FadeIn(valLabs[2]), ...fbox(['faster: 3, 4, 4', ['middle: 5', C.cyan]]), ...say('MIDDLE: 5 DAYS'));

  await until(S(5));
  await play(
    new M.LaggedStart([4, 5, 6].flatMap(k => [new M.FadeIn(dots7[k].halo), new M.FadeIn(dots7[k].d)]), { lagRatio: 0.14, runTime: 1.4 }),
    new M.FadeIn(valLabs[3]), new M.FadeIn(valLabs[4]),
    ...fbox(['faster: 3, 4, 4', 'middle: 5', ['slower: 6, 6, 7', C.cyan]]),
    ...say('SLOWER: 6, 6, 7 DAYS')
  );

  await until(S(6));
  const dbox = new M.RoundedRectangle({ width: n2x(7) - n2x(3) + 0.85, height: P ? 1.55 : 1.35, cornerRadius: 0.15, color: C.cyan, strokeWidth: 2 });
  dbox.moveTo([n2x(5), LY + (P ? 0.78 : 0.68), 0]);
  await play(new M.Create(dbox), ...fbox(['data (days):', ['3, 4, 4, 5, 6, 6, 7', C.cyan]]), ...say('DATA = THE 7 RECORDED TIMES'));

  // --- 7-11: total in easy pairs, then divide by 7 --------------------------
  const BR_Y = P ? -1.22 : -1.78, BR_D = P ? 0.32 : 0.26;
  await until(S(7));
  paintDot(dots7[0], C.amber); paintDot(dots7[6], C.amber);
  const br37 = bracket(n2x(3), n2x(7), BR_Y, BR_D, '3 + 7 = 10', C.amber);
  await play(new M.FadeOut(dbox), new M.FadeIn(br37), ...fbox([['3 + 7 = 10', C.amber]], C.amber), ...say('ADD IN EASY PAIRS', C.amber));

  await until(S(8));
  paintDot(dots7[0], C.cyan); paintDot(dots7[6], C.cyan);
  [1, 2, 4, 5].forEach(k => paintDot(dots7[k], C.amber));
  const br46 = bracket(n2x(4), n2x(6), BR_Y, BR_D, '4 + 6 = 10  (×2)', C.amber);
  await play(new M.FadeOut(br37), new M.FadeIn(br46),
    ...fbox(['3 + 7 = 10', ['4 + 6 = 10', C.amber], ['4 + 6 = 10', C.amber]], C.amber),
    ...say('TWO MORE TENS', C.amber));

  await until(S(9));
  [1, 2, 4, 5].forEach(k => paintDot(dots7[k], C.cyan));
  paintDot(dots7[3], C.amber);
  await play(new M.FadeOut(br46),
    ...fbox(['10 + 10 + 10 = 30', ['30 + 5 = 35 days', C.amber]], C.amber),
    ...say('TOTAL = 35 DAYS', C.amber));

  await until(S(10));
  paintDot(dots7[3], C.cyan);
  await play(...fbox(['total = 35 days', ['count = 7 parcels', C.cyan]], C.cyan), ...say('SHARE 35 EQUALLY ACROSS 7'));

  await until(S(11));
  await play(...fbox(['total = 35 days', 'count = 7 parcels', ['35 ÷ 7 = 5 days', C.amber]], C.amber),
    ...say('35 ÷ 7 = 5 DAYS EACH', C.amber));

  // --- 12-15: fair share sliding on the line -> the mean --------------------
  const meanDash = new M.DashedLine({ start: [n2x(5), LY, 0], end: [n2x(5), MEAN_TOP, 0], color: C.amber, strokeWidth: 2.5 });
  await until(S(12));
  await play(new M.Create(meanDash), ...say('FAIR SHARE ON THE LINE', C.amber));

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...valLabs)),
    ...moveDotA(dots7[0], [n2x(5), STACK_Y(1), 0], C.cyan, { pathArc: -0.35, runTime: 1.4 }),
    ...moveDotA(dots7[6], [n2x(5), STACK_Y(2), 0], C.cyan, { pathArc: 0.35, runTime: 1.4 }),
    ...say('SLIDE 2 DAYS: 7 → 5 ← 3', C.amber)
  );

  await until(S(14));
  await play(
    ...moveDotA(dots7[1], [n2x(5), STACK_Y(3), 0], C.cyan, { pathArc: -0.25, runTime: 1.5 }),
    ...moveDotA(dots7[4], [n2x(5), STACK_Y(4), 0], C.cyan, { pathArc: 0.25, runTime: 1.5 }),
    ...moveDotA(dots7[2], [n2x(5), STACK_Y(5), 0], C.cyan, { pathArc: -0.25, runTime: 1.5 }),
    ...moveDotA(dots7[5], [n2x(5), STACK_Y(6), 0], C.cyan, { pathArc: 0.25, runTime: 1.5 }),
    ...say('SLIDE 1 DAY: 6 → 5 ← 4', C.amber)
  );

  const meanTag = pill('MEAN = 5', C.amber, P ? 18 : 17);
  meanTag.moveTo([n2x(5), MEAN_TAG_Y, 0]);
  await until(S(15));
  await play(new M.FadeIn(meanTag), ...fbox(['35 ÷ 7 = 5 days', ['mean  = 5 days', C.amber]], C.amber),
    ...say('FAIR SHARE = THE MEAN (5)', C.amber));

  // --- 16-23: spread back out on 4 clean tracks + arrows = deviations -------
  // Track assignment for D7 = [3, 4, 4, 5, 6, 6, 7]:
  // 5 -> Track 0, 4a & 6a -> Track 1, 4b & 6b -> Track 2, 3 & 7 -> Track 3
  const tr7 = [3, 1, 2, 0, 1, 2, 3];
  const trackPos7 = D7.map((v, k) => [n2x(v), TY(tr7[k]), 0]);
  const drops7 = [
    dropLine(3, TY(3)), dropLine(4, TY(2)), dropLine(6, TY(2)), dropLine(7, TY(3))
  ];
  let meanLine = new M.Line({ start: [n2x(5), LY, 0], end: [n2x(5), MEAN_TOP, 0], color: C.amber, strokeWidth: 3.5 });

  await until(S(16));
  await play(
    new M.FadeOut(meanDash), new M.Create(meanLine),
    new M.FadeIn(new M.VGroup(...drops7)),
    ...D7.flatMap((_, k) => moveDotA(dots7[k], trackPos7[k], C.cyan, { runTime: 1.4 })),
    ...fbox(['back to real times', ['mean line at 5', C.amber]], C.amber),
    ...say('REAL TIMES + LINE AT 5', C.amber)
  );

  // 6 arrows (indices 0,1,2 = left; 4,5,6 = right; index 3 is at 5 -> no arrow)
  const offIdx = [0, 1, 2, 4, 5, 6];
  const arrows7 = {};
  offIdx.forEach(k => { arrows7[k] = devArrow(D7[k], TY(tr7[k]), C.cyan); });

  await until(S(17));
  await play(
    new M.LaggedStart(offIdx.map(k => new M.FadeIn(arrows7[k])), { lagRatio: 0.12, runTime: 1.5 }),
    ...say('ARROWS FROM THE MEAN')
  );

  // 18: left arrows turn green and get minus sign
  const labs7 = {};
  await until(S(18));
  const leftAnims = [];
  for (const k of [0, 1, 2]) {
    const oldA = arrows7[k], newA = devArrow(D7[k], TY(tr7[k]), C.green);
    arrows7[k] = newA;
    labs7[k] = devLab(D7[k], TY(tr7[k]), '−', C.green);
    leftAnims.push(new M.FadeOut(oldA), new M.FadeIn(newA), new M.FadeIn(labs7[k]));
  }
  await play(...leftAnims, ...say('LEFT = FEWER DAYS (−)', C.green));

  await until(S(19));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(labs7[k], { color: C.amber })), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox([['fewer days → minus (−)', C.green], ['faster still gets −', C.muted]], C.green),
    ...say('FASTER STILL GETS A MINUS', C.green)
  );

  // 20: right arrows turn pink and get plus sign
  await until(S(20));
  const rightAnims = [];
  for (const k of [4, 5, 6]) {
    const oldA = arrows7[k], newA = devArrow(D7[k], TY(tr7[k]), C.pink);
    arrows7[k] = newA;
    labs7[k] = devLab(D7[k], TY(tr7[k]), '+', C.pink);
    rightAnims.push(new M.FadeOut(oldA), new M.FadeIn(newA), new M.FadeIn(labs7[k]));
  }
  await play(...rightAnims,
    ...fbox([['fewer days → minus (−)', C.green], ['more days  → plus (+)', C.pink]], C.pink),
    ...say('RIGHT = MORE DAYS (+)', C.pink));

  await until(S(21));
  await play(
    new M.LaggedStart(offIdx.map(k => new M.Indicate(arrows7[k], { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }),
    ...say('HOW FAR AND WHICH WAY', C.amber)
  );

  await until(S(22));
  await play(...fbox([['DEVIATION', C.amber], ['how far + which way', C.ink], ['from the mean', C.muted]], C.amber),
    ...say('EACH ARROW = A DEVIATION', C.amber));

  labs7[3] = T('0', P ? 19 : 18, C.amber, true).moveTo([n2x(5) + 0.30, TY(0), 0]);
  await until(S(23));
  await play(new M.FadeIn(labs7[3]), new M.Flash(dots7[3].d, { color: C.amber }),
    ...say('ON THE LINE: ZERO (0)', C.amber));

  // --- 24-31: compute each deviation (time - mean) --------------------------
  await until(S(24));
  await play(...fbox([['delivery time − mean', C.amber], ['mean = 5 days', C.muted]], C.amber),
    ...say('DELIVERY TIME − MEAN', C.amber));

  await until(S(25));
  await play(...fbox([['delivery time − mean', C.amber], ['fewer → −', C.green], ['more  → +', C.pink]], C.cyan),
    ...say('FEWER → −    MORE → +'));

  // 26-27: counting-back strip for 3 - 5 = -2
  const SY = P ? -2.15 : -2.32, SST = P ? 0.96 : 1.05;
  const sx = v => CX + (v - 0.5) * SST;
  const stripLine = new M.Line({ start: [sx(-2), SY, 0], end: [sx(3), SY, 0], color: C.muted, strokeWidth: 2.5 });
  const stripTicks = [-2, -1, 0, 1, 2, 3].map(v => new M.VGroup(
    new M.Line({ start: [sx(v), SY - (v === 0 ? 0.12 : 0.07), 0], end: [sx(v), SY + (v === 0 ? 0.12 : 0.07), 0], color: v === 0 ? C.amber : C.muted, strokeWidth: 2 }),
    T(v < 0 ? `−${-v}` : String(v), P ? 18 : 17, v === -2 ? C.green : (v === 0 ? C.amber : C.muted), true).moveTo([sx(v), SY - 0.32, 0])
  ));
  const startDot = new M.Dot({ point: [sx(3), SY, 0], radius: 0.09, color: C.cyan }); startDot.setFill(C.cyan, 1);

  await until(S(26));
  paintDot(dots7[0], C.amber);
  await play(
    new M.Create(stripLine), new M.FadeIn(new M.VGroup(...stripTicks, startDot)),
    ...fbox([['3-day parcel:', C.cyan], ['3 − 5 = ?', C.amber]], C.cyan),
    ...say('START AT 3, TAKE AWAY 5', C.green)
  );

  const hop1 = arrow(sx(3), SY + 0.28, sx(0) + 0.06, SY + 0.28, C.muted, 2.5);
  const hop1T = T('−3', P ? 17 : 16, C.muted, true).moveTo([(sx(3) + sx(0)) / 2, SY + 0.52, 0]);
  const hop2 = arrow(sx(0) - 0.04, SY + 0.28, sx(-2) + 0.04, SY + 0.28, C.green, 3);
  const hop2T = T('−2', P ? 17 : 16, C.green, true).moveTo([(sx(0) + sx(-2)) / 2, SY + 0.52, 0]);
  const endDot = new M.Dot({ point: [sx(-2), SY, 0], radius: 0.10, color: C.green }); endDot.setFill(C.green, 1);
  const lab3New = devLab(3, TY(3), '−2', C.green);

  await until(S(27));
  await play(
    new M.FadeIn(hop1), new M.FadeIn(hop1T),
    new M.FadeIn(hop2), new M.FadeIn(hop2T), new M.FadeIn(endDot),
    new M.FadeOut(labs7[0]), new M.FadeIn(lab3New),
    ...fbox([['3 − 3 = 0', C.muted], ['0 − 2 = −2', C.green], ['3 − 5 = −2', C.green]], C.green),
    ...say('3 − 5 = −2', C.green)
  );
  labs7[0] = lab3New;

  await until(S(28));
  paintDot(dots7[0], C.cyan);
  await play(
    new M.FadeOut(new M.VGroup(stripLine, ...stripTicks, startDot, hop1, hop1T, hop2, hop2T, endDot)),
    new M.Indicate(labs7[0], { color: C.amber }),
    ...fbox([['−2 = 2 days under mean', C.green], ['(not a delivery time)', C.muted]], C.green),
    ...say('2 DAYS UNDER THE MEAN', C.green)
  );

  // 29: four minus five is minus one
  const lab4a = devLab(4, TY(1), '−1', C.green), lab4b = devLab(4, TY(2), '−1', C.green);
  await until(S(29));
  await play(
    new M.FadeOut(labs7[1]), new M.FadeOut(labs7[2]),
    new M.FadeIn(lab4a), new M.FadeIn(lab4b),
    ...fbox([['4 − 5 = −1', C.green], ['4 − 5 = −1', C.green]], C.green),
    ...say('4 − 5 = −1  (EACH FOUR)', C.green)
  );
  labs7[1] = lab4a; labs7[2] = lab4b;

  // 30: five minus five is zero
  await until(S(30));
  await play(new M.Indicate(labs7[3], { color: C.amber }), ...fbox([['5 − 5 = 0', C.amber]], C.amber),
    ...say('5 − 5 = 0', C.amber));

  // 31: +1 for each six, +2 for seven
  const lab6a = devLab(6, TY(1), '+1', C.pink), lab6b = devLab(6, TY(2), '+1', C.pink), lab7 = devLab(7, TY(3), '+2', C.pink);
  await until(S(31));
  await play(
    new M.FadeOut(labs7[4]), new M.FadeOut(labs7[5]), new M.FadeOut(labs7[6]),
    new M.FadeIn(lab6a), new M.FadeIn(lab6b), new M.FadeIn(lab7),
    ...fbox([['6 − 5 = +1   (×2)', C.pink], ['7 − 5 = +2', C.pink]], C.pink),
    ...say('+1, +1, AND +2 ABOVE 5', C.pink)
  );
  labs7[4] = lab6a; labs7[5] = lab6b; labs7[6] = lab7;

  // --- 32-37: combine all seven deviations -> sum = 0 -----------------------
  await until(S(32));
  await play(...fbox([['−2, −1, −1', C.green], ['0', C.amber], ['+1, +1, +2', C.pink]], C.cyan),
    ...say('COMBINE ALL 7 DEVIATIONS'));

  await until(S(33));
  await play(...say('COMBINED TOTAL = THE SUM', C.amber));

  const BAL_Y = P ? -1.95 : -2.18;
  const balMid = new M.Line({ start: [n2x(5), BAL_Y - 0.25, 0], end: [n2x(5), BAL_Y + 0.25, 0], color: C.amber, strokeWidth: 2.5 });
  const barL4 = balBar(4, -1, BAL_Y, '−4', C.green);
  const barR4 = balBar(4, 1, BAL_Y, '+4', C.pink);

  await until(S(34));
  await play(
    new M.Create(balMid), new M.FadeIn(barL4),
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(arrows7[k], { color: C.amber })), { lagRatio: 0.12, runTime: 1.3 }),
    ...fbox([['left: −2 − 1 − 1 = −4', C.green]], C.green),
    ...say('LEFT SIDE = −4', C.green)
  );

  await until(S(35));
  await play(
    new M.FadeIn(barR4),
    new M.LaggedStart([4, 5, 6].map(k => new M.Indicate(arrows7[k], { color: C.amber })), { lagRatio: 0.12, runTime: 1.3 }),
    ...fbox([['left:  −2 − 1 − 1 = −4', C.green], ['right: +1 + 1 + 2 = +4', C.pink]], C.pink),
    ...say('RIGHT SIDE = +4', C.pink)
  );

  await until(S(36));
  await play(
    new M.Indicate(labs7[3], { color: C.amber }),
    ...fbox([['left:   −4', C.green], ['middle:  0', C.amber], ['right:  +4', C.pink]], C.amber),
    ...say('MIDDLE IS 0: NO CHANGE', C.amber)
  );

  const sum0Tag = pill('−4 + 4 = 0', C.amber, P ? 18 : 17);
  sum0Tag.moveTo([n2x(5), BAL_Y - (P ? 0.62 : 0.54), 0]);
  await until(S(37));
  await play(
    new M.FadeIn(sum0Tag),
    ...fbox([['−4 + 0 + 4 = 0', C.amber], ['sum of deviations = 0', C.amber]], C.amber),
    ...say('−4 AND +4 CANCEL → SUM = 0', C.amber)
  );

  // --- 38-46: lopsided deliveries (4, 4, 7) ---------------------------------
  await until(S(38));
  await play(new M.FadeOut(new M.VGroup(balMid, barL4, barR4, sum0Tag)),
    ...say('WHAT ABOUT LOPSIDED DATA?', C.violet));

  // Build 3-parcel set
  const initPos3 = [[n2x(4), rowY(0), 0], [n2x(4), rowY(1), 0], [n2x(7), rowY(0), 0]];
  const dots3 = initPos3.map(p => makeDot(p, C.cyan));
  const valLabs3 = [
    T('4, 4', P ? 18 : 17, C.cyan, true).moveTo([n2x(4), rowY(1) + 0.36, 0]),
    T('7', P ? 18 : 17, C.cyan, true).moveTo([n2x(7), rowY(0) + 0.36, 0])
  ];

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(
      ...dots7.flatMap(o => [o.halo, o.d]),
      ...offIdx.map(k => arrows7[k]),
      ...Object.values(labs7),
      ...drops7, meanLine, meanTag
    )),
    ...dots3.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.d)]),
    new M.FadeIn(valLabs3[0]), new M.FadeIn(valLabs3[1]),
    ...fbox([['3 parcels: 4, 4, 7', C.cyan]], C.cyan),
    ...say('3 PARCELS: 4, 4, 7 DAYS')
  );

  await until(S(40));
  await play(...fbox([['4 + 4 + 7 = 15 days', C.ink], ['15 ÷ 3 = 5 days', C.amber]], C.amber),
    ...say('15 ÷ 3 = 5 DAYS', C.amber));

  const meanDash3 = new M.DashedLine({ start: [n2x(5), LY, 0], end: [n2x(5), MEAN_TOP, 0], color: C.amber, strokeWidth: 2.5 });
  await until(S(41));
  await play(
    new M.Create(meanDash3), new M.FadeOut(new M.VGroup(...valLabs3)),
    ...moveDotA(dots3[0], [n2x(5), STACK_Y(0), 0], C.cyan, { pathArc: -0.25, runTime: 1.5 }),
    ...moveDotA(dots3[1], [n2x(5), STACK_Y(1), 0], C.cyan, { pathArc: -0.25, runTime: 1.5 }),
    ...moveDotA(dots3[2], [n2x(5), STACK_Y(2), 0], C.cyan, { pathArc: 0.35, runTime: 1.5 }),
    ...say('SLIDE 2 OFF 7 → 1 TO EACH 4', C.amber)
  );

  const meanTag3 = pill('MEAN = 5', C.amber, P ? 18 : 17);
  meanTag3.moveTo([n2x(5), MEAN_TAG_Y, 0]);
  await until(S(42));
  await play(new M.FadeIn(meanTag3), ...fbox([['15 ÷ 3 = 5', C.muted], ['mean = 5 days', C.amber]], C.amber),
    ...say('MEAN = 5 DAYS', C.amber));

  // Track assignment for D3 = [4, 4, 7]: Track 0, Track 1, Track 2
  const tr3 = [0, 1, 2];
  const trackPos3 = D3.map((v, k) => [n2x(v), TY(tr3[k]), 0]);
  const drops3 = [dropLine(4, TY(1)), dropLine(7, TY(2))];
  const meanLine3 = new M.Line({ start: [n2x(5), LY, 0], end: [n2x(5), MEAN_TOP, 0], color: C.amber, strokeWidth: 3.5 });
  const arrows3 = [
    devArrow(4, TY(0), C.green),
    devArrow(4, TY(1), C.green),
    devArrow(7, TY(2), C.pink)
  ];

  await until(S(43));
  await play(
    new M.FadeOut(meanDash3), new M.Create(meanLine3),
    new M.FadeIn(new M.VGroup(...drops3)),
    ...D3.flatMap((_, k) => moveDotA(dots3[k], trackPos3[k], C.cyan, { runTime: 1.2 })),
    new M.LaggedStart(arrows3.map(a => new M.FadeIn(a)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('ARROWS FROM 5')
  );

  const lab3_7 = devLab(7, TY(2), '+2', C.pink);
  await until(S(44));
  await play(new M.FadeIn(lab3_7), new M.Indicate(arrows3[2], { color: C.amber }),
    ...fbox([['7 − 5 = +2', C.pink]], C.pink), ...say('7 IS +2 PAST 5', C.pink));

  const lab3_4a = devLab(4, TY(0), '−1', C.green), lab3_4b = devLab(4, TY(1), '−1', C.green);
  await until(S(45));
  await play(
    new M.FadeIn(lab3_4a), new M.FadeIn(lab3_4b),
    ...fbox([['7 − 5 = +2', C.pink], ['4 − 5 = −1 (×2 → −2)', C.green]], C.green),
    ...say('−1 AND −1 MAKE −2', C.green)
  );

  const balMid3 = new M.Line({ start: [n2x(5), BAL_Y - 0.25, 0], end: [n2x(5), BAL_Y + 0.25, 0], color: C.amber, strokeWidth: 2.5 });
  const barL2 = balBar(2, -1, BAL_Y, '−2', C.green);
  const barR2 = balBar(2, 1, BAL_Y, '+2', C.pink);
  const sum0Tag3 = pill('−2 + 2 = 0', C.amber, P ? 18 : 17);
  sum0Tag3.moveTo([n2x(5), BAL_Y - (P ? 0.62 : 0.54), 0]);

  await until(S(46));
  await play(
    new M.Create(balMid3), new M.FadeIn(barL2), new M.FadeIn(barR2), new M.FadeIn(sum0Tag3),
    ...fbox([['−1 − 1 + 2 = 0', C.amber], ['sum = 0', C.amber]], C.amber),
    ...say('+2 AND −2 CANCEL → 0', C.amber)
  );

  // --- 47-51: why it always balances (transferring 1-day amber segments) ----
  await until(S(47));
  await play(new M.FadeOut(new M.VGroup(balMid3, barL2, barR2, sum0Tag3)),
    ...say('WHY ALWAYS ZERO?', C.violet));

  const seg1 = segRect(n2x(5), n2x(6), TY(2), C.amber);
  const seg2 = segRect(n2x(6), n2x(7), TY(2), C.amber);
  await until(S(48));
  await play(new M.FadeIn(seg1), new M.FadeIn(seg2), ...say('SLIDE DAYS: SLOW → FAST', C.amber));

  await until(S(49));
  await play(
    new M.Transform(seg1, segRect(n2x(4), n2x(5), TY(1), C.amber), { pathArc: 0.7, runTime: 1.5 }),
    new M.Transform(seg2, segRect(n2x(4), n2x(5), TY(0), C.amber), { pathArc: 0.9, runTime: 1.7 }),
    ...say('EXTRA DAYS FILL MISSING DAYS', C.amber)
  );

  await until(S(50));
  await play(
    new M.Indicate(seg1, { color: C.ink }), new M.Indicate(seg2, { color: C.ink }),
    ...fbox([['extra moved:   2 days', C.pink], ['missing filled: 2 days', C.green], ['added or lost: 0', C.amber]], C.violet),
    ...say('NO DAY ADDED OR LOST', C.violet)
  );

  const matchTag = pill('ABOVE (+)  =  BELOW (−)', C.amber, P ? 18 : 17);
  matchTag.moveTo([n2x(5), BAL_Y, 0]);
  await until(S(51));
  await play(new M.FadeOut(new M.VGroup(seg1, seg2)), new M.FadeIn(matchTag),
    ...say('ABOVE ALWAYS MATCHES BELOW', C.amber));

  // --- 52-58: short rule, usefulness, trap, bridge, recap -------------------
  await until(S(52));
  await play(new M.FadeOut(matchTag), ...fbox([['deviation = time − mean', C.amber]], C.amber),
    ...say('RULE: TIME − MEAN', C.amber));

  await until(S(53));
  await play(...fbox([['deviation = time − mean', C.ink], ['sum of deviations = 0', C.amber]], C.amber),
    ...say('SUM OF DEVIATIONS = 0', C.amber));

  // Restore full 7-parcel deviation picture cleanly for 54-58
  const dots7B = trackPos7.map(p => makeDot(p, C.cyan));
  const drops7B = [dropLine(3, TY(3)), dropLine(4, TY(2)), dropLine(6, TY(2)), dropLine(7, TY(3))];
  const arrows7B = {};
  const labs7B = {};
  const texts7 = ['−2', '−1', '−1', '0', '+1', '+1', '+2'];
  D7.forEach((v, k) => {
    const col = v < 5 ? C.green : (v > 5 ? C.pink : C.amber);
    if (v !== 5) {
      arrows7B[k] = devArrow(v, TY(tr7[k]), col);
      labs7B[k] = devLab(v, TY(tr7[k]), texts7[k], col);
    } else {
      labs7B[k] = T('0', P ? 19 : 18, C.amber, true).moveTo([n2x(5) + 0.30, TY(0), 0]);
    }
  });

  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(
      ...dots3.flatMap(o => [o.halo, o.d]),
      ...arrows3, lab3_7, lab3_4a, lab3_4b, ...drops3
    )),
    new M.FadeIn(new M.VGroup(...drops7B)),
    ...dots7B.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.d)]),
    ...offIdx.map(k => new M.FadeIn(arrows7B[k])),
    ...Object.values(labs7B).map(l => new M.FadeIn(l)),
    ...say('BEAT (−) OR MISSED (+) AT A GLANCE')
  );

  await until(S(55));
  await play(
    ...fbox([['TRAP: sum = 0', C.pink], ['does NOT mean all', C.ink], ['parcels took 5 days', C.pink]], C.pink),
    ...say('TRAP: ZERO SUM ≠ ALL AT 5', C.pink)
  );

  const spreadBr = bracket(n2x(3), n2x(7), BR_Y, BR_D, 'spread: 3 to 7 days', C.amber);
  await until(S(56));
  await play(
    new M.FadeIn(spreadBr),
    new M.Indicate(dots7B[0].d, { color: C.amber }),
    new M.Indicate(dots7B[6].d, { color: C.amber }),
    ...say('3 TO 7 DAYS — SUM HIDES SPREAD', C.amber)
  );

  await until(S(57));
  await play(
    new M.FadeOut(spreadBr),
    ...fbox([['NEXT LESSON:', C.violet], ['stop − and + cancelling', C.ink], ['to measure spread', C.cyan]], C.violet),
    ...say('NEXT: STOP − AND + CANCELLING', C.violet)
  );

  await until(S(58));
  await play(
    new M.LaggedStart(offIdx.map(k => new M.Indicate(arrows7B[k], { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }),
    ...fbox([['deviation = time − mean', C.cyan], ['how far + which way', C.ink], ['together: sum = 0', C.amber]], C.amber),
    ...say('HOW FAR, WHICH WAY, BALANCED', C.amber)
  );
}
