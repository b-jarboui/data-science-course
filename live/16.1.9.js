// 16.1.9 Human review: when should the model ask a person for help?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 16.1 data (fixed)
  const HOMES = [
    { id: 'A', district: 'North', calls: 2, pipe: 'Older', urgent: true,  risk: 90 },
    { id: 'B', district: 'North', calls: 0, pipe: 'Newer', urgent: false, risk: 10 },
    { id: 'C', district: 'South', calls: 2, pipe: 'Newer', urgent: true,  risk: 50 },
    { id: 'D', district: 'South', calls: 0, pipe: 'Older', urgent: true,  risk: 30 }
  ];

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]), laptop (14.22 x 8, y in [-3.0, 2.3])
  const PILL = P ? [0, 3.95, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.10, 0] : [0, -2.18, 0];
  const RL_Y = P ? -0.10 : -0.35;
  const RL_W = P ? 7.2 : 11.0;
  const RL_X0 = -RL_W / 2;
  const BAND_H = P ? 2.15 : 1.65;
  const BAND_CY = RL_Y + BAND_H / 2;
  const r2x = v => RL_X0 + (v / 100) * RL_W;
  const dCol = d => d === 'North' ? C.cyan : C.violet;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Drawing helpers
  function txt(s, size, color, p, mono = false, bold = false, maxw = null) {
    const t = T(String(s), size, color, mono, bold);
    if (maxw != null && t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(p);
    return t;
  }

  function rrect(w, h, p, color, fillColor = C.card, fillOp = 0.94, sw = 2, r = 0.14) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: sw });
    box.setFill(fillColor, fillOp);
    box.moveTo(p);
    return box;
  }

  function rect(w, h, p, color, fillColor = color, fillOp = 0.25, sw = 1.5) {
    const box = new M.Rectangle({ width: w, height: h, color, strokeWidth: sw });
    box.setFill(fillColor, fillOp);
    box.moveTo(p);
    return box;
  }

  function seg(a, b, color = C.muted, sw = 2) {
    return new M.Line({ start: a, end: b, color, strokeWidth: sw });
  }

  function arrow(a, b, color = C.amber, sw = 2.5, head = 0.16) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const lx = b[0] - ux * head - uy * head * 0.65, ly = b[1] - uy * head + ux * head * 0.65;
    const rx = b[0] - ux * head + uy * head * 0.65, ry = b[1] - uy * head - ux * head * 0.65;
    return new M.VGroup(
      seg(a, b, color, sw),
      seg([lx, ly, 0], b, color, sw),
      seg([rx, ry, 0], b, color, sw)
    );
  }

  function person(x, y, color = C.amber, sc = 1) {
    const head = new M.Circle({ radius: 0.17 * sc, color, strokeWidth: 2 });
    head.setFill(color, 0.95);
    head.moveTo([x, y + 0.34 * sc, 0]);
    const body = new M.Arc({ radius: 0.31 * sc, startAngle: 0, angle: Math.PI, color, strokeWidth: 2 });
    body.setFill(color, 0.92);
    body.moveTo([x, y - 0.04 * sc, 0]);
    return new M.VGroup(head, body);
  }

  function house(x, y, home) {
    const col = dCol(home.district);
    const sc = P ? 0.85 : 0.95;
    const wall = rect(0.84 * sc, 0.68 * sc, [x, y, 0], col, C.card, 0.94, 2);
    const roofL = seg([x - 0.52 * sc, y + 0.33 * sc, 0], [x, y + 0.80 * sc, 0], col, 3);
    const roofR = seg([x, y + 0.80 * sc, 0], [x + 0.52 * sc, y + 0.33 * sc, 0], col, 3);
    const door = rect(0.22 * sc, 0.34 * sc, [x, y - 0.17 * sc, 0], col, col, 0.25, 1.5);
    const winL = rect(0.16 * sc, 0.16 * sc, [x - 0.24 * sc, y + 0.12 * sc, 0], col, col, 0.55, 1);
    const winR = rect(0.16 * sc, 0.16 * sc, [x + 0.24 * sc, y + 0.12 * sc, 0], col, col, 0.55, 1);
    const name = txt(`Home ${home.id}`, P ? 16 : 19, C.ink, [x, y - 0.60 * sc, 0], false, true);
    const dist = txt(home.district, 15, col, [x, y - 0.90 * sc, 0], true);
    return new M.VGroup(wall, roofL, roofR, door, winL, winR, name, dist);
  }

  const outs = list => list.filter(Boolean).map(o => new M.FadeOut(o));

  // Single formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.36;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.72, ht = rows.length * lh + 0.34;
    const r = rrect(wd, ht, BOXP, color, C.card, 0.96, 2, 0.16);
    const left = BOXP[0] - wd / 2 + 0.36, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 9.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // =========================================================================
  // ACT 1 (0-3): Water company, model, hard-to-judge cases, asking a person
  // =========================================================================
  const HOME_Y = P ? 1.85 : 0.45;
  const HOME_SP = P ? 1.72 : 2.50;
  const houses = HOMES.map((h, i) => house((i - 1.5) * HOME_SP, HOME_Y, h));

  await until(S(0));
  await play(
    new M.LaggedStart(houses.map(h => new M.FadeIn(h)), { lagRatio: 0.12, runTime: 1.2 }),
    ...say('WATER COMPANY: TODAY’S VISITS')
  );

  const modelPos = P ? [0, -0.55, 0] : [-1.15, -1.55, 0];
  const modelCard = new M.VGroup(
    rrect(P ? 5.2 : 5.4, P ? 1.25 : 1.08, modelPos, C.violet, C.card, 0.95, 2),
    txt('MODEL', 22, C.violet, [modelPos[0], modelPos[1] + 0.22, 0], true, true),
    txt('Predicts urgent risk for each home', P ? 15 : 17, C.ink, [modelPos[0], modelPos[1] - 0.22, 0], false, false, P ? 4.8 : 5.0)
  );
  await until(S(1));
  await play(new M.FadeIn(modelCard), ...say('A MODEL HELPS YOU DECIDE', C.violet));

  const qPos = P
    ? [(2 - 1.5) * HOME_SP, HOME_Y + 1.05, 0]
    : [(2 - 1.5) * HOME_SP + 0.56, HOME_Y + 0.68, 0];
  const qMark = new M.VGroup(
    rrect(0.58, 0.52, qPos, C.amber, C.bg, 0.94, 2, 0.15),
    txt('?', 23, C.amber, qPos, true, true)
  );
  await until(S(2));
  await play(
    new M.Indicate(houses[2], { color: C.amber }),
    new M.FadeIn(qMark),
    ...say('SOME REQUESTS ARE HARD TO JUDGE', C.amber)
  );

  const personPos = P ? [0, -2.75, 0] : [3.85, -1.55, 0];
  const personCard = new M.VGroup(
    rrect(P ? 3.8 : 3.0, P ? 1.55 : 1.38, personPos, C.amber, C.card, 0.95, 2),
    person(personPos[0], personPos[1] + 0.14, C.amber, P ? 0.95 : 0.80),
    txt('ASK A PERSON?', 16, C.amber, [personPos[0], personPos[1] - 0.46, 0], true, true, P ? 3.4 : 2.7)
  );
  await until(S(3));
  await play(new M.FadeIn(personCard), ...say('WHEN ASK A PERSON TO EXAMINE?', C.amber));

  // =========================================================================
  // ACT 2 (4-14): Four homes in fixed order -> 0%-100% risk line -> 50% rule
  // =========================================================================
  const PRE_TOP = P ? 2.15 : 0.92;
  const PRE_STEP = P ? 1.15 : 0.72;
  const PRE_W = P ? 7.1 : 10.6;
  const PRE_H = P ? 0.94 : 0.60;
  const PRE_BAR_W = P ? 3.2 : 5.4;
  const PRE_BAR_X = P ? 0.65 : 0.75;
  const preY = i => PRE_TOP - i * PRE_STEP;

  const preHead = new M.VGroup(
    txt('Home', P ? 15 : 17, C.muted, [-PRE_W / 2 + (P ? 0.95 : 1.35), PRE_TOP + (P ? 0.75 : 0.52), 0], false, true),
    txt('Predicted risk (0% to 100%)', P ? 15 : 17, C.cyan, [PRE_BAR_X, PRE_TOP + (P ? 0.75 : 0.52), 0], false, true, PRE_BAR_W + 0.8)
  );
  const preRows = HOMES.map((h, i) => {
    const y = preY(i), col = dCol(h.district);
    const bg = rrect(PRE_W, PRE_H, [0, y, 0], C.line, C.card, i % 2 === 0 ? 0.88 : 0.58, 1.2, 0.10);
    const barL = seg([-PRE_W / 2 + 0.05, y - PRE_H * 0.33, 0], [-PRE_W / 2 + 0.05, y + PRE_H * 0.33, 0], col, 4);
    const name = txt(`Home ${h.id}`, P ? 18 : 20, C.ink, [-PRE_W / 2 + (P ? 0.95 : 1.35), y + (P ? 0.15 : 0.10), 0], false, true);
    const dist = txt(h.district, 15, col, [-PRE_W / 2 + (P ? 0.95 : 1.35), y - (P ? 0.22 : 0.17), 0], true);
    const track = rect(PRE_BAR_W, P ? 0.22 : 0.18, [PRE_BAR_X, y, 0], C.muted, C.muted, 0.16, 1);
    return new M.VGroup(bg, barL, name, dist, track);
  });

  await until(S(4));
  await play(
    ...outs([...houses, modelCard, qMark, personCard]),
    new M.FadeIn(preHead),
    new M.LaggedStart(preRows.map(r => new M.FadeIn(r)), { lagRatio: 0.10, runTime: 0.9 }),
    ...say('OUR FOUR HOMES')
  );

  const preFills = [];
  const preCols = [C.pink, C.cyan, C.amber, C.cyan];
  for (let i = 0; i < 4; i++) {
    const h = HOMES[i], y = preY(i), col = preCols[i];
    const fw = PRE_BAR_W * (h.risk / 100);
    const bar = rect(fw, P ? 0.22 : 0.18, [PRE_BAR_X - PRE_BAR_W / 2 + fw / 2, y, 0], col, col, 0.88, 1);
    const val = txt(`${h.risk}%`, P ? 19 : 21, col, [PRE_BAR_X + PRE_BAR_W / 2 + (P ? 0.68 : 0.82), y, 0], true, true);
    const g = new M.VGroup(bar, val);
    preFills.push(g);
    await until(S(5 + i));
    await play(new M.FadeIn(g, { runTime: 0.75 }), ...say(`HOME ${h.id}: ${h.risk}% PREDICTED RISK`, col));
  }

  // Reusable 0% to 100% risk axis (base line animated with Create, ticks/labels with FadeIn)
  function buildRiskAxis() {
    const line = seg([r2x(0), RL_Y, 0], [r2x(100), RL_Y, 0], C.muted, 3);
    const restParts = [];
    for (const v of [0, 20, 40, 60, 80, 100]) {
      restParts.push(seg([r2x(v), RL_Y - 0.10, 0], [r2x(v), RL_Y + 0.10, 0], C.muted, 2));
      restParts.push(txt(`${v}%`, P ? 15 : 16, C.muted, [r2x(v), RL_Y - 0.36, 0], true));
    }
    restParts.push(txt('predicted risk', P ? 15 : 17, C.muted, [0, RL_Y - (P ? 0.76 : 0.72), 0]));
    return { line, rest: new M.VGroup(...restParts) };
  }

  function homeMarker(h, col, tagText = null) {
    const x = r2x(h.risk), dy = P ? 0.34 : 0.26;
    const halo = new M.Dot({ point: [x, RL_Y + dy, 0], radius: P ? 0.24 : 0.22, color: col });
    halo.setFill(col, 0.20);
    const dot = new M.Dot({ point: [x, RL_Y + dy, 0], radius: 0.11, color: col });
    dot.setFill(col, 1);
    const lbl = T(`${h.id} · ${h.risk}%`, P ? 15 : 16, col, true, true);
    // centred above the dot on a dark backing, so a dividing line never runs through the words
    const ly = RL_Y + dy + (P ? 0.54 : 0.46);
    const lbg = rrect(lbl.getWidth() + 0.14, P ? 0.32 : 0.30, [x, ly, 0], C.bg, C.bg, 0.95, 0.5, 0.08);
    lbl.moveTo([x, ly, 0]);
    const parts = [halo, dot, lbg, lbl];
    if (tagText) {
      // phone: short tags ("AUTO" / "REVIEW"); the coloured zones already say routine or urgent
      const tag = P ? (tagText === 'REVIEW' ? 'REVIEW' : 'AUTO') : tagText;
      const tw = P ? 1.05 : 1.85;
      const ty = RL_Y + dy + (P ? 1.02 : 0.88);
      const tb = rrect(tw, 0.38, [x, ty, 0], col, C.bg, 0.92, 1.5, 0.11);
      const tt = txt(tag, 15, col, [x, ty, 0], true, true, tw - 0.14);
      parts.push(tb, tt);
    }
    return { g: new M.VGroup(...parts), dot };
  }

  const axis1 = buildRiskAxis();
  const m1 = HOMES.map((h, i) => homeMarker(h, preCols[i]));

  await until(S(9));
  await play(
    ...outs([preHead, ...preRows, ...preFills]),
    new M.Create(axis1.line, { runTime: 0.8 }),
    new M.FadeIn(axis1.rest, { runTime: 0.8 }),
    new M.LaggedStart(m1.map(m => new M.FadeIn(m.g)), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('PREDICTED RISK: 0% TO 100%')
  );

  // S(10): Original rule >= 50% today's list
  const cutTop = RL_Y + BAND_H + 0.10;
  const cutBot = RL_Y;
  const cut50 = new M.DashedLine({ start: [r2x(50), cutBot, -0.01], end: [r2x(50), cutTop, -0.01], color: C.pink });
  const cut50Lbl = txt('50%', P ? 16 : 17, C.pink, [r2x(50), cutTop + (P ? 0.26 : 0.20), 0], true, true);
  const rightZone = rect(r2x(100) - r2x(50), BAND_H, [(r2x(50) + r2x(100)) / 2, BAND_CY, -0.02], C.pink, C.pink, 0.12, 1);
  const rightLbl = txt('TODAY’S LIST (≥ 50%)', P ? 15 : 16, C.pink, [r2x(75), RL_Y + BAND_H - 0.24, 0], true, true, r2x(100) - r2x(50) - 0.25);

  await until(S(10));
  await play(
    new M.FadeIn(rightZone),
    new M.Create(cut50),
    new M.FadeIn(cut50Lbl),
    new M.FadeIn(rightLbl),
    ...say('ORIGINAL RULE: ≥ 50% → TODAY’S LIST', C.pink)
  );

  // S(11): Below 50% routine
  const leftZone = rect(r2x(50) - r2x(0), BAND_H, [(r2x(0) + r2x(50)) / 2, BAND_CY, -0.02], C.cyan, C.cyan, 0.10, 1);
  const leftLbl = txt('ROUTINE (< 50%)', P ? 15 : 16, C.cyan, [r2x(25), RL_Y + BAND_H - 0.24, 0], true, true, r2x(50) - r2x(0) - 0.25);
  await until(S(11));
  await play(new M.FadeIn(leftZone), new M.FadeIn(leftLbl), ...say('BELOW 50% → ROUTINE (CAN WAIT)', C.cyan));

  // S(12): Look at Home C sitting right at 50%
  const dotY = RL_Y + (P ? 0.34 : 0.26);
  const ringC = new M.Circle({ radius: P ? 0.36 : 0.32, color: C.amber, strokeWidth: 3 });
  ringC.setFill(C.amber, 0.08);
  ringC.moveTo([r2x(50), dotY, 0]);
  await until(S(12));
  await play(
    new M.Create(ringC),
    new M.Flash(m1[2].dot, { color: C.amber }),
    ...say('HOME C SITS EXACTLY AT 50%', C.amber)
  );

  // S(13): Small change flips the decision
  const arrL = arrow([r2x(48), dotY, 0], [r2x(38), dotY, 0], C.cyan, 2.5, 0.14);
  const arrR = arrow([r2x(52), dotY, 0], [r2x(62), dotY, 0], C.pink, 2.5, 0.14);
  await until(S(13));
  await play(
    new M.FadeIn(arrL),
    new M.FadeIn(arrR),
    ...fbox([
      ['49%  →  routine (wait)', C.cyan],
      ['51%  →  urgent  (today)', C.pink]
    ], C.amber),
    ...say('A SMALL CHANGE FLIPS THE DECISION', C.amber)
  );

  // S(14): Give requests near dividing point to a person instead
  const nearZone = rect(r2x(60) - r2x(40), BAND_H, [r2x(50), BAND_CY, -0.01], C.amber, C.amber, 0.22, 2);
  const nearCardY = P ? -2.40 : -2.05;
  const nearPerson = new M.VGroup(
    rrect(P ? 4.4 : 4.2, P ? 1.25 : 1.05, [r2x(50), nearCardY, 0], C.amber, C.card, 0.95, 2),
    person(r2x(50) - 1.35, nearCardY + 0.02, C.amber, P ? 0.78 : 0.68),
    txt('GIVE TO A PERSON', P ? 16 : 17, C.amber, [r2x(50) + 0.45, nearCardY, 0], true, true, 2.4)
  );
  const nearArr = arrow([r2x(50), nearCardY + (P ? 0.68 : 0.56), 0], [r2x(50), RL_Y - (P ? 0.96 : 0.92), 0], C.amber, 2.5, 0.15);
  await until(S(14));
  await play(
    ...outs([arrL, arrR]),
    ...clearBox(),
    new M.FadeIn(nearZone),
    new M.FadeIn(nearArr),
    new M.FadeIn(nearPerson),
    ...say('GIVE BORDERLINE CASES TO A PERSON?', C.amber)
  );

  // =========================================================================
  // ACT 3 (15-20): Three baskets, dispatcher, human review
  // =========================================================================
  const BK_Y = P ? 1.15 : 0.55;
  const BK_W = P ? 2.22 : 3.45;
  const BK_H = P ? 2.05 : 1.60;
  const BK_SP = P ? 2.48 : 3.95;
  const bkX = k => (k - 1) * BK_SP;

  function basketShell(k) {
    const x = bkX(k);
    const back = rrect(BK_W, BK_H, [x, BK_Y, 0], C.muted, C.card, 0.92, 2, 0.16);
    const lip = seg([x - BK_W / 2 + 0.18, BK_Y + BK_H / 2, 0], [x + BK_W / 2 - 0.18, BK_Y + BK_H / 2, 0], C.bg, 5);
    const num = txt(`BASKET ${k + 1}`, 15, C.muted, [x, BK_Y + BK_H / 2 - 0.30, 0], true, true);
    return new M.VGroup(back, lip, num);
  }

  function basketFill(k, title, sub, col) {
    const x = bkX(k);
    const frame = rrect(BK_W, BK_H, [x, BK_Y, 0], col, col, 0.13, 3, 0.16);
    const ttl = txt(title, P ? 18 : 21, col, [x, BK_Y + 0.04, 0], true, true, BK_W - 0.28);
    const s2 = txt(sub, 15, C.ink, [x, BK_Y - 0.38, 0], false, false, BK_W - 0.28);
    return new M.VGroup(frame, ttl, s2);
  }

  const shells = [0, 1, 2].map(basketShell);
  await until(S(15));
  await play(
    ...outs([axis1.line, axis1.rest, ...m1.map(m => m.g), cut50, cut50Lbl, rightZone, rightLbl, leftZone, leftLbl, ringC, nearZone, nearArr, nearPerson]),
    new M.LaggedStart(shells.map(s => new M.FadeIn(s)), { lagRatio: 0.14, runTime: 1.0 }),
    ...say('THREE BASKETS FOR REQUESTS')
  );

  const bk0 = basketFill(0, 'ROUTINE', 'visits can wait', C.cyan);
  await until(S(16));
  await play(new M.FadeIn(bk0), ...say('BASKET 1: ROUTINE VISITS', C.cyan));

  const bk1 = basketFill(1, 'EXAMINE', 'needs closer look', C.amber);
  await until(S(17));
  await play(new M.FadeIn(bk1), ...say('BASKET 2: NEEDS EXAMINATION', C.amber));

  const bk2 = basketFill(2, 'URGENT', 'visit today', C.pink);
  await until(S(18));
  await play(new M.FadeIn(bk2), ...say('BASKET 3: URGENT VISITS', C.pink));

  const dispY = P ? -1.85 : -1.35;
  const dispH = P ? 1.85 : 1.30;
  const dispCard = new M.VGroup(
    rrect(P ? 5.6 : 5.4, dispH, [0, dispY, 0], C.amber, C.card, 0.95, 2.2),
    person(-1.85, dispY + 0.02, C.amber, P ? 1.05 : 0.84),
    txt('DISPATCHER', P ? 20 : 21, C.amber, [0.65, dispY + 0.22, 0], true, true),
    txt('Examines requests & sends crews', P ? 15 : 16, C.ink, [0.65, dispY - 0.22, 0], false, false, P ? 3.2 : 3.3)
  );
  const dispArr = arrow([0, BK_Y - BK_H / 2 - 0.06, 0], [0, dispY + dispH / 2 + 0.06, 0], C.amber, 2.5, 0.16);
  await until(S(19));
  await play(new M.FadeIn(dispArr), new M.FadeIn(dispCard), ...say('DISPATCHER = PERSON WHO DECIDES', C.amber));

  const hrY = P ? -3.45 : -2.52;
  const hrTag = new M.VGroup(
    rrect(P ? 4.4 : 4.2, 0.52, [0, hrY, 0], C.amber, C.bg, 0.95, 2.5, 0.26),
    txt('HUMAN REVIEW', 19, C.amber, [0, hrY, 0], true, true)
  );
  await until(S(20));
  await play(
    new M.Indicate(bk1, { color: C.amber }),
    new M.FadeIn(hrTag),
    ...say('HUMAN REVIEW', C.amber)
  );

  // =========================================================================
  // ACT 4 (21-27): Return to risk line, 40% and 60% cuts, yellow abstention band
  // =========================================================================
  const axis2 = buildRiskAxis();
  await until(S(21));
  await play(
    ...outs([...shells, bk0, bk1, bk2, dispCard, dispArr, hrTag]),
    new M.Create(axis2.line, { runTime: 0.8 }),
    new M.FadeIn(axis2.rest, { runTime: 0.8 }),
    ...say('BACK TO THE RISK LINE')
  );

  const cut40 = seg([r2x(40), cutBot, 0], [r2x(40), cutTop, 0], C.amber, 3);
  const cut40Lbl = txt('40%', P ? 16 : 17, C.amber, [r2x(40), cutTop + (P ? 0.26 : 0.20), 0], true, true);
  await until(S(22));
  await play(new M.Create(cut40), new M.FadeIn(cut40Lbl), ...say('FIRST DIVIDING POINT: 40%', C.amber));

  const cut60 = seg([r2x(60), cutBot, 0], [r2x(60), cutTop, 0], C.amber, 3);
  const cut60Lbl = txt('60%', P ? 16 : 17, C.amber, [r2x(60), cutTop + (P ? 0.26 : 0.20), 0], true, true);
  await until(S(23));
  await play(new M.Create(cut60), new M.FadeIn(cut60Lbl), ...say('SECOND DIVIDING POINT: 60%', C.amber));

  const band4060 = rect(r2x(60) - r2x(40), BAND_H, [r2x(50), BAND_CY, -0.01], C.amber, C.amber, 0.28, 2);
  await until(S(24));
  await play(new M.FadeIn(band4060), ...say('YELLOW SPACE: 40% TO 60%', C.amber));

  const bandDisp = new M.VGroup(
    person(r2x(50), RL_Y + (P ? 0.94 : 0.72), C.amber, P ? 0.62 : 0.56),
    txt('DISPATCHER', 15, C.amber, [r2x(50), RL_Y + (P ? 0.44 : 0.28), 0], true, true, r2x(60) - r2x(40) - 0.12)
  );
  const zoneR = rect(r2x(40) - r2x(0), BAND_H, [(r2x(0) + r2x(40)) / 2, BAND_CY, -0.02], C.cyan, C.cyan, 0.09, 1);
  const zoneU = rect(r2x(100) - r2x(60), BAND_H, [(r2x(60) + r2x(100)) / 2, BAND_CY, -0.02], C.pink, C.pink, 0.10, 1);
  const zRLbl = txt('ROUTINE', 15, C.cyan, [r2x(20), RL_Y + BAND_H - 0.18, 0], true, true);
  const zULbl = txt('URGENT', 15, C.pink, [r2x(80), RL_Y + BAND_H - 0.18, 0], true, true);
  await until(S(25));
  await play(
    new M.FadeIn(bandDisp),
    new M.FadeIn(zoneR),
    new M.FadeIn(zoneU),
    new M.FadeIn(zRLbl),
    new M.FadeIn(zULbl),
    ...say('IN THIS RANGE → DISPATCHER DECIDES', C.amber)
  );

  await until(S(26));
  await play(
    ...fbox([
      ['abstention', C.amber],
      'holding back an automatic decision'
    ], C.amber),
    ...say('ABSTENTION', C.amber)
  );

  // phone: the band is narrow, so its name goes under the axis
  const abLbl = P
    ? txt('↑ ABSTENTION BAND', 16, C.amber, [r2x(50), RL_Y - 1.15, 0], true, true)
    : txt('ABSTENTION BAND', 15, C.amber, [r2x(50), RL_Y + BAND_H - 0.22, 0], true, true, r2x(60) - r2x(40) - 0.14);
  await until(S(27));
  await play(
    new M.Indicate(band4060, { color: C.amber }),
    new M.FadeIn(abLbl),
    ...fbox([
      ['abstention band  (40% to < 60%)', C.amber],
      'range where the model holds back'
    ], C.amber),
    ...say('ABSTENTION BAND', C.amber)
  );

  // =========================================================================
  // ACT 5 (28-32): Apply the new rule to Homes A, B, C, D
  // =========================================================================
  await until(S(28));
  await play(new M.FadeOut(bandDisp), ...clearBox(), ...say('TRY THE NEW RULE ON OUR 4 HOMES'));

  const mA = homeMarker(HOMES[0], C.pink, 'AUTO URGENT');
  await until(S(29));
  await play(new M.FadeIn(mA.g), new M.Flash(mA.dot, { color: C.pink }), ...say('HOME A (90%) → AUTO URGENT', C.pink));

  const mB = homeMarker(HOMES[1], C.cyan, 'AUTO ROUTINE');
  await until(S(30));
  await play(new M.FadeIn(mB.g), new M.Flash(mB.dot, { color: C.cyan }), ...say('HOME B (10%) → AUTO ROUTINE', C.cyan));

  const mC = homeMarker(HOMES[2], C.amber, 'REVIEW');
  await until(S(31));
  await play(new M.FadeIn(mC.g), new M.Flash(mC.dot, { color: C.amber }), ...say('HOME C (50%) → DISPATCHER EXAMINES', C.amber));

  const mD = homeMarker(HOMES[3], C.cyan, 'AUTO ROUTINE');
  await until(S(32));
  await play(new M.FadeIn(mD.g), new M.Flash(mD.dot, { color: C.cyan }), ...say('HOME D (30%) → AUTO ROUTINE', C.cyan));

  // =========================================================================
  // ACT 6 (33-37): Follow Home C to the dispatcher & read the note
  // =========================================================================
  const topY = P ? 2.05 : 0.85;
  const sideX = P ? 2.05 : 3.55;
  const cardW = P ? 3.05 : 3.60;
  const cardH = P ? 1.55 : 1.24;

  const homeCCard = new M.VGroup(
    rrect(cardW, cardH, [-sideX, topY, 0], C.amber, C.card, 0.95, 2.2),
    txt('Home C', P ? 20 : 22, C.ink, [-sideX, topY + 0.30, 0], false, true),
    txt('South · 50% risk', P ? 15 : 16, C.violet, [-sideX, topY - 0.04, 0], true),
    txt('IN REVIEW BAND', 15, C.amber, [-sideX, topY - 0.38, 0], true, true)
  );
  const dispCard2 = new M.VGroup(
    rrect(cardW, cardH, [sideX, topY, 0], C.amber, C.card, 0.95, 2.2),
    person(sideX, topY + 0.14, C.amber, P ? 0.86 : 0.72),
    txt('DISPATCHER', P ? 16 : 17, C.amber, [sideX, topY - 0.42, 0], true, true)
  );
  const flowArr = arrow([-sideX + cardW / 2 + 0.14, topY, 0], [sideX - cardW / 2 - 0.14, topY, 0], C.amber, 3, 0.18);

  await until(S(33));
  await play(
    ...outs([axis2.line, axis2.rest, cut40, cut40Lbl, cut60, cut60Lbl, band4060, zoneR, zoneU, zRLbl, zULbl, abLbl, mA.g, mB.g, mC.g, mD.g]),
    new M.FadeIn(homeCCard),
    new M.FadeIn(flowArr),
    new M.FadeIn(dispCard2),
    ...say('FOLLOW HOME C TO THE DISPATCHER', C.amber)
  );

  const noteY = P ? -0.35 : -0.58;
  const noteW = P ? 6.8 : 7.8;
  const noteH = P ? 1.75 : 1.18;
  const noteShell = new M.VGroup(
    rrect(noteW, noteH, [0, noteY, 0], C.amber, C.card, 0.96, 2.2),
    txt('NOTE FROM HOME C', P ? 16 : 17, C.amber, [0, noteY + (P ? 0.45 : 0.30), 0], true, true)
  );
  await until(S(34));
  await play(new M.FadeIn(noteShell), ...say('THE DISPATCHER READS A NOTE', C.amber));

  const noteText = txt('“Water is coming through the floor.”', P ? 20 : 22, C.ink, [0, noteY - (P ? 0.16 : 0.14), 0], false, true, noteW - 0.55);
  await until(S(35));
  await play(new M.FadeIn(noteText), ...say('“WATER IS COMING THROUGH THE FLOOR”', C.pink));

  await until(S(36));
  await play(
    ...fbox([
      ['model uses:  calls, pipe type', C.muted],
      ['note gives:  extra evidence not in model', C.violet]
    ], C.violet),
    ...say('EXTRA EVIDENCE OUTSIDE THE MODEL', C.violet)
  );

  const stampW = P ? 4.4 : 3.16;
  const stampY = P ? -2.05 : topY;
  const urgentStamp = new M.VGroup(
    rrect(stampW, 0.56, [0, stampY, 0], C.pink, C.bg, 0.96, 2.5, 0.14),
    txt('HOME C → TODAY’S LIST', 17, C.pink, [0, stampY, 0], true, true, stampW - 0.24)
  );
  const stampDot = new M.Dot({ point: [0, stampY, 0], radius: 0.01, color: C.pink });
  await until(S(37));
  await play(
    new M.FadeOut(flowArr),
    new M.FadeIn(urgentStamp),
    new M.Flash(stampDot, { color: C.pink }),
    ...say('DISPATCHER PUTS HOME C ON TODAY’S LIST', C.pink)
  );

  // =========================================================================
  // ACT 7 (38-42): Compare final decisions vs crew confirmation (fixed A-D order)
  // =========================================================================
  const TW = P ? [1.45, 2.15, 1.95, 1.75] : [2.15, 3.65, 2.95, 2.75];
  const T_TOT = TW.reduce((a, b) => a + b, 0);
  const T_LEFT = -T_TOT / 2;
  const tColX = j => T_LEFT + TW.slice(0, j).reduce((a, b) => a + b, 0) + TW[j] / 2;
  const T_HEAD_Y = P ? 2.85 : 1.42;
  const T_TOP = P ? 1.95 : 0.84;
  const T_STEP = P ? 1.12 : 0.65;
  const T_ROW_H = P ? 0.94 : 0.56;
  const tRowY = i => T_TOP - i * T_STEP;

  const tableBaseParts = [
    txt('Home', P ? 15 : 16, C.muted, [tColX(0), T_HEAD_Y, 0], false, true),
    txt('Risk (0–100%)', P ? 15 : 16, C.cyan, [tColX(1), T_HEAD_Y, 0], false, true, TW[1] - 0.08),
    txt('Final decision', P ? 15 : 16, C.amber, [tColX(2), T_HEAD_Y, 0], false, true, TW[2] - 0.08),
    txt('Crew urgent?', P ? 15 : 16, C.green, [tColX(3), T_HEAD_Y, 0], false, true, TW[3] - 0.08)
  ];

  const finalDec = [
    { label: 'TODAY', col: C.pink },
    { label: 'ROUTINE', col: C.cyan },
    { label: 'TODAY ★', col: C.pink },
    { label: 'ROUTINE', col: C.cyan }
  ];

  const stripW = TW[1] - (P ? 0.34 : 0.65);
  for (let i = 0; i < 4; i++) {
    const h = HOMES[i], y = tRowY(i), dc = dCol(h.district);
    const bg = rrect(T_TOT, T_ROW_H, [0, y, 0], C.line, C.card, i % 2 === 0 ? 0.88 : 0.56, 1.1, 0.09);
    const accent = seg([T_LEFT + 0.04, y - T_ROW_H * 0.32, 0], [T_LEFT + 0.04, y + T_ROW_H * 0.32, 0], dc, 4);
    const hName = txt(`Home ${h.id}`, P ? 16 : 19, C.ink, [tColX(0), y + (P ? 0.15 : 0.10), 0], false, true, TW[0] - 0.16);
    const hDist = txt(h.district, 15, dc, [tColX(0), y - (P ? 0.19 : 0.15), 0], true);

    const sx = tColX(1), sy = y - (P ? 0.15 : 0.12);
    const track = rect(stripW, P ? 0.16 : 0.13, [sx, sy, 0], C.muted, C.muted, 0.16, 1);
    const bandMini = rect(stripW * 0.2, P ? 0.16 : 0.13, [sx, sy, 0], C.amber, C.amber, 0.35, 1);
    const fw = stripW * (h.risk / 100);
    const fill = rect(fw, P ? 0.16 : 0.13, [sx - stripW / 2 + fw / 2, sy, 0], preCols[i], preCols[i], 0.85, 1);
    const rTxt = txt(`${h.risk}%`, P ? 15 : 17, preCols[i], [sx, y + (P ? 0.16 : 0.12), 0], true, true);

    const dec = finalDec[i];
    const decBg = rrect(TW[2] - 0.22, P ? 0.50 : 0.40, [tColX(2), y, 0], dec.col, dec.col, 0.14, 1.6, 0.10);
    const decTxt = txt(dec.label, 15, dec.col, [tColX(2), y, 0], true, true, TW[2] - 0.32);

    tableBaseParts.push(bg, accent, hName, hDist, track, bandMini, fill, rTxt, decBg, decTxt);
  }
  const tableBase = new M.VGroup(...tableBaseParts);

  await until(S(38));
  await play(
    ...outs([homeCCard, dispCard2, noteShell, noteText, urgentStamp]),
    ...clearBox(),
    new M.FadeIn(tableBase),
    ...say('FINAL DECISIONS vs CREW CHECK')
  );

  // S(39): Homes A, C, and D really need urgent visits
  const crewMarks = HOMES.map((h, i) => {
    const col = h.urgent ? C.green : C.muted;
    const x = tColX(3) - (P ? 0.34 : 0.48), y = tRowY(i);
    return new M.VGroup(
      rrect(P ? 0.82 : 1.02, P ? 0.44 : 0.36, [x, y, 0], col, col, h.urgent ? 0.15 : 0.05, 1.5, 0.09),
      txt(h.urgent ? 'YES' : 'NO', P ? 15 : 16, col, [x, y, 0], true, true)
    );
  });
  await until(S(39));
  await play(
    new M.LaggedStart(crewMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('CREWS CONFIRM URGENT: A, C, D', C.green)
  );

  // S(40): Homes A and C are on today's list
  const checkX = tColX(3) + (P ? 0.42 : 0.58);
  const checkA = txt('✓', P ? 24 : 26, C.green, [checkX, tRowY(0), 0], false, true);
  const checkB = txt('✓', P ? 22 : 24, C.muted, [checkX, tRowY(1), 0], false, true);
  const checkC = txt('✓', P ? 24 : 26, C.green, [checkX, tRowY(2), 0], false, true);
  const outA = rrect(T_TOT + 0.06, T_ROW_H + 0.05, [0, tRowY(0), 0], C.green, C.green, 0.04, 2.2, 0.10);
  const outC = rrect(T_TOT + 0.06, T_ROW_H + 0.05, [0, tRowY(2), 0], C.green, C.green, 0.04, 2.2, 0.10);
  await until(S(40));
  await play(
    new M.FadeIn(checkA),
    new M.FadeIn(checkB),
    new M.FadeIn(checkC),
    new M.Create(outA),
    new M.Create(outC),
    ...say('ON TODAY’S LIST: A AND C ✓', C.green)
  );

  // S(41): Home D is still a missed urgent visit
  const missX = txt('×', P ? 26 : 28, C.pink, [checkX, tRowY(3), 0], false, true);
  const outD = rrect(T_TOT + 0.06, T_ROW_H + 0.05, [0, tRowY(3), 0], C.pink, C.pink, 0.07, 2.8, 0.10);
  await until(S(41));
  await play(
    new M.FadeIn(missX),
    new M.Create(outD),
    ...say('HOME D: STILL A MISSED URGENT VISIT', C.pink)
  );

  // S(42): Human review helps, does not remove every mistake
  await until(S(42));
  await play(
    ...fbox([
      ['Home C (50%): caught by human review ✓', C.green],
      ['Home D (30%): auto routine → missed ×', C.pink]
    ], C.amber),
    ...say('HELPS, BUT DOES NOT FIX EVERY MISTAKE', C.amber)
  );

  // =========================================================================
  // ACT 8 (43-49): Three-line decision rule & sliding the abstention band
  // =========================================================================
  const axis3 = buildRiskAxis();
  const makeBandRect = (lo, hi) => rect(r2x(hi) - r2x(lo), BAND_H, [(r2x(lo) + r2x(hi)) / 2, BAND_CY, -0.01], C.amber, C.amber, 0.28, 2);
  const makeZoneL = lo => rect(r2x(lo) - r2x(0), BAND_H, [(r2x(0) + r2x(lo)) / 2, BAND_CY, -0.02], C.cyan, C.cyan, 0.10, 1);
  const makeZoneR = hi => rect(r2x(100) - r2x(hi), BAND_H, [(r2x(hi) + r2x(100)) / 2, BAND_CY, -0.02], C.pink, C.pink, 0.10, 1);
  const makeCut = v => seg([r2x(v), cutBot, 0], [r2x(v), cutTop, 0], C.amber, 3);

  const dynBand = makeBandRect(40, 60);
  const dynLeft = makeZoneL(40);
  const dynRight = makeZoneR(60);
  const dynCutL = makeCut(40);
  const dynCutR = makeCut(60);
  const cutLblY = cutTop + (P ? 0.26 : 0.20);
  let lblCutL = txt('40%', P ? 16 : 17, C.amber, [r2x(40), cutLblY, 0], true, true);
  let lblCutR = txt('60%', P ? 16 : 17, C.amber, [r2x(60), cutLblY, 0], true, true);

  await until(S(43));
  await play(
    ...outs([tableBase, ...crewMarks, checkA, checkB, checkC, outA, outC, missX, outD]),
    new M.Create(axis3.line, { runTime: 0.7 }),
    new M.FadeIn(axis3.rest, { runTime: 0.7 }),
    new M.FadeIn(dynCutL),
    new M.FadeIn(dynCutR),
    new M.FadeIn(lblCutL),
    new M.FadeIn(lblCutR),
    ...fbox([['OUR NEW DECISION RULE', C.cyan]], C.cyan),
    ...say('THE RULE IN THREE SHORT LINES')
  );

  // S(44): Below 40% -> routine
  await until(S(44));
  await play(
    new M.FadeIn(dynLeft),
    ...fbox([
      ['< 40%          →  routine list', C.cyan]
    ], C.cyan),
    ...say('BELOW 40% → ROUTINE LIST', C.cyan)
  );

  // S(45): 40% up to, not including, 60% -> human review
  const incDot40 = new M.Dot({ point: [r2x(40), RL_Y, 0], radius: 0.10, color: C.amber });
  incDot40.setFill(C.amber, 1);
  const excDot60 = new M.Circle({ radius: 0.10, color: C.amber, strokeWidth: 2.5 });
  excDot60.setFill(C.bg, 1);
  excDot60.moveTo([r2x(60), RL_Y, 0]);
  await until(S(45));
  await play(
    new M.FadeIn(dynBand),
    new M.FadeIn(incDot40),
    new M.FadeIn(excDot60),
    ...fbox([
      ['< 40%          →  routine list', C.cyan],
      ['40% to < 60%   →  human review', C.amber]
    ], C.amber),
    ...say('40% UP TO < 60% → HUMAN REVIEW', C.amber)
  );

  // S(46): 60% or more -> urgent
  const incDot60 = new M.Dot({ point: [r2x(60), RL_Y, 0], radius: 0.10, color: C.pink });
  incDot60.setFill(C.pink, 1);
  await until(S(46));
  await play(
    new M.FadeIn(dynRight),
    new M.FadeOut(excDot60),
    new M.FadeIn(incDot60),
    ...fbox([
      ['< 40%          →  routine list', C.cyan],
      ['40% to < 60%   →  human review', C.amber],
      ['≥ 60%          →  urgent list', C.pink]
    ], C.pink),
    ...say('60% OR MORE → URGENT LIST', C.pink)
  );

  // S(47): Move the two dividing points
  const m2 = HOMES.map((h, i) => homeMarker(h, preCols[i]));
  const moveArrY = RL_Y + BAND_H - 0.24;
  const moveArrL = arrow([r2x(40), moveArrY, 0], [r2x(30), moveArrY, 0], C.amber, 2.2, 0.12);
  const moveArrR = arrow([r2x(60), moveArrY, 0], [r2x(70), moveArrY, 0], C.amber, 2.2, 0.12);
  await until(S(47));
  await play(
    ...outs([incDot40, incDot60]),
    new M.LaggedStart(m2.map(m => new M.FadeIn(m.g)), { lagRatio: 0.08, runTime: 0.8 }),
    new M.FadeIn(moveArrL),
    new M.FadeIn(moveArrR),
    ...say('MOVE THE TWO DIVIDING POINTS', C.amber)
  );

  // S(48): Wider abstention band (25% to 75%) -> more requests to dispatcher (C and D)
  const lbl25 = txt('25%', P ? 16 : 17, C.amber, [r2x(25), cutLblY, 0], true, true);
  const lbl75 = txt('75%', P ? 16 : 17, C.amber, [r2x(75), cutLblY, 0], true, true);
  await until(S(48));
  await play(
    ...outs([moveArrL, moveArrR, lblCutL, lblCutR]),
    new M.Transform(dynBand, makeBandRect(25, 75), { runTime: 1.0 }),
    new M.Transform(dynLeft, makeZoneL(25), { runTime: 1.0 }),
    new M.Transform(dynRight, makeZoneR(75), { runTime: 1.0 }),
    new M.Transform(dynCutL, makeCut(25), { runTime: 1.0 }),
    new M.Transform(dynCutR, makeCut(75), { runTime: 1.0 }),
    new M.FadeIn(lbl25),
    new M.FadeIn(lbl75),
    ...fbox([
      ['wider band: 25% to < 75%', C.amber],
      ['dispatcher examines: 2 homes (C, D)', C.ink]
    ], C.amber),
    ...say('WIDER BAND → MORE REQUESTS TO DISPATCHER', C.amber)
  );
  lblCutL = lbl25;
  lblCutR = lbl75;

  // S(49): Narrower abstention band (45% to 55%) -> more decisions to model
  const lbl45 = txt('45%', P ? 15 : 16, C.amber, [r2x(45) - (P ? 0.18 : 0.08), cutLblY, 0], true, true);
  const lbl55 = txt('55%', P ? 15 : 16, C.amber, [r2x(55) + (P ? 0.18 : 0.08), cutLblY, 0], true, true);
  await until(S(49));
  await play(
    ...outs([lblCutL, lblCutR]),
    new M.Transform(dynBand, makeBandRect(45, 55), { runTime: 1.0 }),
    new M.Transform(dynLeft, makeZoneL(45), { runTime: 1.0 }),
    new M.Transform(dynRight, makeZoneR(55), { runTime: 1.0 }),
    new M.Transform(dynCutL, makeCut(45), { runTime: 1.0 }),
    new M.Transform(dynCutR, makeCut(55), { runTime: 1.0 }),
    new M.FadeIn(lbl45),
    new M.FadeIn(lbl55),
    ...fbox([
      ['narrower band: 45% to < 55%', C.violet],
      ['model decides: 3 of 4 homes automatically', C.ink]
    ], C.violet),
    ...say('NARROWER BAND → MORE AUTOMATIC DECISIONS', C.violet)
  );
  lblCutL = lbl45;
  lblCutR = lbl55;

  // =========================================================================
  // ACT 9 (50-53): When useful, caution, audit all decisions, final recap
  // =========================================================================
  const lbl40b = txt('40%', P ? 16 : 17, C.amber, [r2x(40), cutLblY, 0], true, true);
  const lbl60b = txt('60%', P ? 16 : 17, C.amber, [r2x(60), cutLblY, 0], true, true);
  await until(S(50));
  await play(
    ...outs([lblCutL, lblCutR]),
    new M.Transform(dynBand, makeBandRect(40, 60), { runTime: 0.9 }),
    new M.Transform(dynLeft, makeZoneL(40), { runTime: 0.9 }),
    new M.Transform(dynRight, makeZoneR(60), { runTime: 0.9 }),
    new M.Transform(dynCutL, makeCut(40), { runTime: 0.9 }),
    new M.Transform(dynCutR, makeCut(60), { runTime: 0.9 }),
    new M.FadeIn(lbl40b),
    new M.FadeIn(lbl60b),
    ...fbox([
      ['useful when a person can check', C.green],
      ['extra information before deciding', C.ink]
    ], C.green),
    ...say('USEFUL WITH EXTRA INFORMATION', C.green)
  );

  await until(S(51));
  await play(
    ...fbox([
      ['be careful:', C.pink],
      ['• people can also make mistakes', C.ink],
      ['• more review takes more time', C.amber]
    ], C.pink),
    ...say('TRADE-OFF: TIME & HUMAN MISTAKES', C.pink)
  );

  const auditBox = rrect(RL_W + 0.24, BAND_H + 0.20, [0, BAND_CY, 0], C.cyan, C.cyan, 0.04, 2.5, 0.14);
  await until(S(52));
  await play(
    new M.Create(auditBox),
    ...fbox([
      ['check ALL final decisions:', C.cyan],
      ['human-reviewed AND automatic', C.ink]
    ], C.cyan),
    ...say('CHECK ALL FINAL DECISIONS', C.cyan)
  );

  await until(S(53));
  await play(
    new M.FadeOut(auditBox),
    new M.Indicate(dynBand, { color: C.amber }),
    ...fbox([
      ['abstention band (40% to < 60%)', C.amber],
      ['leaves selected decisions to a person', C.ink],
      ['instead of relying only on the model', C.green]
    ], C.amber),
    ...say('ABSTENTION BAND = SELECTIVE HUMAN REVIEW', C.amber)
  );
}
