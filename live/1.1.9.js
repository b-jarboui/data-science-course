// 1.1.9 From question to quantity: how busy are we? (live version of lessons/1.1.9/scene.py).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TODAY = [5, 11, 20, 26, 40, 52];
  const TIMES = ['8:05', '8:11', '8:20', '8:26', '8:40', '8:52'];
  const DRINK = ['coffee', 'tea', 'coffee', 'juice', 'coffee', 'tea'];
  const YEST = [5, 20, 35, 50, 70, 90, 115, 140, 165];

  const U = P ? 2.3 : 3.6;
  const X0 = -1.5 * U;
  const YT = P ? 1.55 : 0.25;
  const YY = P ? -4.0 : -2.0;
  const R = P ? 0.11 : 0.11;
  const GX = P ? 0.46 : 0.48, GY = 0.32, SEG_H = 1.18;
  const PILL = P ? [0, 3.9, 0] : [0, 1.98, 0];
  let BOXP = P ? [0, -4.3, 0] : [3.75, 0.4, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const px = (m, y) => [X0 + U * m / 60, y + 0.28, 0];
  const gpos = (h, k, y) => [X0 + U * (h + 0.5) + (k % 3 - 1) * GX, y + 0.28 + Math.floor(k / 3) * GY, 0];

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 5.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const mkHalo = (p, color) => { const h = new M.Dot({ point: p, radius: R * 2.2, color }); h.setFill(color, 0.18); return h; };
  const mkCore = (p, color) => { const d = new M.Dot({ point: p, radius: R, color }); d.setFill(color, 1); return d; };
  const mkDot = (p, color) => ({ halo: mkHalo(p, color), core: mkCore(p, color) });
  const setDotColor = (d, color) => {
    d.halo.setColor(color); d.halo.setFill(color, 0.18);
    d.core.setColor(color); d.core.setFill(color, 1);
  };
  const moveDot = (d, p, color, pathArc = 0) => {
    const opts = pathArc ? { pathArc } : undefined;
    return new M.LaggedStart([
      new M.Transform(d.halo, mkHalo(p, color), opts),
      new M.Transform(d.core, mkCore(p, color), opts)
    ], { lagRatio: 0 });
  };

  function tline(hours, y, color) {
    const ln = new M.Line({ start: [X0, y, 0], end: [X0 + U * hours, y, 0], color, strokeWidth: 3 });
    const parts = [ln];
    for (let k = 0; k <= hours; k++) {
      const x = X0 + U * k;
      parts.push(new M.Line({ start: [x, y - 0.08, 0], end: [x, y + 0.08, 0], color, strokeWidth: 3 }));
      const lab = T(`${8 + k}:00`, P ? 15 : 17, C.muted, true); lab.moveTo([x, y - 0.34, 0]);
      parts.push(lab);
    }
    return new M.VGroup(...parts);
  }

  function spanBar(x1, x2, y, color) {
    const h = 0.14;
    return new M.VGroup(
      new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 2.5 }),
      new M.Line({ start: [x1, y, 0], end: [x1, y - h, 0], color, strokeWidth: 2.5 }),
      new M.Line({ start: [x2, y, 0], end: [x2, y - h, 0], color, strokeWidth: 2.5 })
    );
  }

  function segRect(h, y, color) {
    const r = new M.RoundedRectangle({ width: U - 0.14, height: SEG_H, cornerRadius: 0.1, color, strokeWidth: 1.5 });
    r.setFill(color, 0.06); r.moveTo([X0 + U * (h + 0.5), y + SEG_H / 2, 0]);
    return r;
  }

  function person(x, y, s = 0.72, color = C.muted) {
    const head = new M.Circle({ radius: 0.14 * s, color }); head.setFill(color, 1); head.moveTo([x, y + 0.36 * s, 0]);
    const body = new M.Arc({ radius: 0.26 * s, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y + 0.02 * s, 0]);
    return new M.VGroup(head, body);
  }

  // 0-4. the question, a feeling, something to count
  const cupY = P ? -0.9 : -0.15;
  const kc = P ? 2.2 : 1.3; // size of the cup picture
  const cupBody = new M.RoundedRectangle({ width: 1.0 * kc, height: 1.1 * kc, cornerRadius: 0.12, color: C.amber, strokeWidth: 3 });
  cupBody.setFill(C.card, 0.9); cupBody.moveTo([0, cupY, 0]);
  const cupHandle = new M.Arc({ radius: 0.25 * kc, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  cupHandle.moveTo([0.625 * kc, cupY, 0]);
  const steam = [-0.22, 0, 0.22].map(dx => new M.Line({ start: [dx * kc, cupY + 0.7 * kc, 0], end: [(dx + 0.04) * kc, cupY + 1.1 * kc, 0], color: C.muted, strokeWidth: 2.5 }));
  const cup = new M.VGroup(cupBody, cupHandle, ...steam);
  await until(S(0)); await play(new M.FadeIn(cup), ...say('THE SMALL CAFÉ'));
  await until(S(1)); await play(new M.Indicate(cupBody, { color: C.amber }), ...say('“HOW BUSY WERE WE?”', C.amber),
    ...fbox(['the manager asks:', ['how busy were we?', C.amber]], C.amber));

  const feelY = cupY - 0.55 * kc - 0.65;
  const feel = T('“quite busy”', 30, C.muted); feel.moveTo([0, feelY, 0]);
  await until(S(2)); await play(new M.FadeIn(feel), ...say('A FEELING, NOT A NUMBER', C.muted));

  const fw = feel.getWidth() / 2 + 0.15, fh = 0.26;
  const cross1 = new M.Line({ start: [-fw, feelY - fh, 0], end: [fw, feelY + fh, 0], color: C.pink, strokeWidth: 4 });
  const cross2 = new M.Line({ start: [-fw, feelY + fh, 0], end: [fw, feelY - fh, 0], color: C.pink, strokeWidth: 4 });
  await until(S(3)); await play(new M.Create(cross1), new M.Create(cross2), ...say('CAN’T COMPARE A FEELING', C.pink));
  await until(S(4)); await play(new M.FadeOut(new M.VGroup(feel, cross1, cross2)), ...say('SOMETHING WE CAN COUNT', C.green),
    ...fbox(['turn the question into', ['a number we can count', C.green]], C.green));

  // 5-6. the notebook: one row = one order, each with a time
  const rh = P ? 0.72 : 0.42, cw = P ? [1.6, 1.9, 2.3] : [1.4, 1.7, 2.0];
  const heads = ['order', 'time', 'drink'];
  const rows = TIMES.map((tm, i) => [String(i + 1), tm, DRINK[i]]);
  const tw = cw[0] + cw[1] + cw[2], ttop = P ? 2.05 : 1.25;
  const colCenter = c => -tw / 2 + cw.slice(0, c).reduce((a, b) => a + b, 0) + cw[c] / 2;
  const rowCenter = r => ttop - rh * (r + 0.5);

  const card = new M.RoundedRectangle({ width: tw + 0.3, height: rh * 7 + 0.3, cornerRadius: 0.15, color: C.cyan, strokeWidth: 2 });
  card.setFill(C.card, 0.95); card.moveTo([0, ttop - rh * 3.5, 0]);
  const hdr = new M.Rectangle({ width: tw, height: rh, color: C.cyan, strokeWidth: 0 });
  hdr.setFill(C.cyan, 0.22); hdr.moveTo([0, rowCenter(0), 0]);
  const mkCell = (s, r, c, col = C.ink) => { const t = T(s, P ? 22 : 20, col, true); t.moveTo([colCenter(c), rowCenter(r), 0]); return t; };
  const hcells = new M.VGroup(...heads.map((h, c) => mkCell(h, 0, c, C.cyan)));
  const rcells = rows.map((row, r) => new M.VGroup(...row.map((v, c) => mkCell(v, r + 1, c))));

  await until(S(5));
  // laptop: the table is centred, so the side card would cover it
  const sideAway = [];
  if (!P && boxNow) { sideAway.push(new M.FadeOut(boxNow)); boxNow = null; }
  await play(...sideAway, new M.FadeOut(cup), new M.FadeIn(card), new M.FadeIn(hdr), new M.FadeIn(hcells),
    ...rcells.map(r => new M.FadeIn(r)), ...say('OUR NOTEBOOK: 1 ROW = 1 ORDER'));
  await play(new M.LaggedStart(rcells.map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.35, runTime: 2.8 }));

  const tcol = new M.RoundedRectangle({ width: cw[1] + 0.08, height: rh * 7 + 0.06, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.5 });
  tcol.moveTo([colCenter(1), ttop - rh * 3.5, 0]);
  await until(S(6)); await play(new M.Create(tcol), ...say('EACH ORDER HAS A TIME', C.amber));

  // 7. orders become dots on a time line, 8 to 9
  const tl = tline(1, YT, C.muted);
  const dots = TODAY.map((_, i) => mkDot([colCenter(1), rowCenter(i + 1), 0], C.cyan));
  await until(S(7));
  await play(new M.FadeOut(new M.VGroup(card, hdr, hcells, ...rcells, tcol)), new M.FadeIn(tl),
    ...dots.flatMap(d => [new M.FadeIn(d.halo), new M.FadeIn(d.core)]), ...say('ONE DOT PER ORDER: 8:00 → 9:00'));
  await play(new M.LaggedStart(dots.map((d, i) => moveDot(d, px(TODAY[i], YT), C.cyan, -0.4)), { lagRatio: 0.14, runTime: 2.2 }));

  // 8-10. what do we count, quantity, over how long
  await until(S(8));
  await play(new M.LaggedStart(dots.map(d => new M.Indicate(d.core, { color: C.amber })), { lagRatio: 0.15, runTime: 2.0 }),
    ...say('WHAT DO WE COUNT? ORDERS', C.amber));
  await until(S(9));
  await play(...fbox(['quantity =', ['number of orders', C.amber]]), ...say('QUANTITY = WHAT WE COUNT', C.green));

  const hbY = YT + (P ? 0.82 : 0.84);
  const hb = spanBar(X0, X0 + U, hbY, C.violet);
  const hbl = T('1 hour', 18, C.violet); hbl.moveTo([X0 + U * 0.5, hbY + 0.25, 0]);
  await until(S(10)); await play(new M.FadeIn(hb), new M.FadeIn(hbl), ...say('OVER HOW LONG? 1 HOUR', C.violet));

  // 11-12. count the dots
  const nums = TODAY.map((m, k) => {
    const p = px(m, YT), t = T(String(k + 1), P ? 16 : 17, C.amber, true);
    t.moveTo([p[0], p[1] + (P ? 0.34 : 0.36) + (k % 2) * 0.3, 0]); return t;
  });
  await until(S(11));
  await play(new M.LaggedStart([new M.FadeOut(new M.VGroup(hb, hbl)), ...say('COUNT THE DOTS', C.amber)], { lagRatio: 0, runTime: 0.5 }));
  const step = Math.min(0.65, (E(11) - S(11) - 0.7) / 6);
  for (let k = 0; k < 6; k++) {
    setDotColor(dots[k], C.amber);
    await play(new M.LaggedStart([
      new M.FadeIn(nums[k]), new M.Flash(dots[k].core, { color: C.amber }),
      ...fbox(['number of orders', [String(k + 1), C.amber]])
    ], { lagRatio: 0, runTime: step }));
  }
  await until(S(12)); await play(...fbox(['today:', ['6 orders in 1 hour', C.amber]]), ...say('6 ORDERS IN 1 HOUR', C.amber));

  // 13. yesterday's notebook: nine dots over three hours
  const yl = tline(3, YY, C.muted);
  const ydots = YEST.map(m => mkDot(px(m, YY), C.pink));
  const tagT = pill('TODAY', C.cyan, P ? 15 : 16);
  tagT.moveTo(P ? [X0 + U + 0.95, YT, 0] : [X0 + U * 0.5, YT - 0.52, 0]);
  const tagY = pill('YESTERDAY', C.pink, P ? 15 : 16);
  tagY.moveTo(P ? [X0 + 1.05, YY - 0.95, 0] : [X0 + U * 0.5, YY - 0.56, 0]);

  await until(S(13));
  dots.forEach(d => setDotColor(d, C.cyan));
  const boxAway = [];
  if (P && boxNow) { boxAway.push(new M.FadeOut(boxNow)); boxNow = null; BOXP = [0, -0.55, 0]; }
  await play(...boxAway, new M.FadeOut(new M.VGroup(...nums)), new M.FadeIn(tagT), new M.FadeIn(yl), new M.FadeIn(tagY),
    ...say('YESTERDAY’S NOTEBOOK', C.pink));
  await play(
    new M.LaggedStart(ydots.map(d => new M.LaggedStart([new M.FadeIn(d.halo), new M.FadeIn(d.core)], { lagRatio: 0 })), { lagRatio: 0.2, runTime: 2.4 }),
    ...fbox(['today:     6 orders', ['yesterday: 9 orders', C.pink]], C.pink)
  );

  // 14-16. nine > six? but three hours against one
  await until(S(14)); await play(new M.Indicate(boxNow, { color: C.pink }), ...say('9 IS MORE THAN 6: BUSIER?', C.pink));

  const ybY = YY + 0.98;
  const yb = spanBar(X0, X0 + 3 * U, ybY, C.pink);
  const ybl = T('3 hours', 18, C.pink); ybl.moveTo([0, ybY + 0.25, 0]);
  await until(S(15));
  await play(new M.FadeIn(yb), new M.FadeIn(ybl),
    ...fbox(['today:     6 orders in 1 hour', ['yesterday: 9 orders in 3 hours', C.pink]], C.pink),
    ...say('3 HOURS, NOT 1', C.pink));
  await until(S(16)); await play(...say('NOT A FAIR MATCH', C.pink));

  // 17. same question for each day
  await until(S(17)); await play(new M.FadeOut(new M.VGroup(yb, ybl)), ...say('HOW MANY IN ONE HOUR?', C.green));

  // 18-21. pretend spread evenly: deal nine dots into three hours
  const segs = [0, 1, 2].map(h => segRect(h, YY, C.pink));
  await until(S(18)); await play(...segs.map(s => new M.Create(s)), ...say('PRETEND: SPREAD EVENLY', C.pink));

  await until(S(19));
  await play(
    new M.LaggedStart(ydots.map((d, i) => moveDot(d, gpos(i % 3, Math.floor(i / 3), YY), C.pink, -0.5)),
      { lagRatio: 0.25, runTime: Math.max(2.5, E(19) - S(19) - 0.3) }),
    ...say('DEAL: ONE TO EACH HOUR', C.pink)
  );

  const mkCounts = (vals, color) => vals.map((v, h) => {
    const t = T(String(v), 22, color, true); t.moveTo([X0 + U * (h + 0.5), YY + 0.96, 0]); return t;
  });
  const threes = mkCounts([3, 3, 3], C.amber);
  await until(S(20));
  await play(new M.LaggedStart(threes.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.2 }), ...say('EACH HOUR GETS 3 ORDERS', C.amber));
  await until(S(21)); await play(...say('DIVIDING = SHARING EQUALLY', C.green), ...fbox(['yesterday:', ['9 ÷ 3 = 3', C.amber]], C.green));

  // 22. today already covers one hour
  const tseg = segRect(0, YT, C.cyan);
  await until(S(22));
  await play(
    new M.Create(tseg),
    ...dots.flatMap((d, i) => [
      new M.Transform(d.halo, mkHalo(gpos(0, i, YT), C.cyan)),
      new M.Transform(d.core, mkCore(gpos(0, i, YT), C.cyan))
    ]),
    ...fbox(['today:', ['6 in 1 hour → stays 6', C.amber]]),
    ...say('TODAY: EXACTLY 1 HOUR', C.cyan)
  );

  // 23-28. per, rate, speed, twice
  await until(S(23)); await play(...say('PER  =  FOR EACH', C.green));
  await until(S(24));
  await play(...fbox([['today:     6 per hour', C.cyan], ['yesterday: 3 per hour', C.pink]], C.green),
    ...say('TODAY: 6 · YESTERDAY: 3 PER HOUR', C.green));
  await until(S(25)); await play(...say('RATE = ORDERS PER HOUR (PACE)', C.green));
  await until(S(26)); await play(...say('LIKE A CAR: 60 KM PER HOUR', C.muted));

  const r1 = new M.RoundedRectangle({ width: 2 * GX + 0.34, height: 0.26, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
  r1.moveTo([X0 + U * 0.5, YT + 0.28, 0]);
  const r2 = new M.RoundedRectangle({ width: 2 * GX + 0.34, height: 0.26, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
  r2.moveTo([X0 + U * 0.5, YT + 0.28 + GY, 0]);
  await until(S(27));
  await play(...say('3 + 3 = 6: TWICE AS BUSY', C.amber), new M.Create(r1), new M.Indicate(threes[0], { color: C.amber }));
  await play(new M.Create(r2), ...fbox([['today:     6 per hour', C.cyan], ['yesterday: 3 per hour', C.pink], ['6 = 3 + 3 → twice', C.amber]], C.amber));
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(r1, r2)), ...say('FEWER TOTAL (6 < 9), BUSIER PACE', C.amber));

  // 29-33. the formula
  await until(S(29)); await play(...say('THE SHORT LINE: A FORMULA', C.cyan));
  await until(S(30)); await play(...fbox([['orders per hour =', C.ink], ['  orders', C.amber]], C.cyan));
  await until(S(31)); await play(...fbox([['orders per hour =', C.ink], ['  orders ÷ hours', C.amber]], C.cyan));
  await until(S(32));
  await play(
    ...fbox([['orders per hour =', C.ink], ['  orders ÷ hours', C.amber], ['yesterday: 9 ÷ 3 = 3', C.pink]], C.cyan),
    ...segs.map(s => new M.Indicate(s, { color: C.pink }))
  );
  await until(S(33));
  await play(
    ...fbox([['orders per hour =', C.ink], ['  orders ÷ hours', C.amber], ['yesterday: 9 ÷ 3 = 3', C.pink], ['today:     6 ÷ 1 = 6', C.cyan]], C.cyan),
    new M.Indicate(tseg, { color: C.cyan })
  );

  // 34. what it is for
  await until(S(34)); await play(...say('COMPARE FAIRLY, ANY TIME SPAN', C.green));

  // 35-36. warning: a rate hides a rush
  await until(S(35)); await play(...say('WARNING: A RATE CAN HIDE A RUSH', C.pink));
  const midIdx = [1, 4, 7];
  const rn = mkCounts([6, 0, 3], C.pink);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...threes)),
    new M.LaggedStart(midIdx.map((idx, k) => moveDot(ydots[idx], gpos(0, 3 + k, YY), C.pink, 0.6)), { lagRatio: 0.15, runTime: 1.8 })
  );
  await play(
    new M.LaggedStart(rn.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.0 }),
    ...fbox(['real hours: 6, 0, 3', ['rate: 9 ÷ 3 = 3 per hour', C.amber]], C.pink)
  );

  // 37-38. busy could mean a long queue: a different quantity
  const qx = P ? 1.95 : -0.35, qy = P ? 1.58 : 0.30, qsp = 0.42;
  const queue = [0, 1, 2, 3].map(k => person(qx + (k - 1.5) * qsp, qy, 0.72, C.muted));
  const ql = T('the wait', 16, C.muted); ql.moveTo([qx, qy - 0.34, 0]);
  await until(S(37));
  await play(new M.LaggedStart(queue.map(p => new M.FadeIn(p)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.FadeIn(ql), ...say('LONG QUEUE? ANOTHER QUANTITY', C.muted));
  await until(S(38)); await play(...say('SAY WHAT, AND OVER HOW LONG', C.amber));

  // 39. recap
  const threes2 = mkCounts([3, 3, 3], C.amber);
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...queue, ql, ...rn)),
    new M.LaggedStart(midIdx.map((idx, k) => moveDot(ydots[idx], gpos(1, k, YY), C.pink, -0.6)), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox([['orders per hour =', C.ink], ['  orders ÷ hours', C.amber], ['today 6  ·  yesterday 3', C.green]], C.green),
    ...say('COUNT ORDERS, DIVIDE BY HOURS', C.green)
  );
  await play(...threes2.map(t => new M.FadeIn(t)));

  // 40-41. end of chapter, bridge to 1.2
  await until(S(40)); await play(...say('END OF CHAPTER 1.1: DATA TABLES', C.cyan));
  await until(S(41)); await play(...say('NEXT: COUNTS & TYPICAL WAIT', C.violet));
}
