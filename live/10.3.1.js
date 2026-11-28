// 10.3.1 Generalized linear models (live version, script.v8.md).
// Beat i = sentence i (0-based, 0..52). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout anchors (laptop: 14.22 x 8, content in y=[-3.0, 2.3]; phone: 8 x 14.22, content in y=[-5.5, 4.3])
  const PILL = P ? [0, 2.25, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, never over data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.4 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  // Geometry helpers (built strictly from Line, Circle, Dot, RoundedRectangle, Rectangle, DashedLine, Text, VGroup)
  const sig = s => 1 / (1 + Math.exp(-s));
  function makeArrow(start, end, color = C.amber, sw = 3, head = 0.18) {
    const dx = end[0] - start[0], dy = end[1] - start[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, z = end[2] || 0;
    const bx = end[0] - ux * head, by = end[1] - uy * head;
    const px = -uy * head * 0.55, py = ux * head * 0.55;
    return new M.VGroup(
      new M.Line({ start, end, color, strokeWidth: sw }),
      new M.Line({ start: [bx + px, by + py, z], end, color, strokeWidth: sw }),
      new M.Line({ start: [bx - px, by - py, z], end, color, strokeWidth: sw })
    );
  }
  function curveSegs(pts, color, sw = 3.5) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      out.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: sw }));
    }
    return out;
  }
  function dotWithHalo(p, color = C.cyan, r = 0.11, hr = 0.25) {
    const halo = new M.Dot({ point: p, radius: hr, color }); halo.setFill(color, 0.2);
    const d = new M.Dot({ point: p, radius: r, color });
    return { g: new M.VGroup(halo, d), dot: d };
  }
  function legendPair(cx, cy) {
    const d1 = new M.Dot({ point: [cx - 1.35, cy, 0], radius: 0.09, color: C.cyan });
    const t1 = T('came', P ? 16 : 17, C.cyan); t1.moveTo([cx - 0.82, cy, 0]);
    const d2 = new M.Dot({ point: [cx + 0.45, cy, 0], radius: 0.09, color: C.pink });
    const t2 = T('missed', P ? 16 : 17, C.pink); t2.moveTo([cx + 1.08, cy, 0]);
    return new M.VGroup(d1, t1, d2, t2);
  }

  // ===========================================================================
  // ACT 1 (0–7): Clinic reminders, Log 1 table, and 10x10 patient dot grids
  // ===========================================================================
  const cX = P ? -1.75 : -2.6, cY = P ? -1.1 : -0.35;
  const bldg = new M.RoundedRectangle({ width: 1.8, height: 1.5, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  bldg.setFill(C.card, 0.95); bldg.moveTo([cX, cY, 0]);
  const roof = new M.Line({ start: [cX - 1.05, cY + 0.78, 0], end: [cX + 1.05, cY + 0.78, 0], color: C.cyan, strokeWidth: 3 });
  const crossV = new M.Rectangle({ width: 0.18, height: 0.62, color: C.cyan, strokeWidth: 1 });
  crossV.setFill(C.cyan, 0.95); crossV.moveTo([cX, cY + 0.1, 0]);
  const crossH = new M.Rectangle({ width: 0.62, height: 0.18, color: C.cyan, strokeWidth: 1 });
  crossH.setFill(C.cyan, 0.95); crossH.moveTo([cX, cY + 0.1, 0]);
  const cLab = T('Clinic', P ? 17 : 19, C.ink, false, true); cLab.moveTo([cX, cY - 1.08, 0]);

  const mX = P ? 1.75 : 2.5, mY = cY;
  const phone = new M.RoundedRectangle({ width: 2.1, height: 1.25, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.5 });
  phone.setFill(C.card, 0.95); phone.moveTo([mX, mY + 0.1, 0]);
  const msg1 = T('Text reminder:', P ? 14 : 15, C.amber, false, true); msg1.moveTo([mX, mY + 0.34, 0]);
  const msg2 = T('Appt tomorrow', P ? 14 : 15, C.ink); msg2.moveTo([mX, mY - 0.12, 0]);
  const mLab = T('Patient', P ? 17 : 19, C.ink, false, true); mLab.moveTo([mX, mY - 1.08, 0]);
  const sendArr = makeArrow([cX + 1.15, cY + 0.1, 0], [mX - 1.25, mY + 0.1, 0], C.amber, 3);
  const intro0 = new M.VGroup(bldg, roof, crossV, crossH, cLab, phone, msg1, msg2, mLab, sendArr);

  await until(S(0));
  await play(new M.FadeIn(intro0, { runTime: 1.0 }), ...say('CLINIC TEXT REMINDERS'));

  // 1: question — share who come
  const qRow = [];
  for (let k = 0; k < 10; k++) {
    const col = k < 8 ? C.cyan : C.pink;
    const x = (k - 4.5) * (P ? 0.52 : 0.62), y = P ? -3.1 : -2.0;
    qRow.push(new M.Dot({ point: [x, y, 0], radius: P ? 0.13 : 0.14, color: col }));
  }
  const introLeg = new M.VGroup(...qRow, legendPair(0, P ? -3.75 : -2.55));
  await until(S(1));
  await play(new M.FadeIn(introLeg, { runTime: 0.9 }), ...say('PREDICT: SHARE WHO COME?', C.amber));

  // 2: Clinic records table (Log 1)
  const tCX = P ? 0 : -3.4, tCY = P ? 0.35 : -0.15;
  const tW = P ? 6.8 : 5.9, tH = P ? 2.25 : 2.45;
  const tCard = new M.RoundedRectangle({ width: tW, height: tH, cornerRadius: 0.16, color: C.line, strokeWidth: 2 });
  tCard.setFill(C.card, 0.95); tCard.moveTo([tCX, tCY, 0]);
  const colX = [-0.36, -0.10, 0.14, 0.37].map(f => tCX + f * tW);
  const rowY = [tCY + tH * 0.31, tCY + tH * 0.02, tCY - tH * 0.28];
  const hLine = new M.Line({ start: [tCX - tW / 2 + 0.2, tCY + tH * 0.17, 0], end: [tCX + tW / 2 - 0.2, tCY + tH * 0.17, 0], color: C.muted, strokeWidth: 1.5 });
  const hTexts = ['Reminders', 'Came', 'Total', 'Share'].map((s, k) => {
    const t = T(s, P ? 15 : 16, C.muted, false, true); t.moveTo([colX[k], rowY[0], 0]); return t;
  });
  const r0Key = T('0', P ? 18 : 19, C.ink, true, true); r0Key.moveTo([colX[0], rowY[1], 0]);
  const r1Key = T('1', P ? 18 : 19, C.muted, true, true); r1Key.moveTo([colX[0], rowY[2], 0]);
  const tblHead = new M.VGroup(tCard, hLine, ...hTexts, r0Key, r1Key);
  const rowHi = new M.RoundedRectangle({ width: tW - 0.26, height: tH * 0.27, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  rowHi.setFill(C.cyan, 0.10); rowHi.moveTo([tCX, rowY[1], 0]);

  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(intro0, introLeg), { runTime: 0.5 }),
    new M.FadeIn(tblHead, { runTime: 0.7 }), new M.FadeIn(rowHi, { runTime: 0.7 }), ...say('ROW: 0 REMINDERS'));

  // Helper: 10x10 dot grid (came = cyan, missed = pink)
  function dotGrid100(cx, cy, came, pitch, rad, title, sub) {
    const dots = [];
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const px = cx + (c - 4.5) * pitch, py = cy + (4.5 - r) * pitch;
      dots.push(new M.Dot({ point: [px, py, 0], radius: rad, color: i < came ? C.cyan : C.pink }));
    }
    const span = 10 * pitch;
    const tTop = T(title, P ? 15 : 16, C.ink, false, true); tTop.moveTo([cx, cy + span / 2 + 0.26, 0]);
    const tBot = T(sub, P ? 15 : 16, C.cyan, true); tBot.moveTo([cx, cy - span / 2 - 0.26, 0]);
    return new M.VGroup(...dots, tTop, tBot);
  }
  const gPitch = P ? 0.23 : 0.21, gRad = P ? 0.068 : 0.062;
  const g0P = P ? [-1.75, -2.75] : [1.65, -0.05];
  const g1P = P ? [1.75, -2.75] : [4.65, -0.05];

  // 3: 75 of 100 patients come
  const r0c = T('75', P ? 18 : 19, C.cyan, true); r0c.moveTo([colX[1], rowY[1], 0]);
  const r0n = T('100', P ? 18 : 19, C.ink, true); r0n.moveTo([colX[2], rowY[1], 0]);
  const r0vals = new M.VGroup(r0c, r0n);
  const grid0 = dotGrid100(g0P[0], g0P[1], 75, gPitch, gRad, '0 reminders', '75 of 100');
  const act1Leg = legendPair(P ? 0 : 3.15, P ? -4.75 : -2.15);
  await until(S(3));
  await play(new M.FadeIn(r0vals, { runTime: 0.6 }), new M.FadeIn(grid0, { runTime: 0.9 }),
    new M.FadeIn(act1Leg, { runTime: 0.6 }), ...say('75 OF 100 COME', C.cyan));

  // 4: 1 reminder -> 90 of 100 come
  const rowHi1 = new M.RoundedRectangle({ width: tW - 0.26, height: tH * 0.27, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  rowHi1.setFill(C.cyan, 0.10); rowHi1.moveTo([tCX, rowY[2], 0]);
  const r1c = T('90', P ? 18 : 19, C.cyan, true); r1c.moveTo([colX[1], rowY[2], 0]);
  const r1n = T('100', P ? 18 : 19, C.ink, true); r1n.moveTo([colX[2], rowY[2], 0]);
  const r1vals = new M.VGroup(r1c, r1n);
  const grid1 = dotGrid100(g1P[0], g1P[1], 90, gPitch, gRad, '1 reminder', '90 of 100');
  await until(S(4));
  r1Key.setColor(C.ink);
  await play(new M.Transform(rowHi, rowHi1, { runTime: 0.6 }), new M.FadeIn(r1vals, { runTime: 0.6 }),
    new M.FadeIn(grid1, { runTime: 0.9 }), ...say('1 REMINDER: 90 OF 100', C.cyan));

  // 5: Percent tells you how many out of a hundred
  const boxSpan = 10 * gPitch + 0.14;
  const g0Outline = new M.RoundedRectangle({ width: boxSpan, height: boxSpan, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.5 });
  g0Outline.moveTo([g0P[0], g0P[1], 0]);
  const g0Note = T('100 total', P ? 14 : 15, C.amber, true); g0Note.moveTo([g0P[0], g0P[1] - boxSpan / 2 - 0.54, 0]);
  const g0Box = new M.VGroup(g0Outline, g0Note);
  await until(S(5));
  await play(new M.Create(g0Outline, { runTime: 0.7 }), new M.FadeIn(g0Note, { runTime: 0.6 }), ...say('PERCENT = OUT OF 100', C.amber));

  // 6: 75% and 90%
  const pct0 = T('75%', P ? 18 : 19, C.amber, true, true); pct0.moveTo([colX[3], rowY[1], 0]);
  const pct1 = T('90%', P ? 18 : 19, C.amber, true, true); pct1.moveTo([colX[3], rowY[2], 0]);
  const tag75 = pill('75%', C.amber, 16); tag75.moveTo([g0P[0], g0P[1] + boxSpan / 2 + 0.64, 0]);
  const tag90 = pill('90%', C.amber, 16); tag90.moveTo([g1P[0], g1P[1] + boxSpan / 2 + 0.64, 0]);
  await until(S(6));
  await play(new M.FadeIn(pct0, { runTime: 0.6 }), new M.FadeIn(pct1, { runTime: 0.6 }),
    new M.FadeIn(tag75, { runTime: 0.6 }), new M.FadeIn(tag90, { runTime: 0.6 }), ...say('75% AND 90%', C.amber));

  // 7: Percent tells you how many out of a hundred (re-emphasis)
  await until(S(7));
  await play(new M.Indicate(tag75, { color: C.cyan, runTime: 0.8 }), new M.Indicate(tag90, { color: C.cyan, runTime: 0.8 }),
    ...say('75 PER 100  ·  90 PER 100', C.amber));

  // ===========================================================================
  // ACT 2 (8–17): Plot shares vs reminders; straight ruler predicts 105%!
  // ===========================================================================
  const gx0 = P ? -2.65 : -4.85, gx1 = P ? 3.25 : 1.55;
  const gy0 = P ? -4.25 : -2.40, gy1 = P ? 1.25 : 1.35;
  const r2x = r => gx0 + 0.85 + r * (P ? 2.15 : 2.35);
  const p2y = p => gy0 + (p / 115) * (gy1 - gy0);

  // 8: Number of reminders along bottom
  const xLine2 = new M.Line({ start: [gx0, gy0, 0], end: [gx1, gy0, 0], color: C.muted, strokeWidth: 3 });
  const xTicks2 = [0, 1, 2].map(r => new M.VGroup(
    new M.Line({ start: [r2x(r), gy0 - 0.08, 0], end: [r2x(r), gy0 + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(r), 18, C.ink, true).moveTo([r2x(r), gy0 - 0.34, 0])
  ));
  const xLab2 = T('Reminders', 17, C.muted, false, true); xLab2.moveTo([(gx0 + gx1) / 2, gy0 - 0.72, 0]);
  const xAxis2 = new M.VGroup(xLine2, ...xTicks2, xLab2);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(tblHead, rowHi, r0vals, grid0, act1Leg, r1vals, grid1, g0Box, pct0, pct1, tag75, tag90), { runTime: 0.5 }),
    new M.FadeIn(xAxis2, { runTime: 0.8 }), ...say('REMINDERS ALONG THE BOTTOM')
  );

  // 9: Dot above each reminder count, as high as its share
  const yLine2 = new M.Line({ start: [gx0, gy0, 0], end: [gx0, gy1, 0], color: C.muted, strokeWidth: 3 });
  const yTicks2 = [0, 50, 75, 100].map(p => new M.VGroup(
    new M.Line({ start: [gx0 - 0.08, p2y(p), 0], end: [gx0 + 0.08, p2y(p), 0], color: C.muted, strokeWidth: 2 }),
    T(p + '%', 15, C.muted, true).moveTo([gx0 - 0.45, p2y(p), 0])
  ));
  const yAxis2 = new M.VGroup(yLine2, ...yTicks2);
  const p0 = [r2x(0), p2y(75), 0], p1 = [r2x(1), p2y(90), 0];
  const d0h = dotWithHalo(p0, C.cyan, 0.12, 0.26);
  const l0 = T('75%', 17, C.cyan, true, true); l0.moveTo([p0[0] - 0.45, p0[1] + 0.28, 0]);
  const d0 = new M.VGroup(d0h.g, l0);
  const d1h = dotWithHalo(p1, C.cyan, 0.12, 0.26);
  const l1 = T('90%', 17, C.cyan, true, true); l1.moveTo([p1[0] - 0.42, p1[1] - 0.36, 0]);
  const d1 = new M.VGroup(d1h.g, l1);

  await until(S(9));
  await play(new M.FadeIn(yAxis2, { runTime: 0.6 }), new M.FadeIn(d0, { runTime: 0.7 }), new M.FadeIn(d1, { runTime: 0.7 }),
    new M.Flash(d0h.dot, { color: C.cyan, runTime: 0.7 }), new M.Flash(d1h.dot, { color: C.cyan, runTime: 0.7 }),
    ...say('HEIGHT = SHARE WHO COME', C.cyan));

  // 10: Join dots with a ruler (short beat: 1.86s)
  const seg01 = new M.Line({ start: p0, end: p1, color: C.amber, strokeWidth: 4 });
  await until(S(10));
  await play(new M.Create(seg01, { runTime: 0.75 }), ...say('STRAIGHT LINE (RULER)', C.amber));

  // 11: Line rises by 15 points for 1 more reminder
  const corner = [p1[0], p0[1], 0];
  const runSeg = new M.DashedLine({ start: p0, end: corner, color: C.amber });
  const riseSeg = new M.DashedLine({ start: corner, end: p1, color: C.amber });
  const runTxt = T('+1 reminder', 14, C.amber, true); runTxt.moveTo([(p0[0] + p1[0]) / 2, p0[1] - 0.28, 0]);
  const riseTxt = T('+15%', 16, C.amber, true, true); riseTxt.moveTo([p1[0] + 0.48, (p0[1] + p1[1]) / 2, 0]);
  const step15 = new M.VGroup(runSeg, riseSeg, runTxt, riseTxt);
  await until(S(11));
  await play(new M.FadeIn(step15, { runTime: 0.8 }), ...say('+1 REMINDER → +15 POINTS', C.amber));

  // 12: Extend line to predict 2 reminders
  const p2p = [r2x(2), p2y(105), 0];
  const ext12 = new M.DashedLine({ start: p1, end: p2p, color: C.pink });
  const d2ph = dotWithHalo(p2p, C.pink, 0.12, 0.28);
  const d2pred = d2ph.g;
  await until(S(12));
  await play(new M.Create(ext12, { runTime: 0.75 }), new M.FadeIn(d2pred, { runTime: 0.6 }), ...say('PREDICT AT 2 REMINDERS', C.amber));

  // 13: 90 + 15 = 105%
  const lbl105 = T('105% !', 18, C.pink, true, true); lbl105.moveTo([p2p[0] + 0.1, p2p[1] + 0.34, 0]);
  await until(S(13));
  await play(new M.FadeIn(lbl105, { runTime: 0.6 }), new M.Flash(d2ph.dot, { color: C.pink, runTime: 0.7 }),
    ...fbox(['1 reminder:   90%', 'add 15 pts:  +15%', ['prediction:  105% !', C.pink]], C.pink),
    ...say('90% + 15% = 105%', C.pink));

  // 14: Every patient coming = 100% max
  const y100 = p2y(100);
  const ceilLine = new M.DashedLine({ start: [gx0, y100, 0], end: [gx1, y100, 0], color: C.pink });
  const ceilTag = T('100% MAX', 15, C.pink, true, true); ceilTag.moveTo([gx0 + 0.95, y100 + 0.22, 0]);
  const ceil100 = new M.VGroup(ceilLine, ceilTag);
  const badZone = new M.Rectangle({ width: gx1 - gx0, height: gy1 - y100, color: C.pink, strokeWidth: 0 });
  badZone.setFill(C.pink, 0.14); badZone.setStrokeOpacity(0); badZone.moveTo([(gx0 + gx1) / 2, (y100 + gy1) / 2, -0.01]);
  await until(S(14));
  await play(new M.Create(ceilLine, { runTime: 0.7 }), new M.FadeIn(ceilTag, { runTime: 0.5 }),
    new M.FadeIn(badZone, { runTime: 0.6 }), new M.Indicate(lbl105, { color: C.pink, runTime: 0.8 }),
    ...say('IMPOSSIBLE: OVER 100%!', C.pink));

  // 15: Look at the actual row for two reminders
  await until(S(15));
  await play(...fbox(['Actual row: 2 reminders', ['checking clinic log...', C.muted]], C.cyan),
    ...say('ACTUAL ROW: 2 REMINDERS', C.cyan));

  // 16: 27 of 28 patients come, about 96%
  const p2a = [r2x(2), p2y(96.4), 0];
  const d2ah = dotWithHalo(p2a, C.cyan, 0.12, 0.26);
  const l96 = T('96%', 17, C.cyan, true, true); l96.moveTo([p2a[0] + 0.45, p2a[1] - 0.18, 0]);
  const d2act = new M.VGroup(d2ah.g, l96);
  await until(S(16));
  await play(new M.FadeIn(d2act, { runTime: 0.7 }), new M.Flash(d2ah.dot, { color: C.cyan, runTime: 0.7 }),
    ...fbox(['Actual: 2 reminders', '27 of 28 came', ['27 ÷ 28 ≈ 96%', C.cyan]], C.cyan),
    ...say('27 OF 28 ≈ 96%', C.cyan));

  // 17: Need a rule that keeps prediction inside 0%–100%
  const validBar = new M.Line({ start: [gx0 - 0.02, p2y(0), 0], end: [gx0 - 0.02, y100, 0], color: C.green, strokeWidth: 6 });
  const validLbl = T('0%–100%', 15, C.green, true, true); validLbl.moveTo([gx0 + 0.75, p2y(32), 0]);
  const validBrk = new M.VGroup(validBar, validLbl);
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(ext12, d2pred, lbl105), { runTime: 0.6 }),
    new M.FadeIn(validBrk, { runTime: 0.7 }), ...say('KEEP PREDICTIONS IN 0% TO 100%', C.green));

  // ===========================================================================
  // ACT 3 (18–31): Separate Score Scale + S-Shaped Curve
  // ===========================================================================
  // Left/Top panel: Score line (rem 0..2 -> score -1.2..4.2)
  const scX0 = P ? -2.65 : -5.95, scX1 = P ? 3.15 : -1.15;
  const scY0 = P ? -0.75 : -2.15, scY1 = P ? 1.25 : 1.05;
  const sr2x = r => scX0 + (P ? 0.85 : 0.75) + r * (P ? 2.1 : 1.75);
  const s2ly = sc => scY0 + ((sc + 1.2) / 5.4) * (scY1 - scY0);

  // Right/Bottom panel: S-curve (score -4..4.5 -> share 0..1)
  const crX0 = P ? -2.65 : 1.05, crX1 = P ? 3.15 : 6.15;
  const crY0 = P ? -4.75 : -2.15, crY1 = P ? -2.15 : 1.00;
  const s2rx = sc => crX0 + ((sc + 4) / 8.5) * (crX1 - crX0);
  const sh2ry = sh => crY0 + sh * (crY1 - crY0);

  // 18: Keep the ruler, put it on a separate scale
  const scZeroY = s2ly(0);
  const scXAxis = new M.Line({ start: [scX0, scZeroY, 0], end: [scX1, scZeroY, 0], color: C.muted, strokeWidth: 2.5 });
  const scYAxis = new M.Line({ start: [scX0, scY0, 0], end: [scX0, scY1, 0], color: C.amber, strokeWidth: 2.5 });
  const scXTicks = [0, 1, 2].map(r => new M.VGroup(
    new M.Line({ start: [sr2x(r), scZeroY - 0.07, 0], end: [sr2x(r), scZeroY + 0.07, 0], color: C.muted, strokeWidth: 2 }),
    T(String(r), 15, C.muted, true).moveTo([sr2x(r), scZeroY - 0.27, 0])
  ));
  const scYTicks = [-1, 0, 1, 2, 3, 4].map(v => new M.VGroup(
    new M.Line({ start: [scX0 - 0.07, s2ly(v), 0], end: [scX0 + 0.07, s2ly(v), 0], color: C.amber, strokeWidth: 1.5 }),
    T(String(v), 14, C.muted, true).moveTo([scX0 - 0.28, s2ly(v), 0])
  ));
  const scTitle = T('Separate scale', 16, C.amber, false, true); scTitle.moveTo([(scX0 + scX1) / 2, scY1 + 0.26, 0]);
  const scRemLab = T('Reminders', 14, C.muted); scRemLab.moveTo([(scX0 + scX1) / 2, scY0 - 0.25, 0]);
  const scAxes = new M.VGroup(scXAxis, scYAxis, ...scXTicks, ...scYTicks, scTitle, scRemLab);

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(xAxis2, yAxis2, d0, d1, seg01, step15, ceil100, badZone, d2act, validBrk), { runTime: 0.5 }),
    ...clearBox(),
    new M.FadeIn(scAxes, { runTime: 0.8 }), ...say('SEPARATE SCALE FOR THE RULER', C.amber)
  );

  // 19: Line gives a number we call a score
  const scYLab = pill('SCORE', C.amber, 14); scYLab.moveTo([scX0 + 0.65, scY1 + 0.24, 0]);
  const scGuide = new M.DashedLine({ start: [sr2x(0), s2ly(1.1), 0], end: [sr2x(2), s2ly(3.3), 0], color: C.amber });
  await until(S(19));
  await play(new M.FadeOut(scTitle, { runTime: 0.4 }), new M.FadeIn(scYLab, { runTime: 0.6 }),
    new M.Create(scGuide, { runTime: 0.75 }), ...say('THIS NUMBER IS A SCORE', C.amber));

  // 20: Score can go below 0 or above 1
  const arrNeg = makeArrow([scX0 + 0.35, s2ly(-0.15), 0], [scX0 + 0.35, s2ly(-1.05), 0], C.violet, 2.5, 0.13);
  const txtNeg = T('< 0', 14, C.violet, true, true); txtNeg.moveTo([scX0 + 0.78, s2ly(-0.7), 0]);
  const arrPos = makeArrow([scX0 + 0.35, s2ly(1.4), 0], [scX0 + 0.35, s2ly(3.8), 0], C.violet, 2.5, 0.13);
  const txtPos = T('> 1', 14, C.violet, true, true); txtPos.moveTo([scX0 + 0.78, s2ly(2.8), 0]);
  const scRange = new M.VGroup(arrNeg, txtNeg, arrPos, txtPos);
  await until(S(20));
  await play(new M.FadeIn(scRange, { runTime: 0.75 }), ...say('SCORE CAN GO < 0 OR > 1', C.violet));

  // 21: Picture an S-shaped curve beside the score line
  const crXAx = new M.Line({ start: [crX0, crY0, 0], end: [crX1, crY0, 0], color: C.muted, strokeWidth: 2.5 });
  const crYAx = new M.Line({ start: [crX0, crY0, 0], end: [crX0, crY1, 0], color: C.cyan, strokeWidth: 2.5 });
  const crZero = new M.Line({ start: [s2rx(0), crY0, 0], end: [s2rx(0), crY1, 0], color: C.grid, strokeWidth: 1.5 });
  const crTop = new M.DashedLine({ start: [crX0, sh2ry(1), 0], end: [crX1, sh2ry(1), 0], color: C.cyan });
  const crTitle = T('S-shaped curve', 16, C.cyan, false, true); crTitle.moveTo([(crX0 + crX1) / 2, crY1 + 0.26, 0]);
  const crScoreLbl = T('Score', 14, C.amber); crScoreLbl.moveTo([(crX0 + crX1) / 2, crY0 - 0.30, 0]);
  const crSTicks = [-2, 0, 2, 4].map(v => T(String(v), 13, C.muted, true).moveTo([s2rx(v), crY0 - 0.18, 0]));
  const sAxes = new M.VGroup(crXAx, crYAx, crZero, crTop, crTitle, crScoreLbl, ...crSTicks);

  const sPts = [];
  for (let i = 0; i <= 34; i++) {
    const sc = -4 + (i / 34) * 8.5;
    sPts.push([s2rx(sc), sh2ry(sig(sc)), 0]);
  }
  const sSegs = curveSegs(sPts, C.cyan, 3.5);
  const connArr = P
    ? makeArrow([0, -1.08, 0], [0, -1.62, 0], C.cyan, 3, 0.16)
    : makeArrow([-0.82, -0.55, 0], [0.45, -0.55, 0], C.cyan, 3, 0.18);

  await until(S(21));
  await play(new M.FadeIn(sAxes, { runTime: 0.6 }), new M.FadeIn(connArr, { runTime: 0.6 }),
    new M.LaggedStart(sSegs.map(s => new M.Create(s, { runTime: 0.25 })), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('AN S-SHAPED CURVE', C.cyan));

  // 22: Turns each score into a share between 0% and 100%
  const b0 = T('0%', P ? 16 : 15, C.green, true, true); b0.moveTo([crX0 - 0.34, sh2ry(0), 0]);
  const b50 = T('50%', P ? 16 : 15, C.muted, true); b50.moveTo([crX0 - 0.38, sh2ry(0.5), 0]);
  const b100 = T('100%', P ? 16 : 15, C.green, true, true); b100.moveTo([crX0 - 0.42, sh2ry(1), 0]);
  const sBounds = new M.VGroup(b0, b50, b100);
  await until(S(22));
  await play(new M.FadeIn(sBounds, { runTime: 0.7 }), new M.Indicate(crTop, { color: C.green, runTime: 0.8 }),
    ...say('SCORE → SHARE (0% TO 100%)', C.green));

  // 23: Start with a score of 1.1 at 0 reminders
  const sp0Pos = [sr2x(0), s2ly(1.1), 0];
  const sp0h = dotWithHalo(sp0Pos, C.amber, 0.11, 0.24);
  const sp0Lbl = T('1.1', 17, C.amber, true, true); sp0Lbl.moveTo([sp0Pos[0] - 0.30, sp0Pos[1] + 0.32, 0]);
  const sp0 = new M.VGroup(sp0h.g, sp0Lbl);
  await until(S(23));
  await play(new M.FadeOut(new M.VGroup(scGuide, scRange), { runTime: 0.45 }),
    new M.FadeIn(sp0, { runTime: 0.65 }), new M.Flash(sp0h.dot, { color: C.amber, runTime: 0.65 }),
    ...say('0 REMINDERS → SCORE 1.1', C.amber));

  // 24: Starting score = intercept
  const intTag = T('intercept', 15, C.violet, false, true); intTag.moveTo([sp0Pos[0] + 0.85, sp0Pos[1] + 0.32, 0]);
  await until(S(24));
  await play(new M.FadeIn(intTag, { runTime: 0.6 }), new M.Indicate(sp0h.dot, { color: C.violet, runTime: 0.7 }),
    ...say('INTERCEPT = STARTING SCORE (1.1)', C.violet));

  // Helper: map a score on the S-curve to its share
  function sCurvePoint(scVal, pctText, col = C.cyan, lxOff = -0.58, lyOff = 0.0) {
    const px = s2rx(scVal), py = sh2ry(sig(scVal));
    const vLine = new M.DashedLine({ start: [px, crY0, 0], end: [px, py, 0], color: C.amber });
    const hLine2 = new M.DashedLine({ start: [px, py, 0], end: [crX0, py, 0], color: col });
    const dh = dotWithHalo([px, py, 0], col, 0.09, 0.21);
    const lb = T(pctText, P ? 16 : 15, col, true, true); lb.moveTo([crX0 + lxOff, py + lyOff, 0]);
    const sl = T(String(scVal), P ? 16 : 15, C.amber, true); sl.moveTo([px, crY0 + 0.16, 0]);
    return { g: new M.VGroup(vLine, hLine2, dh.g, lb, sl), dot: dh.dot };
  }

  // 25: Curve sends 1.1 to ~75%
  const sg0 = sCurvePoint(1.1, '75%', C.cyan, 0.42, -0.22);
  await until(S(25));
  await play(new M.FadeIn(sg0.g, { runTime: 0.8 }), new M.Flash(sg0.dot, { color: C.cyan, runTime: 0.7 }),
    ...say('SCORE 1.1 → ~75%', C.cyan));

  // 26: Add 1.1 to score for each extra reminder
  const sp1Pos = [sr2x(1), s2ly(2.2), 0];
  const scSeg01 = new M.Line({ start: sp0Pos, end: sp1Pos, color: C.amber, strokeWidth: 3.5 });
  const scStepH = new M.DashedLine({ start: sp0Pos, end: [sp1Pos[0], sp0Pos[1], 0], color: C.amber });
  const scStepV = new M.DashedLine({ start: [sp1Pos[0], sp0Pos[1], 0], end: sp1Pos, color: C.amber });
  const scPlus1 = T('+1', 16, C.muted, true); scPlus1.moveTo([(sp0Pos[0] + sp1Pos[0]) / 2, sp0Pos[1] - 0.28, 0]);
  const scPlus11 = T('+1.1', 16, C.amber, true, true); scPlus11.moveTo([sp1Pos[0] + 0.42, (sp0Pos[1] + sp1Pos[1]) / 2, 0]);
  const scLine01 = new M.VGroup(scSeg01, scStepH, scStepV, scPlus1, scPlus11);
  await until(S(26));
  await play(new M.FadeIn(scLine01, { runTime: 0.85 }), ...say('EACH REMINDER: +1.1 SCORE', C.amber));

  // 27: Amount added each time = slope
  const slpTag = T('slope', 15, C.violet, false, true); slpTag.moveTo([sp1Pos[0] + 0.48, (sp0Pos[1] + sp1Pos[1]) / 2 - 0.30, 0]);
  await until(S(27));
  await play(new M.FadeIn(slpTag, { runTime: 0.6 }), new M.Indicate(scPlus11, { color: C.violet, runTime: 0.7 }),
    ...say('SLOPE = +1.1 PER REMINDER', C.violet));

  // 28: 1 reminder gives score 2.2
  const sp1h = dotWithHalo(sp1Pos, C.amber, 0.11, 0.24);
  const sp1Lbl = T('2.2', 16, C.amber, true, true); sp1Lbl.moveTo([sp1Pos[0] - 0.36, sp1Pos[1] + 0.25, 0]);
  const sp1 = new M.VGroup(sp1h.g, sp1Lbl);
  await until(S(28));
  await play(new M.FadeOut(sg0.g, { runTime: 0.5 }), new M.FadeIn(sp1, { runTime: 0.65 }), new M.Flash(sp1h.dot, { color: C.amber, runTime: 0.65 }),
    ...say('1 REMINDER → SCORE 2.2', C.amber));

  // 29: Curve sends 2.2 to ~90%
  const sg1 = sCurvePoint(2.2, '90%', C.cyan, 1.05, -0.18);
  await until(S(29));
  await play(new M.FadeIn(sg1.g, { runTime: 0.8 }), new M.Flash(sg1.dot, { color: C.cyan, runTime: 0.7 }),
    ...say('SCORE 2.2 → ~90%', C.cyan));

  // 30: 2 reminders give score 3.3
  const sp2Pos = [sr2x(2), s2ly(3.3), 0];
  const scLine12 = new M.Line({ start: sp1Pos, end: sp2Pos, color: C.amber, strokeWidth: 3.5 });
  const sp2h = dotWithHalo(sp2Pos, C.amber, 0.11, 0.24);
  const sp2Lbl = T('3.3', 16, C.amber, true, true); sp2Lbl.moveTo([sp2Pos[0] - 0.36, sp2Pos[1] + 0.25, 0]);
  const sp2 = new M.VGroup(sp2h.g, sp2Lbl);
  await until(S(30));
  await play(new M.Create(scLine12, { runTime: 0.6 }), new M.FadeIn(sp2, { runTime: 0.65 }),
    new M.Flash(sp2h.dot, { color: C.amber, runTime: 0.65 }), ...say('2 REMINDERS → SCORE 3.3', C.amber));

  // 31: On the curve, ~96%
  const sg2 = sCurvePoint(3.3, '96%', C.green, 1.75, -0.16);
  await until(S(31));
  await play(new M.FadeIn(sg2.g, { runTime: 0.8 }), new M.Flash(sg2.dot, { color: C.green, runTime: 0.7 }),
    ...say('SCORE 3.3 → ~96% (STAYS ≤ 100%)', C.green));

  // ===========================================================================
  // ACT 4 (32–37): 1/0 marks -> mean = share; reverse rule = link function
  // ===========================================================================
  // 32: Mark each patient who comes with 1 and misses with 0 (10 patients: nine 1s, one 0 -> 90%)
  const pCX = P ? 0 : -2.6, pCY = P ? -1.4 : -0.25;
  const pDx = P ? 1.25 : 1.15, pDy = P ? 1.35 : 1.28;
  const pCircles = [];
  for (let k = 0; k < 10; k++) {
    const r = Math.floor(k / 5), c = k % 5;
    const x = pCX + (c - 2) * pDx, y = pCY + (0.5 - r) * pDy;
    const came = k < 9, col = came ? C.cyan : C.pink;
    const circ = new M.Circle({ radius: P ? 0.38 : 0.36, color: col, strokeWidth: 3 });
    circ.setFill(col, 0.22); circ.moveTo([x, y, 0]);
    const num = T(came ? '1' : '0', 22, col, true, true); num.moveTo([x, y, 0]);
    pCircles.push(new M.VGroup(circ, num));
  }
  const pLeg1 = T('1 = came', 17, C.cyan, true); pLeg1.moveTo([pCX - 1.1, pCY - pDy - 0.35, 0]);
  const pLeg0 = T('0 = missed', 17, C.pink, true); pLeg0.moveTo([pCX + 1.1, pCY - pDy - 0.35, 0]);
  const pLeg = new M.VGroup(pLeg1, pLeg0);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(
      scAxes, scYLab, sAxes, connArr, ...sSegs, sBounds, sp0, intTag, sg0.g, scLine01, slpTag, sp1, sg1.g, scLine12, sp2, sg2.g
    ), { runTime: 0.5 }),
    new M.LaggedStart(pCircles.map(g => new M.FadeIn(g, { runTime: 0.35 })), { lagRatio: 0.08, runTime: 1.0 }),
    new M.FadeIn(pLeg, { runTime: 0.6 }), ...say('COME = 1   ·   MISS = 0', C.cyan)
  );

  // 33: Share total equally across all patients = average, or mean
  const pFrame = new M.RoundedRectangle({ width: 5 * pDx + 0.35, height: 2 * pDy + 0.35, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 });
  pFrame.moveTo([pCX, pCY, 0]);
  await until(S(33));
  await play(new M.Create(pFrame, { runTime: 0.7 }),
    ...fbox(['total of marks = 9', 'patients       = 10', ['mean = 9 ÷ 10 = 0.90', C.amber]], C.amber),
    ...say('MEAN = TOTAL ÷ COUNT', C.amber));

  // 34: Only people who come add to total -> average = share who come
  await until(S(34));
  pCircles[9].submobjects[0].setFill(C.pink, 0.06);
  pCircles[9].submobjects[0].setStrokeOpacity(0.35);
  await play(
    new M.LaggedStart(pCircles.slice(0, 9).map(g => new M.Indicate(g, { color: C.green, runTime: 0.45 })), { lagRatio: 0.06, runTime: 1.1 }),
    ...fbox(['only 1s add to total', 'mean  = 9 ÷ 10 = 0.90', ['share = 90% who come', C.green]], C.green),
    ...say('MEAN OF 1s AND 0s = SHARE', C.green)
  );

  // 35: Curve turns score into prediction of the mean
  const bxL = P ? -2.0 : -3.2, bxR = P ? 2.0 : 3.2, bxY = P ? -1.4 : -0.35;
  const bw = P ? 2.5 : 3.1, bh = P ? 1.45 : 1.55;
  function nodeBox(cx, cy, title, sub, col) {
    const r = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.18, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([cx, cy, 0]);
    const t1 = T(title, P ? 20 : 22, col, false, true); t1.moveTo([cx, cy + 0.25, 0]);
    const t2 = T(sub, P ? 16 : 18, C.ink, true); t2.moveTo([cx, cy - 0.28, 0]);
    return new M.VGroup(r, t1, t2);
  }
  const boxScore = nodeBox(bxL, bxY, 'SCORE', '2.2', C.amber);
  const boxMean = nodeBox(bxR, bxY, 'MEAN', '0.90 (90%)', C.cyan);
  const fwdY = bxY + 0.45;
  const arrFwdLine = makeArrow([bxL + bw / 2 + 0.15, fwdY, 0], [bxR - bw / 2 - 0.15, fwdY, 0], C.cyan, 3.5);
  const fwdLbl = T('S-curve', P ? 15 : 17, C.cyan, false, true); fwdLbl.moveTo([0, fwdY + 0.35, 0]);
  const arrFwd = new M.VGroup(arrFwdLine, fwdLbl);

  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(...pCircles, pLeg, pFrame), { runTime: 0.5 }), ...clearBox(),
    new M.FadeIn(boxScore, { runTime: 0.6 }), new M.FadeIn(boxMean, { runTime: 0.6 }),
    new M.FadeIn(arrFwd, { runTime: 0.7 }), ...say('CURVE: SCORE → PREDICTED MEAN', C.cyan));

  // 36: Rule in reverse, from mean back to score
  const revY = bxY - 0.45;
  const arrRev = makeArrow([bxR - bw / 2 - 0.15, revY, 0], [bxL + bw / 2 + 0.15, revY, 0], C.violet, 3.5);
  const revLbl = T('reverse', P ? 15 : 17, C.violet); revLbl.moveTo([0, revY - 0.35, 0]);
  await until(S(36));
  await play(new M.FadeIn(arrRev, { runTime: 0.7 }), new M.FadeIn(revLbl, { runTime: 0.6 }),
    ...say('REVERSE: MEAN → SCORE', C.violet));

  // 37: Called the link function
  const linkBadge = pill('LINK FUNCTION', C.violet, P ? 16 : 18); linkBadge.moveTo([0, revY - 0.55, 0]);
  await until(S(37));
  await play(new M.FadeOut(revLbl, { runTime: 0.35 }), new M.FadeIn(linkBadge, { runTime: 0.65 }),
    new M.Indicate(arrRev, { color: C.violet, runTime: 0.7 }), ...say('LINK FUNCTION: MEAN → SCORE', C.violet));

  // ===========================================================================
  // ACT 5 (38–45): Outcome, Predictor, Model, GLM 3 parts, Score Line Formula
  // ===========================================================================
  // 38: Thing we want to predict = outcome (short beat: 2.43s)
  const oX = P ? 0 : 3.5, oY = P ? -3.1 : -0.35;
  const oBox = new M.RoundedRectangle({ width: P ? 5.6 : 3.7, height: P ? 1.8 : 2.15, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  oBox.setFill(C.card, 0.95); oBox.moveTo([oX, oY, 0]);
  const oT1 = T('OUTCOME', 20, C.cyan, false, true); oT1.moveTo([oX, oY + (P ? 0.50 : 0.65), 0]);
  const oT2 = T('what we predict', 15, C.muted); oT2.moveTo([oX, oY + (P ? 0.12 : 0.22), 0]);
  const outCard = new M.VGroup(oBox, oT1, oT2);
  // faint placeholder where the predictor card will come (frame is not left with one lonely box)
  const ghX = P ? 0 : -3.7, ghY = P ? 0.45 : -0.35;
  const ghBox = new M.RoundedRectangle({ width: P ? 5.6 : 3.7, height: P ? 1.65 : 2.15, cornerRadius: 0.18, color: C.muted, strokeWidth: 1.5 });
  ghBox.setFill(C.card, 0.4); ghBox.moveTo([ghX, ghY, 0]);
  const ghQ = T('?', 34, C.muted, false, true); ghQ.moveTo([ghX, ghY, 0]);
  const ghost = new M.VGroup(ghBox, ghQ);

  await until(S(38));
  await play(new M.FadeOut(new M.VGroup(boxScore, boxMean, arrFwd, arrRev, linkBadge), { runTime: 0.45 }),
    new M.FadeIn(outCard, { runTime: 0.7 }), new M.FadeIn(ghost, { runTime: 0.7 }), ...say('OUTCOME = WHAT WE PREDICT', C.cyan));

  // 39: Outcome has only two answers: come or miss
  const cB = pill('COME (1)', C.cyan, 15); cB.moveTo([oX - (P ? 1.15 : 0.85), oY - (P ? 0.42 : 0.48), 0]);
  const mB = pill('MISS (0)', C.pink, 15); mB.moveTo([oX + (P ? 1.15 : 0.85), oY - (P ? 0.42 : 0.48), 0]);
  const outChoices = new M.VGroup(cB, mB);
  await until(S(39));
  await play(new M.FadeIn(outChoices, { runTime: 0.75 }), ...say('TWO ANSWERS: COME OR MISS', C.cyan));

  // 40: Reminder count = predictor
  const prX = P ? 0 : -3.7, prY = P ? 0.45 : -0.35;
  const prBox = new M.RoundedRectangle({ width: P ? 5.6 : 3.7, height: P ? 1.65 : 2.15, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.5 });
  prBox.setFill(C.card, 0.95); prBox.moveTo([prX, prY, 0]);
  const prT1 = T('PREDICTOR', 20, C.amber, false, true); prT1.moveTo([prX, prY + (P ? 0.42 : 0.62), 0]);
  const prT2 = T('Reminders: 0, 1, 2', 16, C.ink, true); prT2.moveTo([prX, prY - (P ? 0.05 : 0.05), 0]);
  const prT3 = T('fact we use', 15, C.muted); prT3.moveTo([prX, prY - (P ? 0.48 : 0.55), 0]);
  const predCard = new M.VGroup(prBox, prT1, prT2, prT3);
  await until(S(40));
  await play(new M.FadeOut(ghost, { runTime: 0.4 }), new M.FadeIn(predCard, { runTime: 0.75 }), ...say('PREDICTOR = REMINDER COUNT', C.amber));

  // 41: A model is a rule for making predictions
  const mdY = P ? -1.3 : -0.35;
  const mdPill = pill('MODEL = RULE', C.green, P ? 17 : 18); mdPill.moveTo([0, mdY, 0]);
  const mdA1 = P
    ? makeArrow([0, prY - 0.88, 0], [0, mdY + 0.36, 0], C.green, 3)
    : makeArrow([prX + 1.95, mdY, 0], [-1.35, mdY, 0], C.green, 3);
  const mdA2 = P
    ? makeArrow([0, mdY - 0.36, 0], [0, oY + 0.98, 0], C.green, 3)
    : makeArrow([1.35, mdY, 0], [oX - 1.95, mdY, 0], C.green, 3);
  const modMid = new M.VGroup(mdPill, mdA1, mdA2);
  await until(S(41));
  await play(new M.FadeIn(modMid, { runTime: 0.75 }), ...say('MODEL = RULE FOR PREDICTIONS', C.green));

  // 42: GLM combines outcome type, score line, and link function
  function partCard(cx, cy, w, h, num, title, sub, col, iconFn) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([cx, cy, 0]);
    const t1 = T(num + '. ' + title, P ? 18 : 19, col, false, true);
    t1.moveTo([P ? cx - 1.15 : cx, P ? cy + 0.25 : cy + 0.85, 0]);
    const t2 = T(sub, P ? 15 : 15, C.muted);
    t2.moveTo([P ? cx - 1.15 : cx, P ? cy - 0.25 : cy - 0.95, 0]);
    const ic = iconFn(P ? cx + 1.8 : cx, P ? cy : cy - 0.05);
    return new M.VGroup(r, t1, t2, ic);
  }
  const gw = P ? 6.6 : 3.7, gh = P ? 1.65 : 2.8;
  const gPos = P ? [[0, 0.45], [0, -1.55], [0, -3.55]] : [[-4.25, -0.45], [0, -0.45], [4.25, -0.45]];
  const glm1 = partCard(gPos[0][0], gPos[0][1], gw, gh, '1', 'Outcome type', 'come or miss', C.cyan, (x, y) => new M.VGroup(
    new M.Dot({ point: [x - 0.35, y, 0], radius: 0.14, color: C.cyan }),
    new M.Dot({ point: [x + 0.35, y, 0], radius: 0.14, color: C.pink })
  ));
  const glm2 = partCard(gPos[1][0], gPos[1][1], gw, gh, '2', 'Score line', 'straight ruler', C.amber, (x, y) => new M.VGroup(
    new M.Line({ start: [x - 0.75, y - 0.35, 0], end: [x + 0.75, y + 0.35, 0], color: C.amber, strokeWidth: 3.5 }),
    new M.Dot({ point: [x - 0.5, y - 0.23, 0], radius: 0.08, color: C.amber }),
    new M.Dot({ point: [x + 0.5, y + 0.23, 0], radius: 0.08, color: C.amber })
  ));
  const glm3 = partCard(gPos[2][0], gPos[2][1], gw, gh, '3', 'Link function', 'mean ↔ score', C.violet, (x, y) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const s = -3.5 + (i / 16) * 7;
      pts.push([x - 0.7 + (i / 16) * 1.4, y - 0.38 + sig(s) * 0.76, 0]);
    }
    return new M.VGroup(...curveSegs(pts, C.violet, 3));
  });

  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(outCard, outChoices, predCard, modMid), { runTime: 0.5 }),
    new M.LaggedStart([glm1, glm2, glm3].map(g => new M.FadeIn(g, { runTime: 0.55 })), { lagRatio: 0.25, runTime: 1.1 }),
    ...say('GLM = 3 PARTS COMBINED', C.cyan));

  // 43: Linear = score follows a straight line
  const glm2Hi = new M.RoundedRectangle({ width: gw + 0.18, height: gh + 0.18, cornerRadius: 0.20, color: C.amber, strokeWidth: 4 });
  glm2Hi.moveTo([gPos[1][0], gPos[1][1], 0]);
  await until(S(43));
  await play(new M.Create(glm2Hi, { runTime: 0.65 }), new M.Indicate(glm2, { color: C.amber, runTime: 0.8 }),
    ...say('LINEAR = STRAIGHT SCORE LINE', C.amber));

  // 44: Rule for the score line (clean left/bottom visual ready for fbox)
  const mlX0 = P ? -2.4 : -5.4, mlX1 = P ? 2.6 : 1.1;
  const mlY0 = P ? -3.8 : -2.1, mlY1 = P ? 0.6 : 1.05;
  const mlx = r => mlX0 + 0.7 + r * (P ? 1.85 : 2.3);
  const mly = s => mlY0 + (s / 4.0) * (mlY1 - mlY0);
  const mlAx = new M.VGroup(
    new M.Line({ start: [mlX0, mlY0, 0], end: [mlX1, mlY0, 0], color: C.muted, strokeWidth: 2.5 }),
    new M.Line({ start: [mlX0, mlY0, 0], end: [mlX0, mlY1, 0], color: C.amber, strokeWidth: 2.5 }),
    ...[0, 1, 2].map(r => T(String(r), 16, C.muted, true).moveTo([mlx(r), mlY0 - 0.3, 0])),
    T('Predictor (reminders)', 15, C.muted).moveTo([(mlX0 + mlX1) / 2, mlY0 - 0.68, 0]),
    T('Score', 16, C.amber, false, true).moveTo([mlX0 + 0.45, mlY1 + 0.24, 0])
  );
  const mlP0 = [mlx(0), mly(1.1), 0], mlP1 = [mlx(1), mly(2.2), 0], mlP2 = [mlx(2), mly(3.3), 0];
  const mlLine = new M.Line({ start: mlP0, end: mlP2, color: C.amber, strokeWidth: 4 });
  const mlDots = [mlP0, mlP1, mlP2].map(p => new M.Dot({ point: p, radius: 0.11, color: C.amber }));
  const mlInt = T('intercept = 1.1', 15, C.violet, true); mlInt.moveTo([mlP0[0] + 1.15, mlP0[1] - 0.32, 0]);
  const mlSlp = T('slope = +1.1', 15, C.cyan, true); mlSlp.moveTo([mlP1[0] + 0.95, mlP1[1] - 0.32, 0]);
  const miniScore = new M.VGroup(mlAx, mlLine, ...mlDots, mlInt, mlSlp);

  await until(S(44));
  await play(new M.FadeOut(new M.VGroup(glm1, glm2, glm3, glm2Hi), { runTime: 0.45 }),
    new M.FadeIn(miniScore, { runTime: 0.75 }), ...say('RULE FOR THE SCORE LINE', C.amber));

  // 45: Score equals intercept plus slope times the predictor
  await until(S(45));
  await play(
    ...fbox([
      ['score = intercept', C.amber],
      ['        + slope × predictor', C.amber],
      ['      = 1.1 + 1.1 × reminders', C.cyan]
    ], C.amber),
    ...say('SCORE = INTERCEPT + SLOPE × PREDICTOR', C.amber)
  );

  // ===========================================================================
  // ACT 6 (46–49): Outcome type chooses the translation (S, Growth, Identity)
  // ===========================================================================
  const cW = P ? 6.8 : 3.85, cH = P ? 1.95 : 3.25;
  const cPos = P ? [[0, 0.55], [0, -1.75], [0, -4.05]] : [[-4.25, -0.55], [0, -0.55], [4.25, -0.55]];

  function transCard(cx, cy, title, ex, rangeTxt, col, drawFn) {
    const bg = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    bg.setFill(C.card, 0.95); bg.moveTo([cx, cy, 0]);
    const tx = P ? cx - 1.55 : cx;
    const t1 = T(title, P ? 18 : 19, col, false, true); t1.moveTo([tx, P ? cy + 0.52 : cy + 1.25, 0]);
    const t2 = T(ex, P ? 15 : 15, C.ink); t2.moveTo([tx, P ? cy + 0.02 : cy + 0.84, 0]);
    const t3 = T(rangeTxt, P ? 14 : 14, C.muted, true); t3.moveTo([tx, P ? cy - 0.50 : cy - 1.28, 0]);
    const px = P ? cx + 1.75 : cx, py = P ? cy : cy - 0.22;
    const pw = P ? 2.45 : 2.9, ph = P ? 1.35 : 1.55;
    const xAx = new M.Line({ start: [px - pw / 2, py - ph / 2, 0], end: [px + pw / 2, py - ph / 2, 0], color: C.muted, strokeWidth: 1.5 });
    const yAx = new M.Line({ start: [px - pw / 2, py - ph / 2, 0], end: [px - pw / 2, py + ph / 2, 0], color: C.muted, strokeWidth: 1.5 });
    const shape = drawFn(px, py, pw, ph);
    return new M.VGroup(bg, t1, t2, t3, xAx, yAx, shape);
  }

  // 46: Outcome type chooses translation — Card 1: Yes/No -> S-curve
  const cardBin = transCard(cPos[0][0], cPos[0][1], 'Yes / No', 'come or miss', '0% to 100%', C.cyan, (px, py, pw, ph) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const s = -4 + (i / 20) * 8;
      pts.push([px - pw / 2 + (i / 20) * pw, py - ph / 2 + 0.1 + sig(s) * (ph - 0.2), 0]);
    }
    const topL = new M.DashedLine({ start: [px - pw / 2, py + ph / 2 - 0.1, 0], end: [px + pw / 2, py + ph / 2 - 0.1, 0], color: C.grid });
    return new M.VGroup(topL, ...curveSegs(pts, C.cyan, 3));
  });
  await until(S(46));
  await play(new M.FadeOut(miniScore, { runTime: 0.45 }), ...clearBox(),
    new M.FadeIn(cardBin, { runTime: 0.75 }), ...say('OUTCOME TYPE → TRANSLATION', C.cyan));

  // 47: Count (visits per year) -> growth curve (keeps mean > 0)
  const cardCnt = transCard(cPos[1][0], cPos[1][1], 'Count', 'visits per year', 'always > 0', C.green, (px, py, pw, ph) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const val = (Math.exp(2.6 * u) - 1) / (Math.exp(2.6) - 1);
      pts.push([px - pw / 2 + u * pw, py - ph / 2 + 0.12 + val * (ph - 0.24), 0]);
    }
    const zeroL = new M.DashedLine({ start: [px - pw / 2, py - ph / 2 + 0.08, 0], end: [px + pw / 2, py - ph / 2 + 0.08, 0], color: C.green });
    return new M.VGroup(zeroL, ...curveSegs(pts, C.green, 3));
  });
  await until(S(47));
  await play(new M.FadeIn(cardCnt, { runTime: 0.8 }), ...say('COUNT → GROWTH CURVE (> 0)', C.green));

  // 48: Measurement (change in weight) -> score itself gives predicted mean
  const cardMsr = transCard(cPos[2][0], cPos[2][1], 'Measurement', 'weight change', 'mean = score', C.amber, (px, py, pw, ph) => {
    return new M.Line({ start: [px - pw / 2 + 0.1, py - ph / 2 + 0.1, 0], end: [px + pw / 2 - 0.1, py + ph / 2 - 0.1, 0], color: C.amber, strokeWidth: 3.5 });
  });
  await until(S(48));
  await play(new M.FadeIn(cardMsr, { runTime: 0.8 }), ...say('MEASUREMENT → MEAN = SCORE', C.amber));

  // 49: Leaves mean as it is -> identity link
  const idOutline = new M.RoundedRectangle({ width: cW + 0.18, height: cH + 0.18, cornerRadius: 0.20, color: C.violet, strokeWidth: 3.5 });
  idOutline.moveTo([cPos[2][0], cPos[2][1], 0]);
  const idTag = pill('IDENTITY LINK', C.violet, 15);
  idTag.moveTo([cPos[2][0], cPos[2][1] - (P ? cH / 2 + 0.34 : cH / 2 + 0.40), 0]);
  const idHi = new M.VGroup(idOutline, idTag);
  await until(S(49));
  await play(new M.Create(idOutline, { runTime: 0.65 }), new M.FadeIn(idTag, { runTime: 0.6 }),
    ...say('IDENTITY LINK = NO CHANGE', C.violet));

  // ===========================================================================
  // ACT 7 (50–52): Common Trap (smaller rise near top of S) + Final Recap
  // ===========================================================================
  const tx0 = P ? -2.75 : -5.5, tx1 = P ? 3.2 : 1.7;
  const ty0 = P ? -4.3 : -2.35, ty1 = P ? 1.1 : 1.25;
  const ts2x = s => tx0 + ((s + 2.5) / 6.8) * (tx1 - tx0);
  const tp2y = p => ty0 + p * (ty1 - ty0);

  const trapXAx = new M.Line({ start: [tx0, ty0, 0], end: [tx1, ty0, 0], color: C.muted, strokeWidth: 2.5 });
  const trapYAx = new M.Line({ start: [tx0, ty0, 0], end: [tx0, ty1, 0], color: C.muted, strokeWidth: 2.5 });
  const trapTop = new M.DashedLine({ start: [tx0, tp2y(1), 0], end: [tx1, tp2y(1), 0], color: C.muted });
  const trapYT = [0, 0.5, 1].map(v => T(Math.round(v * 100) + '%', 14, C.muted, true).moveTo([tx0 - 0.42, tp2y(v), 0]));
  const trapSL = T('Score', 15, C.amber); trapSL.moveTo([(tx0 + tx1) / 2, ty0 - 0.65, 0]);
  const trapAxes = new M.VGroup(trapXAx, trapYAx, trapTop, ...trapYT, trapSL);

  const trapPts = [];
  for (let i = 0; i <= 36; i++) {
    const s = -2.5 + (i / 36) * 6.8;
    trapPts.push([ts2x(s), tp2y(sig(s)), 0]);
  }
  const trapSegs = curveSegs(trapPts, C.cyan, 3.5);

  // Two equal score steps: 1.1 -> 2.2 (+1.1) and 2.2 -> 3.3 (+1.1)
  const sx1 = ts2x(1.1), sx2 = ts2x(2.2), sx3 = ts2x(3.3);
  const sy1 = tp2y(sig(1.1)), sy2 = tp2y(sig(2.2)), sy3 = tp2y(sig(3.3));
  const st1 = new M.Line({ start: [sx1, ty0 + 0.08, 0], end: [sx2, ty0 + 0.08, 0], color: C.amber, strokeWidth: 4 });
  const st2 = new M.Line({ start: [sx2, ty0 + 0.08, 0], end: [sx3, ty0 + 0.08, 0], color: C.pink, strokeWidth: 4 });
  const stL1 = T('+1.1', 14, C.amber, true, true); stL1.moveTo([(sx1 + sx2) / 2, ty0 - 0.24, 0]);
  const stL2 = T('+1.1', 14, C.pink, true, true); stL2.moveTo([(sx2 + sx3) / 2, ty0 - 0.24, 0]);
  const td1 = new M.Dot({ point: [sx1, sy1, 0], radius: 0.09, color: C.amber });
  const td2 = new M.Dot({ point: [sx2, sy2, 0], radius: 0.09, color: C.amber });
  const td3 = new M.Dot({ point: [sx3, sy3, 0], radius: 0.09, color: C.pink });
  const trapSteps = new M.VGroup(st1, st2, stL1, stL2, td1, td2, td3);

  // 50: One trap is reading a score change as a change in the share
  await until(S(50));
  await play(new M.FadeOut(new M.VGroup(cardBin, cardCnt, cardMsr, idHi), { runTime: 0.45 }),
    new M.FadeIn(trapAxes, { runTime: 0.6 }),
    new M.LaggedStart(trapSegs.map(s => new M.Create(s, { runTime: 0.22 })), { lagRatio: 0.06, runTime: 0.85 }),
    new M.FadeIn(trapSteps, { runTime: 0.6 }), ...say('TRAP: SCORE STEP ≠ SHARE STEP', C.pink));

  // 51: Same score step gives a smaller rise near top of the S
  const rH1 = new M.DashedLine({ start: [sx1, sy1, 0], end: [sx2, sy1, 0], color: C.amber });
  const rV1 = new M.Line({ start: [sx2, sy1, 0], end: [sx2, sy2, 0], color: C.cyan, strokeWidth: 5 });
  const rT1 = T('+15%', 16, C.cyan, true, true); rT1.moveTo([sx2 + 0.50, (sy1 + sy2) / 2 - 0.06, 0]);
  const rH2 = new M.DashedLine({ start: [sx2, sy2, 0], end: [sx3, sy2, 0], color: C.pink });
  const rV2 = new M.Line({ start: [sx3, sy2, 0], end: [sx3, sy3, 0], color: C.pink, strokeWidth: 5 });
  const rT2 = T('+6%', 16, C.pink, true, true); rT2.moveTo([sx3 + 0.45, (sy2 + sy3) / 2 + 0.05, 0]);
  const trapRises = new M.VGroup(rH1, rV1, rT1, rH2, rV2, rT2);

  await until(S(51));
  await play(new M.FadeIn(trapRises, { runTime: 0.8 }),
    ...fbox([
      ['Same score step: +1.1', C.amber],
      ['1.1 → 2.2 : +15% share', C.cyan],
      ['2.2 → 3.3 :  +6% share', C.pink]
    ], C.pink),
    ...say('SMALLER RISE NEAR TOP OF S', C.pink));

  // 52: Recap — straight score line + translation suited to outcome
  const rcL = P ? [0, -0.2] : [-3.3, -0.45], rcR = P ? [0, -3.5] : [3.2, -0.45];
  const rcW = P ? 6.4 : 4.8, rcH = P ? 2.25 : 2.95;

  const leftCard = new M.RoundedRectangle({ width: rcW, height: rcH, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.5 });
  leftCard.setFill(C.card, 0.95); leftCard.moveTo([rcL[0], rcL[1], 0]);
  const lT1 = T('1. Straight score line', 19, C.amber, false, true); lT1.moveTo([rcL[0], rcL[1] + rcH / 2 - 0.36, 0]);
  const lLine = new M.Line({ start: [rcL[0] - 1.5, rcL[1] - 0.25, 0], end: [rcL[0] + 1.5, rcL[1] + 0.42, 0], color: C.amber, strokeWidth: 4 });
  const lEq = T('intercept + slope × predictor', P ? 15 : 15, C.ink, true); lEq.moveTo([rcL[0], rcL[1] - rcH / 2 + 0.36, 0]);

  const rightCard = new M.RoundedRectangle({ width: rcW, height: rcH, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
  rightCard.setFill(C.card, 0.95); rightCard.moveTo([rcR[0], rcR[1], 0]);
  const rT1b = T('2. Right translation', 19, C.green, false, true); rT1b.moveTo([rcR[0], rcR[1] + rcH / 2 - 0.36, 0]);
  const rRow1 = T('Yes / No     → S-curve (0%–100%)', 14, C.cyan, true); rRow1.moveTo([rcR[0], rcR[1] + 0.18, 0]);
  const rRow2 = T('Count        → Growth (> 0)', 14, C.green, true); rRow2.moveTo([rcR[0], rcR[1] - 0.26, 0]);
  const rRow3 = T('Measurement  → Identity (as is)', 14, C.amber, true); rRow3.moveTo([rcR[0], rcR[1] - 0.70, 0]);

  const rcArr = P
    ? makeArrow([0, rcL[1] - rcH / 2 - 0.12, 0], [0, rcR[1] + rcH / 2 + 0.12, 0], C.green, 3.5)
    : makeArrow([rcL[0] + rcW / 2 + 0.18, rcL[1], 0], [rcR[0] - rcW / 2 - 0.18, rcR[1], 0], C.green, 3.5);
  const recapGroup = new M.VGroup(leftCard, lT1, lLine, lEq, rightCard, rT1b, rRow1, rRow2, rRow3, rcArr);

  await until(S(52));
  await play(new M.FadeOut(new M.VGroup(trapAxes, ...trapSegs, trapSteps, trapRises), { runTime: 0.5 }), ...clearBox(),
    new M.FadeIn(recapGroup, { runTime: 0.95 }), ...say('STRAIGHT SCORE LINE + RIGHT TRANSLATION', C.green));
}
