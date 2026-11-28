// 16.3.4 Covariate shift. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.65, 0] : [4.3, -0.3, 0];
  const LX = P ? -3.2 : -5.7;
  const enter = o => new M.FadeIn(o, { runTime: 0.4 });
  const leave = o => new M.FadeOut(o, { runTime: 0.3 });
  const emph = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.6 });

  function label(text, x, y, maxW, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo([x, y, 0]); return t;
  }
  function leftLabel(text, x, y, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true); t.moveTo([x + t.getWidth() / 2, y, 0]); return t;
  }
  function rect(x, y, w, h, color, fill, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.13, color, strokeWidth: sw });
    if (fill) r.setFill(fill, 0.95); r.moveTo([x, y, 0]); return r;
  }
  let pillNow = null;
  function say(text, color = C.cyan) {
    const p = pill(text, color, P ? 18 : 19);
    const maxW = P ? FW - 0.8 : 7.25;
    if (p.getWidth() > maxW) p.scale(maxW / p.getWidth());
    p.moveTo(PILL);
    const a = pillNow ? [leave(pillNow)] : []; pillNow = p; a.push(enter(p)); return a;
  }
  let boxNow = null;
  function setBox(g) { const a = [enter(g)]; if (boxNow) a.push(leave(boxNow)); boxNow = g; return a; }
  function clearBox() { const a = boxNow ? [leave(boxNow)] : []; boxNow = null; return a; }
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    return setBox(g);
  }
  function card(name, route, x, y, w = 3.2) {
    const rc = route === 'North' ? C.cyan : C.pink;
    const box = rect(x, y, w, 0.66, C.line, C.card);
    const icon = rect(x - w / 2 + 0.38, y, 0.36, 0.32, rc, C.card, 1.5);
    const tape = new M.Line({ start: [x - w / 2 + 0.38, y + 0.15, 0], end: [x - w / 2 + 0.38, y + 0.02, 0], color: rc, strokeWidth: 2 });
    const nm = leftLabel(name, x - w / 2 + 0.75, y, C.ink, 20);
    const tagT = T(route, 16, rc, true, true);
    const tag = new M.VGroup(rect(x + w / 2 - 0.62, y, 0.98, 0.38, rc, C.bg, 1.5), tagT);
    tagT.moveTo([x + w / 2 - 0.62, y, 0]);
    return new M.VGroup(box, icon, tape, nm, tag);
  }
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: 2.5 });

  // 0-3 a depot with two routes
  const DY = P ? 0.2 : -0.4, DXc = P ? 0 : CX;
  const DW = P ? 2.0 : 2.6, DH = P ? 1.2 : 1.4, AE = P ? 3.4 : 4.2, TXo = P ? 2.3 : 3.0;
  const depot = new M.VGroup(rect(DXc, DY, DW, DH, C.amber, C.card), label('DEPOT', DXc, DY, null, C.amber, P ? 24 : 28, true));
  const aN = arrow([DXc - DW / 2 - 0.1, DY], [DXc - AE, DY], C.cyan), aS = arrow([DXc + DW / 2 + 0.1, DY], [DXc + AE, DY], C.pink);
  const tN = label('North', DXc - TXo, DY + 0.42, null, C.cyan, P ? 19 : 22, true), tS = label('South', DXc + TXo, DY + 0.42, null, C.pink, P ? 19 : 22, true);
  await until(S(0)); await play(enter(depot), new M.Create(aN), new M.Create(aS), enter(tN), enter(tS), ...say('ONE DEPOT, TWO ROUTES', C.amber));
  await until(S(1)); await play(...fbox(['Model', ['chance of late delivery', C.muted], ['for each parcel', C.muted]], C.violet));
  await until(S(2)); await play(...say('WHAT IF THE MIX OF PARCELS CHANGES?', C.amber));
  await until(S(3)); await play(...say('NOTICE IT BEFORE RESULTS ARRIVE?', C.amber));

  // 4-10 Monday's eight parcels
  const CW = P ? 3.2 : 3.0, XN = P ? -1.7 : CX - 1.75, XS = P ? 1.7 : CX + 1.75;
  const rowY = i => (P ? 1.15 : 0.85) - i * (P ? 0.78 : 0.72);
  const north = ['Nell', 'Oak', 'Pine', 'Reed'].map((n, i) => card(n, 'North', XN, rowY(i), CW));
  const south = ['Sage', 'Teal', 'Vale', 'Wren'].map((n, i) => card(n, 'South', XS, rowY(i), CW));
  const parcels = new M.VGroup(...Array.from({ length: 8 }, (_, k) => rect((P ? 0 : CX) + (k - 3.5) * (P ? 0.82 : 0.9), P ? 0.4 : 0.0, P ? 0.62 : 0.68, P ? 0.62 : 0.68, C.amber, C.card, 2)),
    label('8 parcels', P ? 0 : CX, P ? -0.45 : -0.85, null, C.amber, 22, true));
  await until(S(4)); await play(leave(depot), leave(aN), leave(aS), leave(tN), leave(tS), ...clearBox(), enter(parcels), ...say('MONDAY: 8 PARCELS LEAVE'));
  await until(S(5)); await play(leave(parcels), new M.LaggedStart(north.map(enter), { lagRatio: 0.2, runTime: 1.1 }), ...say('NELL, OAK, PINE, REED'));
  await until(S(6)); await play(new M.LaggedStart(north.map(c => emph(c.submobjects[4], C.cyan)), { lagRatio: 0.15, runTime: 1.0 }), ...say('ALL 4 PLANNED: NORTH', C.cyan));
  await until(S(7)); await play(new M.LaggedStart(south.map(enter), { lagRatio: 0.2, runTime: 1.1 }), ...say('SAGE, TEAL, VALE, WREN', C.pink));
  await until(S(8)); await play(new M.LaggedStart(south.map(c => emph(c.submobjects[4], C.pink)), { lagRatio: 0.15, runTime: 1.0 }), ...say('ALL 4 PLANNED: SOUTH', C.pink));
  const colN = new M.RoundedRectangle({ width: CW + 0.2, height: 4 * (P ? 0.78 : 0.72) + 0.05, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  colN.moveTo([XN, (rowY(0) + rowY(3)) / 2, 0]);
  const colS = new M.RoundedRectangle({ width: CW + 0.2, height: 4 * (P ? 0.78 : 0.72) + 0.05, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  colS.moveTo([XS, (rowY(0) + rowY(3)) / 2, 0]);
  await until(S(9)); await play(new M.Create(colN), new M.Create(colS), ...say('NORTH LEFT · SOUTH RIGHT'));
  const cntN = label('4 North', XN, rowY(3) - 0.7, null, C.cyan, 20, true), cntS = label('4 South', XS, rowY(3) - 0.7, null, C.pink, 20, true);
  await until(S(10)); await play(enter(cntN), enter(cntS), ...say('4 AND 4'));

  // 11-22 rows of blocks
  const PIT = P ? 0.78 : 0.72, BS = P ? 0.62 : 0.58, R1 = P ? 0.85 : 0.55, R2 = P ? -0.75 : -1.05, X0 = (P ? 0 : CX) - 3.5 * PIT;
  const bx = k => X0 + k * PIT;
  const blk = (k, y, c) => { const b = new M.Rectangle({ width: BS, height: BS, color: c, strokeWidth: 1.5 }); b.setFill(c, 0.75); b.moveTo([bx(k), y, 0]); return b; };
  const mon = [0, 1, 2, 3, 4, 5, 6, 7].map(k => blk(k, R1, k < 4 ? C.cyan : C.pink));
  const lat = [0, 1, 2, 3, 4, 5, 6, 7].map(k => blk(k, R2, k < 2 ? C.cyan : C.pink));
  let monT = leftLabel('Monday', X0 - BS / 2, R1 + 0.55, C.ink, 18);
  let latT = leftLabel('Later day', X0 - BS / 2, R2 + 0.55, C.ink, 18);
  await until(S(11)); await play(...[...north, ...south, colN, colS, cntN, cntS].map(leave), enter(monT), ...say('8 BLOCKS: 1 BLOCK = 1 PARCEL'));
  await until(S(12)); await play(new M.LaggedStart(mon.slice(0, 4).map(enter), { lagRatio: 0.2, runTime: 0.9 }), ...say('4 NORTH BLOCKS', C.cyan));
  await until(S(13)); await play(new M.LaggedStart(mon.slice(4).map(enter), { lagRatio: 0.2, runTime: 0.9 }), ...say('4 SOUTH BLOCKS', C.pink));
  const half = new M.Rectangle({ width: 4 * PIT + 0.05, height: BS + 0.2, color: C.amber, strokeWidth: 2.5 });
  half.moveTo([(bx(4) + bx(7)) / 2, R1, 0]);
  await until(S(14)); await play(new M.Create(half), ...say('SOUTH = HALF OF THE ROW', C.amber));
  await until(S(15)); await play(...fbox(['Monday', ['South = 50%', C.pink]], C.pink), ...say('50% OF MONDAY’S PARCELS: SOUTH', C.pink));
  await until(S(16)); await play(leave(half), ...say('ANOTHER DAY, SAME DEPOT', C.violet));
  await until(S(17)); await play(enter(latT), ...say('ANOTHER 8 PARCELS', C.violet));
  await until(S(18)); await play(new M.LaggedStart(lat.slice(0, 2).map(enter), { lagRatio: 0.25, runTime: 0.7 }), ...say('2 PLANNED NORTH', C.cyan));
  await until(S(19)); await play(new M.LaggedStart(lat.slice(2).map(enter), { lagRatio: 0.15, runTime: 1.0 }), ...say('6 PLANNED SOUTH', C.pink));
  await until(S(20)); await play(...clearBox(), ...say('A SECOND ROW UNDER MONDAY'));
  await until(S(21)); await play(...fbox(['Monday:    8 parcels', 'later day: 8 parcels', ['same total', C.green]], C.green), ...say('SAME TOTAL: 8', C.green));
  await until(S(22)); await play(new M.LaggedStart(lat.slice(2, 4).map(b => emph(b, C.pink)), { lagRatio: 0.3, runTime: 0.8 }), ...say('BUT THE MIX OF ROUTES CHANGES', C.amber));

  // 23-25 inputs and covariate shift
  await until(S(23)); await play(...fbox(['The model uses', ['the planned route', C.cyan]], C.violet));
  await until(S(24)); await play(...fbox(['Input', ['a piece of information', C.muted], ['that enters the model', C.muted]], C.violet));
  await until(S(25)); await play(...fbox(['Covariate shift', ['the mix of inputs', C.muted], ['changes', C.muted]], C.amber), ...say('COVARIATE SHIFT', C.amber));

  // 26-35 quarters
  await until(S(26)); await play(...clearBox(), ...say('HOW MUCH DID THE SOUTH SHARE CHANGE?', C.pink));
  const divs = [];
  for (const y of [R1, R2]) for (const k of [1, 2, 3]) {
    const x = (bx(2 * k - 1) + bx(2 * k)) / 2;
    divs.push(new M.DashedLine({ start: [x, y - BS / 2 - 0.12, 0], end: [x, y + BS / 2 + 0.12, 0], color: C.amber }));
  }
  const qLab = (y) => [0, 1, 2, 3].map(g => label('25%', (bx(2 * g) + bx(2 * g + 1)) / 2, y - BS / 2 - 0.28, null, C.muted, 18, true));
  const q1 = qLab(R1), q2 = qLab(R2);
  await until(S(27)); await play(new M.LaggedStart(divs.map(d => new M.Create(d)), { lagRatio: 0.12, runTime: 1.2 }), ...say('4 EQUAL GROUPS OF 2 BLOCKS', C.amber));
  await until(S(28)); await play(...q1.map(enter), ...q2.map(enter), ...say('EACH GROUP = 1 QUARTER = 25%', C.amber));
  const box = (g0, g1, y) => { const r = new M.Rectangle({ width: (g1 - g0 + 1) * 2 * PIT, height: BS + 0.22, color: C.pink, strokeWidth: 2.5 }); r.moveTo([(bx(2 * g0) + bx(2 * g1 + 1)) / 2, y, 0]); return r; };
  const mBox = box(2, 3, R1), lBox = box(1, 3, R2);
  await until(S(29)); await play(new M.Create(mBox), emph(q1[2], C.pink), emph(q1[3], C.pink), ...say('MONDAY: SOUTH FILLS 2 GROUPS', C.pink));
  const monT2 = leftLabel('Monday · 50% South', X0 - BS / 2, R1 + 0.55, C.pink, 18);
  await until(S(30)); await play(leave(monT), enter(monT2), ...fbox(['25 + 25 = 50%'], C.pink));
  monT = monT2;
  await until(S(31)); await play(new M.Create(lBox), ...say('LATER DAY: SOUTH FILLS 3 GROUPS', C.pink));
  const latT2 = leftLabel('Later day · 75% South', X0 - BS / 2, R2 + 0.55, C.pink, 18);
  await until(S(32)); await play(leave(latT), enter(latT2), ...fbox(['50 + 25 = 75%'], C.pink));
  latT = latT2;
  await until(S(33)); await play(emph(monT), emph(latT), ...say('SOUTH SHARE: 50% → 75%', C.pink));
  await until(S(34)); await play(...fbox(['75 − 50 = 25'], C.amber));
  await until(S(35)); await play(...fbox(['75% − 50%', ['= 25 percentage points', C.amber]], C.amber), ...say('25 PERCENTAGE POINTS', C.amber));

  // 36-38 formulas
  await until(S(36)); await play(...say('TWO SHORT FORMULAS'));
  await until(S(37)); await play(...fbox(['South % =', ' South ÷ total × 100', [' Monday: 4 ÷ 8 × 100 = 50', C.muted], [' later:  6 ÷ 8 × 100 = 75', C.muted]], C.pink));
  await until(S(38)); await play(...fbox(['change in points =', ' new % − old %', [' = 75 − 50', C.muted], [' = 25 percentage points', C.amber]], C.amber));

  // 39-47 what this check needs, and what it does not prove
  await until(S(39)); await play(...fbox(['We use planned routes', ['before any route', C.muted], ['is changed', C.muted]], C.cyan), ...say('PLANNED ROUTES, BEFORE ANY CHANGE'));
  await until(S(40)); await play(...fbox(['Late or on time?', ['not checked yet', C.muted]], C.muted), ...say('NO DELIVERY RESULTS USED', C.muted));
  await until(S(41)); await play(new M.LaggedStart([...mon, ...lat].map(b => emph(b, C.green)), { lagRatio: 0.04, runTime: 1.2 }), ...say('ONLY THE INCOMING INFORMATION', C.green));
  await until(S(42)); await play(...fbox(['Covariate shift check', ['notice a different', C.muted], ['mix of inputs', C.muted]], C.green));
  await until(S(43)); await play(...say('NEW SITUATIONS FOR THE MODEL', C.pink), ...fbox(['Model may now see', ['cases that were less', C.muted], ['common in training', C.muted]], C.pink));
  await until(S(44)); await play(...say('A NEW MIX ≠ PROOF OF MORE MISTAKES', C.amber));
  await until(S(45)); await play(...fbox(['To check predictions', ['we need actual', C.muted], ['delivery results', C.muted]], C.amber));
  await until(S(46)); await play(...fbox(['8 parcels per day', ['= an early clue', C.amber], ['check more parcels', C.muted]], C.amber), ...say('SMALL GROUPS: AN EARLY CLUE', C.amber));
  await until(S(47)); await play(...clearBox(), emph(lBox, C.pink), ...say('COVARIATE SHIFT = THE INPUT MIX CHANGES', C.pink));
}
