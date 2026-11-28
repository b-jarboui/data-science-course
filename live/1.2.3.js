// 1.2.3 Cumulative frequency: counting up to a limit (live manim-web lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const M_COUNTS = [1, 2, 3, 1, 0, 1]; // morning shift (8 customers), waits 1..6 min
  const E_WAITS = [2, 3, 3, 3, 4, 5, 6, 14]; // evening shift (8 customers), sorted

  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 1.65, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
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
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  function makeDot(p, color = C.cyan, r = 0.14) {
    const halo = new M.Dot({ point: p, radius: r * 2.1, color }); halo.setFill(color, 0.20);
    const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1);
    return { g: new M.VGroup(halo, d), halo, d };
  }
  function paintDot(o, color) {
    o.halo.setColor(color); o.halo.setFill(color, 0.22);
    o.d.setColor(color); o.d.setFill(color, 1);
  }
  function makeBar(labelText, pct, countText, color, y, w) {
    const left = CX - w / 2, h = 0.52;
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color: C.line, strokeWidth: 2 });
    bg.setFill(C.card, 0.9); bg.moveTo([CX, y, 0]);
    const fw = Math.max(0.24, w * pct);
    const fg = new M.RoundedRectangle({ width: fw, height: h - 0.06, cornerRadius: 0.10, color, strokeWidth: 0 });
    fg.setFill(color, 0.85); fg.moveTo([left + fw / 2 + 0.03, y, 0]);
    const topL = T(labelText, P ? 18 : 19, color, true);
    topL.moveTo([left + topL.getWidth() / 2, y + 0.44, 0]);
    const valL = T(countText, P ? 17 : 18, C.ink, true);
    valL.moveTo([left + w - valL.getWidth() / 2, y + 0.44, 0]);
    return { parts: [bg, fg, topL, valL], fg };
  }

  // 0-1 café promise: every coffee within 3 minutes
  const cupY = P ? -0.9 : -0.35;
  const cupBody = new M.RoundedRectangle({ width: 1.1, height: 1.15, cornerRadius: 0.16, color: C.amber, strokeWidth: 3 });
  cupBody.setFill(C.card, 0.95); cupBody.moveTo([0, cupY, 0]);
  const cupHandle = new M.Arc({ radius: 0.30, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber });
  cupHandle.moveTo([0.65, cupY + 0.04, 0]);
  const saucer = new M.Line({ start: [-0.85, cupY - 0.65, 0], end: [0.85, cupY - 0.65, 0], color: C.amber, strokeWidth: 3 });
  const steam1 = new M.Line({ start: [-0.22, cupY + 0.72, 0], end: [-0.14, cupY + 1.05, 0], color: C.muted, strokeWidth: 2 });
  const steam2 = new M.Line({ start: [0.16, cupY + 0.72, 0], end: [0.24, cupY + 1.05, 0], color: C.muted, strokeWidth: 2 });
  const cupGroup = new M.VGroup(cupBody, cupHandle, saucer, steam1, steam2);
  if (P) { cupGroup.scale(1.8); cupGroup.moveTo([0, -1.0, 0]); }
  const promiseBadge = pill('≤ 3 MINUTES', C.amber, P ? 28 : 26);
  promiseBadge.moveTo([0, P ? -3.6 : cupY - 1.30, 0]);

  await until(S(0));
  await play(new M.FadeIn(cupGroup), new M.FadeIn(promiseBadge), ...say('PROMISE: COFFEE ≤ 3 MIN', C.amber));

  await until(S(1));
  await play(new M.Indicate(promiseBadge, { color: C.amber }), ...say('MORNING SHIFT: KEPT IT?', C.cyan));

  // 2 eight customers
  const custIcons = [];
  for (let k = 0; k < 8; k++) {
    const x = P ? ((k % 4) - 1.5) * 1.45 : (k - 3.5) * 1.15;
    const y = P ? (k < 4 ? -0.6 : -3.0) : -0.35;
    const ks = P ? 1.5 : 1;
    const head = new M.Circle({ radius: 0.14 * ks, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.34 * ks, 0]);
    const body = new M.Arc({ radius: 0.25 * ks, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y, 0]);
    custIcons.push(new M.VGroup(head, body));
  }
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(cupGroup, promiseBadge)),
    new M.LaggedStart(custIcons.map(ic => new M.FadeIn(ic)), { lagRatio: 0.10, runTime: 1.3 }),
    ...say('8 MORNING CUSTOMERS', C.cyan)
  );

  // 3 minutes axis 1..6
  const DX = 1.12;
  const mx = m => CX + (m - 3.5) * DX;
  const AY = P ? -3.2 : -0.25;
  const DY = P ? 0.85 : 0.42;
  const DOT0 = P ? 0.48 : 0.38;
  const dotPos = (m, j) => [mx(m), AY + DOT0 + j * DY, 0];

  const axis = new M.Line({ start: [mx(1) - 0.55, AY, 0], end: [mx(6) + 0.55, AY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [1, 2, 3, 4, 5, 6].map(m => new M.VGroup(
    new M.Line({ start: [mx(m), AY - 0.08, 0], end: [mx(m), AY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(m), 20, C.muted, true).moveTo([mx(m), AY - 0.36, 0])
  ));
  const minUnit = T('minutes', 17, C.muted);
  minUnit.moveTo([CX, AY - 0.76, 0]);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...custIcons)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, minUnit)),
    ...say('1 DOT = 1 CUSTOMER', C.cyan)
  );

  // 4-6 place the 8 morning dots
  const mDots = []; // { g, halo, d, m, j }
  const byMin = [[], [], [], [], [], []];
  M_COUNTS.forEach((cnt, idx) => {
    const m = idx + 1;
    for (let j = 0; j < cnt; j++) {
      const o = { ...makeDot(dotPos(m, j), C.cyan, P ? 0.18 : 0.14), m, j };
      mDots.push(o);
      byMin[idx].push(o);
    }
  });

  await until(S(4));
  await play(new M.FadeIn(byMin[0][0].g), new M.Flash(byMin[0][0].d, { color: C.cyan }), ...say('1 MIN: 1   ·   2 MIN: 2', C.cyan));
  await until(S(4) + 1.8);
  await play(new M.LaggedStart(byMin[1].map(o => new M.FadeIn(o.g)), { lagRatio: 0.25, runTime: 0.9 }));

  await until(S(5));
  await play(new M.LaggedStart(byMin[2].map(o => new M.FadeIn(o.g)), { lagRatio: 0.20, runTime: 1.0 }), ...say('3 MIN: 3 CUSTOMERS', C.cyan));

  const zero5 = T('0', 19, C.muted, true); zero5.moveTo([mx(5), AY + 0.38, 0]);
  await until(S(6));
  await play(new M.FadeIn(byMin[3][0].g), new M.Flash(byMin[3][0].d, { color: C.cyan }), ...say('4: 1   ·   5: 0   ·   6: 1', C.cyan));
  await until(S(6) + 1.4);
  await play(new M.FadeIn(zero5, { runTime: 0.6 }));
  await until(S(6) + 2.5);
  await play(new M.FadeIn(byMin[5][0].g), new M.Flash(byMin[5][0].d, { color: C.cyan }));

  // 7 data = morning wait times
  const dataBox = new M.RoundedRectangle({ width: mx(6) - mx(1) + 1.0, height: 1.50, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  dataBox.moveTo([CX, AY + 0.78, 0]);
  await until(S(7));
  await play(new M.FadeOut(zero5), new M.Create(dataBox), ...say('DATA = 8 MORNING WAITS', C.cyan));

  // 8 three-minute limit
  const limX = (mx(3) + mx(4)) / 2;
  const topY = AY + DOT0 + 2 * DY + (P ? 0.48 : 0.36); // just above the top halo of the 3-minute stack
  const limLine = new M.DashedLine({ start: [limX, AY - 0.05, 0], end: [limX, topY, 0], color: C.amber });
  const limTag = T('3 min limit', P ? 17 : 17, C.amber, true);
  limTag.moveTo([limX + 0.12 + limTag.getWidth() / 2, topY - 0.12, 0]); // right of the line, clear of every dot
  const zoneW = limX - (mx(1) - 0.48);
  const zoneRect = new M.Rectangle({ width: zoneW, height: topY - AY, color: C.amber, strokeWidth: 1 });
  zoneRect.setFill(C.amber, 0.09); zoneRect.moveTo([mx(1) - 0.48 + zoneW / 2, AY + (topY - AY) / 2, 0]);

  await until(S(8));
  await play(new M.FadeOut(dataBox), new M.FadeIn(zoneRect), new M.Create(limLine), new M.FadeIn(limTag), ...say('LIMIT: 3 MINUTES OR LESS', C.amber));

  // 9 not just 3 min; 1 and 2 count too
  await until(S(9));
  await play(new M.LaggedStart(byMin[2].map(o => new M.Indicate(o.g, { color: C.amber })), { lagRatio: 0.12, runTime: 0.9 }), ...say('1, 2, AND 3 MIN ALL COUNT', C.amber));
  await until(S(9) + 1.8);
  await play(new M.LaggedStart([...byMin[0], ...byMin[1]].map(o => new M.Indicate(o.g, { color: C.green })), { lagRatio: 0.15, runTime: 0.9 }));

  // 10 add from the left up to 3 minutes
  const sweepArr = new M.Arrow({ start: [mx(1) - 0.35, AY + 1.42, 0], end: [limX - 0.10, AY + 1.42, 0], color: C.green, strokeWidth: 3 });
  await until(S(10));
  await play(new M.Create(sweepArr), ...say('ADD FROM LEFT TO 3 MIN', C.green));

  // 11 1 + 2 = 3, + 3 = 6
  await until(S(11));
  [...byMin[0], ...byMin[1]].forEach(o => paintDot(o, C.green));
  await play(...fbox(['add up to 3 min', ['1 + 2 = 3', C.green]], C.green), ...say('1 + 2 = 3', C.green));
  await until(S(11) + 2.0);
  byMin[2].forEach(o => paintDot(o, C.green));
  await play(...fbox(['add up to 3 min', '1 + 2 = 3', ['3 + 3 = 6', C.amber]], C.amber), ...say('3 + 3 = 6 CUSTOMERS', C.amber));

  // 12 6 on time, 2 late
  await until(S(12));
  [...byMin[3], ...byMin[5]].forEach(o => paintDot(o, C.pink));
  await play(new M.FadeOut(sweepArr), ...fbox([['in time (≤ 3): 6', C.green], ['late    (> 3): 2', C.pink]], C.cyan), ...say('6 ON TIME   ·   2 LATE', C.green));

  // 13-14 frequency = single count
  const FREQ_Y = P ? -4.15 : -1.04;
  const freqTexts = M_COUNTS.map((cnt, idx) => {
    const t = T(String(cnt), 20, idx === 3 ? C.amber : C.cyan, true);
    t.moveTo([mx(idx + 1), FREQ_Y, 0]);
    return t;
  });
  await until(S(13));
  await play(
    new M.FadeOut(minUnit),
    new M.LaggedStart(freqTexts.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 0.9 }),
    new M.Indicate(byMin[3][0].g, { color: C.amber }),
    ...say('EACH WAIT HAS ITS COUNT', C.cyan)
  );

  const freqLbl = T('freq', 15, C.muted, true);
  freqLbl.moveTo([mx(1) - (P ? 0.62 : 0.72), FREQ_Y, 0]);
  await until(S(14));
  freqTexts[3].setColor(C.cyan);
  await play(
    new M.FadeIn(freqLbl),
    new M.LaggedStart(freqTexts.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.06, runTime: 0.9 }),
    ...fbox([['frequency', C.cyan], 'count for one wait', ['at 4 min → 1', C.amber]], C.cyan),
    ...say('FREQUENCY = SINGLE COUNT', C.cyan)
  );

  // 15-17 running count -> cumulative frequency (up to 3 min)
  const STEP_BASE = P ? -6.7 : -2.82;
  const STEP_U = P ? 0.24 : 0.125;
  const stepPt = (idx, cum) => [mx(idx + 1), STEP_BASE + cum * STEP_U, 0];
  const CUM = [1, 3, 6, 7, 7, 8];

  const cumLbl = T('cum.', 15, C.amber, true);
  cumLbl.moveTo([mx(1) - (P ? 0.62 : 0.72), STEP_BASE + 3.5 * STEP_U, 0]);

  const stepDots = [], stepLabs = [], stepSegs = [];
  for (let i = 0; i < 6; i++) {
    const p = stepPt(i, CUM[i]);
    const col = i === 4 ? C.violet : i === 5 ? C.green : C.amber;
    const sd = new M.Dot({ point: p, radius: 0.10, color: col }); sd.setFill(col, 1);
    const sl = T(String(CUM[i]), 18, col, true); sl.moveTo([p[0], p[1] + 0.28, 0]);
    stepDots.push(sd); stepLabs.push(sl);
    if (i > 0) {
      const seg = new M.Line({ start: stepPt(i - 1, CUM[i - 1]), end: p, color: i === 4 ? C.violet : i === 5 ? C.green : C.amber, strokeWidth: 3 });
      stepSegs.push(seg);
    }
  }

  await until(S(15));
  await play(
    new M.FadeIn(cumLbl),
    new M.LaggedStart([
      new M.FadeIn(stepDots[0]), new M.FadeIn(stepLabs[0]),
      new M.Create(stepSegs[0]), new M.FadeIn(stepDots[1]), new M.FadeIn(stepLabs[1]),
      new M.Create(stepSegs[1]), new M.FadeIn(stepDots[2]), new M.FadeIn(stepLabs[2]),
    ], { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox([['running count', C.amber], '≤ 1 min: 1', '≤ 2 min: 1 + 2 = 3', ['≤ 3 min: 3 + 3 = 6', C.amber]], C.amber),
    ...say('RUNNING COUNT = PILING UP', C.amber)
  );

  await until(S(16));
  await play(
    new M.Indicate(stepLabs[2], { color: C.amber }),
    ...fbox([['cumulative frequency', C.amber], 'running count from start', 'up to a limit'], C.amber),
    ...say('CUMULATIVE FREQUENCY', C.amber)
  );

  await until(S(17));
  await play(
    new M.Flash(stepDots[2], { color: C.amber }),
    new M.Indicate(zoneRect, { color: C.amber }),
    ...fbox([['≤ 3 min: 6 customers', C.amber], ['= 3 min: only 3', C.muted]], C.amber),
    ...say('3 MIN OR LESS (NOT JUST 3)', C.amber)
  );

  // 18-22 keep piling up past 3 minutes
  await until(S(18));
  await play(new M.FadeOut(new M.VGroup(limLine, limTag, zoneRect)), ...say('KEEP PILING UP PAST 3 MIN', C.cyan));

  await until(S(19));
  paintDot(byMin[3][0], C.green);
  await play(
    new M.Create(stepSegs[2]), new M.FadeIn(stepDots[3]), new M.FadeIn(stepLabs[3]),
    ...fbox(['running count', ['≤ 4 min: 6 + 1 = 7', C.amber]], C.amber),
    ...say('UP TO 4 MIN: 6 + 1 = 7', C.amber)
  );

  await until(S(20));
  await play(
    new M.Indicate(freqTexts[4], { color: C.violet }),
    new M.Create(stepSegs[3]), new M.FadeIn(stepDots[4]), new M.FadeIn(stepLabs[4]),
    ...fbox(['running count', 'at 5 min: 0 new', ['≤ 5 min: 7 + 0 = 7', C.violet]], C.violet),
    ...say('5 MIN: STAYS AT 7', C.violet)
  );

  await until(S(21));
  await play(
    new M.LaggedStart(stepSegs.slice(0, 4).map(sg => new M.Indicate(sg, { color: C.violet })), { lagRatio: 0.16, runTime: 1.3 }),
    ...fbox([['cumulative frequency', C.violet], 'rises or stays flat', ['never goes down', C.green]], C.violet),
    ...say('RISES OR FLAT · NEVER DROPS', C.violet)
  );

  await until(S(22));
  paintDot(byMin[5][0], C.green);
  await play(
    new M.Create(stepSegs[4]), new M.FadeIn(stepDots[5]), new M.FadeIn(stepLabs[5]),
    ...fbox(['running count', ['≤ 6 min: 7 + 1 = 8', C.green], ['all 8 customers', C.green]], C.green),
    ...say('UP TO 6 MIN: ALL 8', C.green)
  );

  // 23-33 cumulative share: 6 of 8 = 3 of 4 pairs = 3 quarters = 75%
  const PW = P ? 1.65 : 1.70;
  const px = p => CX + (p - 1.5) * PW;
  const PAIR_Y = P ? -0.5 : 0.75;
  const Q_Y = P ? -2.5 : -0.45;
  const P100_Y = P ? -4.3 : -1.55;
  const TAG75_Y = P ? -5.5 : -2.40;

  const rowDots = [];
  for (let p = 0; p < 4; p++) {
    const col = p < 3 ? C.green : C.pink;
    for (const dx of [-0.30, 0.30]) {
      rowDots.push(makeDot([px(p) + dx, PAIR_Y, 0], col, 0.15).g);
    }
  }

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(axis, ...ticks, ...mDots.map(o => o.g), ...freqTexts, freqLbl, cumLbl, ...stepSegs, ...stepDots, ...stepLabs)),
    new M.LaggedStart(rowDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 0.9 }),
    ...fbox([['on time: 6', C.green], ['total:   8', C.ink], ['what share?', C.amber]], C.cyan),
    ...say('WHAT SHARE WERE ON TIME?', C.amber)
  );

  const pairBoxes = [0, 1, 2, 3].map(p => {
    const col = p < 3 ? C.green : C.pink;
    const r = new M.RoundedRectangle({ width: 1.36, height: 0.74, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(col, 0.10); r.moveTo([px(p), PAIR_Y, 0]);
    return r;
  });
  await until(S(24));
  await play(
    new M.LaggedStart(pairBoxes.map(b => new M.Create(b)), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox([['3 pairs on time', C.green], ['1 pair late', C.pink], '4 pairs total'], C.green),
    ...say('4 PAIRS: 3 ON TIME, 1 LATE', C.green)
  );

  const qW = PW * 0.94;
  const qBlocks = [0, 1, 2, 3].map(p => {
    const col = p < 3 ? C.green : C.pink;
    const r = new M.Rectangle({ width: qW - 0.06, height: 0.60, color: col, strokeWidth: 2 });
    r.setFill(col, p < 3 ? 0.50 : 0.10); r.moveTo([px(p), Q_Y, 0]);
    const t = T(p < 3 ? 'on time' : 'late', P ? 15 : 16, p < 3 ? C.ink : C.pink);
    t.moveTo([px(p), Q_Y, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(25));
  await play(
    new M.LaggedStart(qBlocks.map(b => new M.FadeIn(b)), { lagRatio: 0.12, runTime: 0.9 }),
    ...fbox(['3 out of 4 pairs', ['= 3 quarters', C.green]], C.green),
    ...say('3 OF 4 = THREE QUARTERS', C.green)
  );

  const bar100R = new M.Rectangle({ width: qW * 4 - 0.06, height: 0.64, color: C.amber, strokeWidth: 2 });
  bar100R.setFill(C.amber, 0.14); bar100R.moveTo([CX, P100_Y, 0]);
  const bar100T = T('100', 22, C.amber, true); bar100T.moveTo([CX, P100_Y, 0]);
  const bar100 = new M.VGroup(bar100R, bar100T);
  await until(S(26));
  await play(new M.FadeIn(bar100), ...fbox([['percent', C.amber], '= out of 100'], C.amber), ...say('PERCENT = OUT OF 100', C.amber));

  const cells25 = [0, 1, 2, 3].map(p => {
    const col = p < 3 ? C.amber : C.muted;
    const r = new M.Rectangle({ width: qW - 0.06, height: 0.64, color: col, strokeWidth: 2 });
    r.setFill(col, p < 3 ? 0.25 : 0.08); r.moveTo([px(p), P100_Y, 0]);
    const t = T('25', 22, col, true); t.moveTo([px(p), P100_Y, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(27));
  await play(
    new M.FadeOut(bar100),
    new M.LaggedStart(cells25.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['100 split into 4', ['25 + 25 + 25 + 25', C.amber]], C.amber),
    ...say('4 QUARTERS = 25 EACH', C.amber)
  );

  const tag75 = pill('75% ON TIME', C.amber, 20);
  tag75.moveTo([px(1), TAG75_Y, 0]);
  await until(S(28));
  await play(
    new M.LaggedStart(cells25.slice(0, 3).map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.15, runTime: 0.9 }),
    new M.FadeIn(tag75),
    ...fbox(['25 + 25 + 25 = 75', ['= 75%', C.amber]], C.amber),
    ...say('3 TWENTY-FIVES = 75%', C.amber)
  );

  await until(S(29));
  await play(
    new M.Indicate(tag75, { color: C.green }),
    ...fbox([['cumulative share', C.green], 'share up to the limit', ['≤ 3 min → 75%', C.amber]], C.green),
    ...say('CUMULATIVE SHARE = 75%', C.green)
  );

  await until(S(30));
  await play(...fbox([['share = part ÷ whole', C.cyan]], C.cyan), ...say('SHARE = PART ÷ WHOLE', C.cyan));

  await until(S(31));
  await play(...fbox(['part  = 6', 'whole = 8', ['6 ÷ 8  (smaller ÷ bigger)', C.amber]], C.amber), ...say('6 ÷ 8: SMALLER ÷ BIGGER', C.amber));

  await until(S(32));
  await play(
    new M.LaggedStart(qBlocks.slice(0, 3).map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.14, runTime: 0.9 }),
    ...fbox(['6 ÷ 8 = 0.75', ['= 6 out of 8', C.green], ['= 75%', C.amber]], C.green),
    ...say('6 ÷ 8 = 0.75 = 75%', C.green)
  );

  await until(S(33));
  await play(
    ...fbox([['cumulative share', C.cyan], '= running count ÷ total', ['= 6 ÷ 8 = 75%', C.amber]], C.cyan),
    ...say('SHARE = COUNT ÷ TOTAL', C.cyan)
  );

  // 34-39 compare morning (75%) and evening (50%)
  const BAR_W = P ? 5.8 : 6.0;
  const M_BAR_Y = P ? 0.3 : 0.85;
  const E_BAR_Y = P ? -2.2 : -0.75;
  const mBar = makeBar('Morning (8)', 0.75, '6 of 8 = 75%', C.cyan, M_BAR_Y, BAR_W);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...rowDots, ...pairBoxes, ...qBlocks, ...cells25, tag75)),
    new M.FadeIn(new M.VGroup(...mBar.parts)),
    ...fbox([['morning shift', C.cyan], '≤ 3 min: 6 of 8', ['share:   75%', C.cyan]], C.cyan),
    ...say('CHECK TARGETS & COMPARE', C.cyan)
  );

  const E_TICKS = [1, 2, 3, 4, 5, 6, 14];
  // 1..6 evenly spaced, then a clear axis break before 14 (the scale jumps there)
  const EDX = P ? 0.84 : 0.98;
  const ex = idx => CX + (Math.min(idx, 5) - 3.35) * EDX + (idx === 6 ? 1.75 * EDX : 0);
  const EAY = P ? -4.3 : -1.85;
  const brkX = ex(5) + 0.875 * EDX;
  const eAxis = new M.VGroup(
    new M.Line({ start: [ex(0) - 0.45, EAY, 0], end: [brkX - 0.14, EAY, 0], color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: [brkX + 0.14, EAY, 0], end: [ex(6) + 0.45, EAY, 0], color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: [brkX - 0.24, EAY - 0.16, 0], end: [brkX - 0.04, EAY + 0.16, 0], color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: [brkX + 0.04, EAY - 0.16, 0], end: [brkX + 0.24, EAY + 0.16, 0], color: C.muted, strokeWidth: 3 })
  );
  const eTicks = E_TICKS.map((v, i) => new M.VGroup(
    new M.Line({ start: [ex(i), EAY - 0.08, 0], end: [ex(i), EAY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, C.muted, true).moveTo([ex(i), EAY - 0.34, 0])
  ));
  const eLimX = (ex(2) + ex(3)) / 2;
  const eLimLine = new M.DashedLine({ start: [eLimX, EAY - 0.05, 0], end: [eLimX, EAY + 1.38, 0], color: C.amber });
  const eLimTag = T('3 min', 16, C.amber, true); eLimTag.moveTo([eLimX, EAY + 1.54, 0]);

  await until(S(35));
  await play(
    new M.Create(eAxis),
    new M.FadeIn(new M.VGroup(...eTicks, eLimTag)),
    new M.Create(eLimLine),
    ...say('EVENING: ALSO 8 CUSTOMERS', C.pink)
  );

  const eDots = [];
  const eStacks = [0, 0, 0, 0, 0, 0, 0];
  for (const w of E_WAITS) {
    const idx = E_TICKS.indexOf(w);
    const j = eStacks[idx]++;
    const p = [ex(idx), EAY + 0.34 + j * 0.38, 0];
    eDots.push({ ...makeDot(p, C.pink, 0.13), w });
  }
  const eZero1 = T('none', 15, C.muted, true); eZero1.moveTo([ex(0), EAY - 0.68, 0]);

  await until(S(36));
  await play(
    new M.FadeIn(eZero1),
    new M.FadeIn(eDots[0].g), new M.Flash(eDots[0].d, { color: C.pink }),
    ...fbox([['evening shift', C.pink], '1 min: 0', '2 min: 1'], C.pink),
    ...say('1 MIN: 0   ·   2 MIN: 1', C.pink)
  );

  await until(S(37));
  await play(
    new M.LaggedStart(eDots.slice(1, 4).map(o => new M.FadeIn(o.g)), { lagRatio: 0.18, runTime: 0.9 }),
    ...say('3 MIN: 3   ·   LONGER: 4', C.pink)
  );
  await until(S(37) + 1.8);
  await play(
    new M.LaggedStart(eDots.slice(4).map(o => new M.FadeIn(o.g)), { lagRatio: 0.16, runTime: 0.9 }),
    ...fbox([['evening shift', C.pink], '≤ 3 min: 0, 1, 3', '> 3 min: 4'], C.pink)
  );

  const eZoneW = eLimX - (ex(0) - 0.42);
  const eZone = new M.Rectangle({ width: eZoneW, height: 1.32, color: C.pink, strokeWidth: 1 });
  eZone.setFill(C.pink, 0.10); eZone.moveTo([ex(0) - 0.42 + eZoneW / 2, EAY + 0.68, 0]);
  await until(S(38));
  await play(
    new M.FadeIn(eZone),
    new M.LaggedStart(eDots.slice(0, 4).map(o => new M.Indicate(o.g, { color: C.amber })), { lagRatio: 0.12, runTime: 0.9 }),
    ...fbox([['evening (≤ 3 min)', C.pink], '0 + 1 + 3 = 4', ['4 of 8 on time', C.pink]], C.pink),
    ...say('EVENING: 0 + 1 + 3 = 4', C.pink)
  );

  const eBar = makeBar('Evening (8)', 0.50, '4 of 8 = 50%', C.pink, E_BAR_Y, BAR_W);
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(eAxis, ...eTicks, eLimLine, eLimTag, eZero1, eZone, ...eDots.map(o => o.g))),
    new M.FadeIn(new M.VGroup(...eBar.parts)),
    ...fbox([['morning: 6 ÷ 8 = 75%', C.cyan], ['evening: 4 ÷ 8 = 50%', C.pink], ['down from 75% to 50%', C.amber]], C.pink),
    ...say('4 ÷ 8 = 50% (DOWN FROM 75%)', C.pink)
  );

  // 40-42 different group sizes: Morning (6 of 8 = 75%) vs Saturday (10 of 20 = 50%)
  const mMiniDots = Array.from({ length: 8 }, (_, k) => {
    const col = k < 6 ? C.cyan : C.muted;
    const d = new M.Dot({ point: [CX - BAR_W / 2 + 0.25 + k * 0.44, M_BAR_Y - 0.54, 0], radius: 0.11, color: col });
    d.setFill(col, k < 6 ? 1 : 0.45);
    return d;
  });
  const SAT_TOP = P ? -2.0 : -0.55;
  const satLbl = T('Saturday (20): 10 on time, 10 late', P ? 17 : 18, C.violet, true);
  satLbl.moveTo([CX - BAR_W / 2 + satLbl.getWidth() / 2, SAT_TOP, 0]);
  const satDots = Array.from({ length: 20 }, (_, k) => {
    const row = Math.floor(k / 10), colIdx = k % 10;
    const col = k < 10 ? C.violet : C.muted;
    const d = new M.Dot({ point: [CX - BAR_W / 2 + 0.25 + colIdx * 0.44, SAT_TOP - 0.46 - row * 0.38, 0], radius: 0.11, color: col });
    d.setFill(col, k < 10 ? 1 : 0.45);
    return d;
  });

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...eBar.parts)),
    new M.FadeIn(new M.VGroup(...mMiniDots, satLbl)),
    new M.LaggedStart(satDots.map(d => new M.FadeIn(d)), { lagRatio: 0.03, runTime: 1.0 }),
    ...fbox([['morning:  6 of 8', C.cyan], ['saturday: 10 of 20', C.violet]], C.violet),
    ...say('SATURDAY: 10 OF 20 ON TIME', C.violet)
  );

  const SAT_BAR_Y = P ? -4.3 : -2.15;
  const satBar = makeBar('Saturday share', 0.50, '10 of 20 = 50%', C.violet, SAT_BAR_Y, BAR_W);
  await until(S(41));
  await play(
    new M.FadeIn(new M.VGroup(...satBar.parts)),
    ...fbox(['count: 10 > 6', ['morning:  6 ÷ 8  = 75%', C.cyan], ['saturday: 10 ÷ 20 = 50%', C.violet]], C.amber),
    ...say('10 > 6, YET 50% < 75%', C.amber)
  );

  await until(S(42));
  await play(
    new M.Indicate(mBar.fg, { color: C.cyan }),
    new M.Indicate(satBar.fg, { color: C.violet }),
    ...fbox([['different sizes?', C.amber], ['compare shares (%)', C.green], 'not raw counts'], C.green),
    ...say('DIFFERENT SIZES → USE SHARES', C.green)
  );

  // 43-45 trap: needs natural order (minutes vs drinks)
  const ORD_Y = P ? 0.1 : 0.65;
  const ordTitle = T('minutes: natural order ✓', P ? 18 : 19, C.green, true);
  ordTitle.moveTo([CX, ORD_Y + 0.56, 0]);
  const ordItems = [ordTitle];
  const ordStep = P ? 1.08 : 1.10;
  for (let i = 0; i < 6; i++) {
    const x = CX + (i - 2.5) * ordStep;
    const r = new M.RoundedRectangle({ width: 0.64, height: 0.56, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
    r.setFill(C.green, 0.14); r.moveTo([x, ORD_Y, 0]);
    const t = T(String(i + 1), 20, C.green, true); t.moveTo([x, ORD_Y, 0]);
    ordItems.push(new M.VGroup(r, t));
    if (i < 5) {
      const a = T('→', 18, C.muted, true); a.moveTo([x + ordStep / 2, ORD_Y, 0]);
      ordItems.push(a);
    }
  }

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(...mBar.parts, ...mMiniDots, satLbl, ...satDots, ...satBar.parts)),
    new M.LaggedStart(ordItems.map(it => new M.FadeIn(it)), { lagRatio: 0.06, runTime: 1.0 }),
    ...fbox([['watch out!', C.amber], 'needs a natural order', ['1 < 2 < 3 < 4 < 5 < 6', C.green]], C.amber),
    ...say('TRAP: NEEDS NATURAL ORDER', C.amber)
  );

  const DRINK_Y = P ? -2.3 : -1.15;
  const drinkX = idx => CX + (idx - 1) * (P ? 2.22 : 2.28);
  function makeDrinkCard(name, count, col, x, y) {
    const r = new M.RoundedRectangle({ width: P ? 1.98 : 2.04, height: 1.05, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const nT = T(name, P ? 20 : 21, col); nT.moveTo([x, y + 0.20, 0]);
    const cT = T(String(count) + ' cups', P ? 16 : 17, C.muted, true); cT.moveTo([x, y - 0.24, 0]);
    return new M.VGroup(r, nT, cT);
  }
  const drinkCards = [
    makeDrinkCard('Tea', 3, C.green, drinkX(0), DRINK_Y),
    makeDrinkCard('Latte', 4, C.amber, drinkX(1), DRINK_Y),
    makeDrinkCard('Espresso', 2, C.pink, drinkX(2), DRINK_Y),
  ];

  await until(S(44));
  await play(
    new M.LaggedStart(drinkCards.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 1.0 }),
    ...fbox([['no natural order:', C.pink], 'tea · latte · espresso'], C.pink),
    ...say('DRINKS HAVE NO ORDER', C.pink)
  );

  const trapNote = pill('“UP TO LATTE” = 7 OR 9 ?', C.pink, P ? 18 : 19);
  trapNote.moveTo([CX, P ? -4.3 : -2.25, 0]);
  await until(S(45));
  await play(
    new M.Transform(drinkCards[0], makeDrinkCard('Tea', 3, C.green, drinkX(1), DRINK_Y), { pathArc: 0.45, runTime: 1.2 }),
    new M.Transform(drinkCards[1], makeDrinkCard('Latte', 4, C.amber, drinkX(2), DRINK_Y), { pathArc: 0.45, runTime: 1.2 }),
    new M.Transform(drinkCards[2], makeDrinkCard('Espresso', 2, C.pink, drinkX(0), DRINK_Y), { pathArc: -0.55, runTime: 1.2 }),
    new M.FadeIn(trapNote),
    ...fbox(['order 1: up to latte = 7', 'order 2: up to latte = 9', ['meaningless!', C.pink]], C.pink),
    ...say('“UP TO LATTE” MEANS NOTHING', C.pink)
  );

  // 46 recap
  function makeRecapCard(line1, line2, col, y) {
    const r = new M.RoundedRectangle({ width: P ? 6.8 : 6.6, height: P ? 1.5 : 1.12, cornerRadius: 0.18, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t1 = T(line1, P ? 22 : 21, C.ink); t1.moveTo([CX, y + (P ? 0.3 : 0.22), 0]);
    const t2 = T(line2, P ? 21 : 20, col, true); t2.moveTo([CX, y - (P ? 0.3 : 0.24), 0]);
    return new M.VGroup(r, t1, t2);
  }
  const recap1 = makeRecapCard('1. Add counts up to a limit', '→ Cumulative frequency', C.amber, P ? -0.6 : 0.25);
  const recap2 = makeRecapCard('2. Divide by the total', '→ Cumulative share', C.green, P ? -3.1 : -1.35);

  await until(S(46));
  await play(
    new M.FadeOut(new M.VGroup(...ordItems, ...drinkCards, trapNote)),
    new M.LaggedStart([new M.FadeIn(recap1), new M.FadeIn(recap2)], { lagRatio: 0.25, runTime: 1.2 }),
    ...fbox([['cumulative frequency', C.amber], '  = running count ≤ limit', ['cumulative share', C.green], '  = running count ÷ total'], C.cyan),
    ...say('ADD TO LIMIT · DIVIDE BY TOTAL', C.green)
  );
}
