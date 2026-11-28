// 11.3.9 Multiseries dependence (vector autoregression). Beat i follows sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const NC = C.cyan, SC = C.pink, BC = C.amber, VC = C.violet;
  const PILL = P ? [0, 2.75, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.9, 0] : [4.5, -0.3, 0];
  const BOXMAX = P ? FW - 1.0 : 4.3;

  // bars on one cases scale
  const YB = P ? -3.3 : -2.35;
  const YU = P ? 0.085 : 0.0595;
  const y = v => YB + v * YU;
  const BW = 0.85;
  const XN = P ? -3.0 : -6.1;   // North this week
  const XS = P ? -1.8 : -4.9;   // South this week
  const XSN = P ? 1.2 : -2.0;   // South next week
  const XNN = P ? 2.6 : -0.6;   // North next week

  const point = (x, yy) => [x, yy, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, x, yy, color = C.ink, size = 20, mono = true) =>
    T(String(text), size, color, mono).moveTo(point(x, yy));
  const line = (x0, y0, x1, y1, color = C.muted, w = 2) =>
    new M.Line({ start: point(x0, y0), end: point(x1, y1), color, strokeWidth: w });
  const dashed = (x0, y0, x1, y1, color = C.muted) =>
    new M.DashedLine({ start: point(x0, y0), end: point(x1, y1), color });
  function arrow(x0, y0, x1, y1, color, w = 3) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const h = 0.18, wing = 0.1;
    return new M.VGroup(line(x0, y0, x1, y1, color, w),
      line(x1, y1, x1 - h * ux + wing * uy, y1 - h * uy - wing * ux, color, w),
      line(x1, y1, x1 - h * ux - wing * uy, y1 - h * uy + wing * ux, color, w));
  }
  // a bar piece from value a to value b
  function piece(x, a, b, color, text) {
    const r = new M.Rectangle({ width: BW, height: (b - a) * YU, color, strokeWidth: 2 });
    r.setFill(color, 0.85);
    r.moveTo(point(x, (y(a) + y(b)) / 2));
    return text == null ? r : new M.VGroup(r, label(text, x, (y(a) + y(b)) / 2, C.bg, P ? 19 : 18));
  }
  function slot(x, top) {
    const r = new M.Rectangle({ width: BW, height: top * YU, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.card, 0.6);
    return r.moveTo(point(x, (y(0) + y(top)) / 2));
  }
  const fade = o => new M.FadeIn(o, { runTime: 0.4 });
  const out = o => new M.FadeOut(o, { runTime: 0.3 });
  const draw = o => new M.Create(o, { runTime: 0.5 });
  const pulse = (o, color) => new M.Indicate(o, { color, runTime: 0.7 });

  let boxNow = null;
  function fbox(rows, color = C.cyan) {
    const size = P ? 23 : 21, rowHeight = P ? 0.46 : 0.42;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.6;
    const height = rows.length * rowHeight + 0.38;
    const card = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    card.setFill(C.card, 0.96);
    card.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo(point(BOXP[0] - width / 2 + 0.3 + t.getWidth() / 2,
      BOXP[1] + ((rows.length - 1) / 2 - i) * rowHeight)));
    const g = new M.VGroup(card, ...texts);
    if (width > BOXMAX) g.scale(BOXMAX / width);
    const a = [fade(g)];
    if (boxNow) a.push(out(boxNow));
    boxNow = g;
    return a;
  }

  // ---------- 0-1: the question ----------
  const CXI = P ? 0 : -3.3;
  function card(text, sub, color, x, yy) {
    const r = new M.RoundedRectangle({ width: P ? 3.3 : 3.4, height: 1.3, cornerRadius: 0.16, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95);
    r.moveTo(point(x, yy));
    return new M.VGroup(r, label(text, x, yy + 0.25, color, 24), label(sub, x, yy - 0.25, C.ink, 19, false));
  }
  const southCard = card('SOUTH', 'next week: ? cases', SC, P ? 0 : CXI + 2.0, P ? -1.6 : -0.6);
  const northCard = card('NORTH', 'a busy week', NC, P ? 0 : CXI - 2.0, P ? 0.9 : -0.6);
  const helpArrow = P ? arrow(0, 0.2, 0, -0.9, NC) : arrow(CXI - 0.25, -0.6, CXI + 0.25, -0.6, NC);
  await until(S(0));
  await play(fade(southCard), ...say('ORDERING WATER FOR SOUTH', SC));
  await until(S(1));
  await play(fade(northCard), draw(helpArrow), ...say('CAN NORTH’S BUSY WEEK HELP?', NC));

  // ---------- 2-4: two series ----------
  const RX = k => (P ? -2.4 : -6.0) + k * (P ? 1.2 : 1.25);
  const RN = P ? 0.9 : 0.5, RS = P ? -0.7 : -0.9;
  const rowN = [0, 1, 2, 3, 4].map(k => new M.Dot({ point: point(RX(k), RN), radius: 0.11, color: NC }));
  const rowS = [0, 1, 2, 3, 4].map(k => new M.Dot({ point: point(RX(k), RS), radius: 0.11, color: SC }));
  const rows = new M.VGroup(
    line(RX(0) - 0.3, RN, RX(4) + 0.3, RN, NC, 1.5), line(RX(0) - 0.3, RS, RX(4) + 0.3, RS, SC, 1.5),
    ...rowN, ...rowS,
    label('North', RX(0), RN + 0.42, NC, 19, false), label('South', RX(0), RS + 0.42, SC, 19, false),
    arrow(RX(0), RS - 0.65, RX(4), RS - 0.65, C.muted, 2), label('weeks', RX(2), RS - 0.95, C.muted, 17, false));
  const thisWk = label('this week', RX(4), RN + 0.42, C.ink, 18, false);
  const v40 = label('40', RX(4) + 0.45, RN, NC, 22);
  const v30 = label('30', RX(4) + 0.45, RS, SC, 22);
  await until(S(2));
  await play(out(southCard), out(northCard), out(helpArrow), fade(rows), ...say('TWO ROWS OF WEEKLY COUNTS'));
  await until(S(3));
  await play(new M.LaggedStart([...rowN, ...rowS].map(d => pulse(d, C.violet)), { lagRatio: 0.06, runTime: 1.0 }),
    ...fbox([['series =', VC], ['a row of counts', C.ink], ['over time', C.ink]], VC), ...say('A ROW OVER TIME = A SERIES', VC));
  await until(S(4));
  await play(fade(thisWk), fade(v40), fade(v30), ...fbox([['this week:', C.ink], ['North 40', NC], ['South 30', SC]], C.ink),
    ...say('THIS WEEK: NORTH 40, SOUTH 30'));

  // ---------- 5-6: bars and arrows ----------
  const thisN = piece(XN, 0, 40, NC);
  const thisS = piece(XS, 0, 30, SC);
  const tN = label('40', XN, y(40) + 0.25, NC, 22);
  const tS = label('30', XS, y(30) + 0.25, SC, 22);
  const slotS = slot(XSN, 30), slotN = slot(XNN, 40);
  const qS = label('?', XSN, y(15), C.muted, 26), qN = label('?', XNN, y(20), C.muted, 26);
  const base = line((P ? -3.6 : -6.7), YB, (P ? 3.3 : 0.0), YB, C.muted, 2);
  const nameNN = label('North', XNN, YB - 0.3, NC, 18, false);
  const names = new M.VGroup(
    label('North', XN, YB - 0.3, NC, 18, false), label('South', XS, YB - 0.3, SC, 18, false),
    label('South', XSN, YB - 0.3, SC, 18, false),
    label('this week', (XN + XS) / 2, YB - 0.7, C.ink, 19, false),
    label('next week', (XSN + XNN) / 2, YB - 0.7, C.ink, 19, false));
  const aSS = arrow(XS + BW / 2 + 0.05, y(30) - 0.1, XSN - BW / 2 - 0.05, y(30) - 0.1, SC);
  const aNS = arrow(XN + BW / 2 + 0.05, y(40) - 0.05, XSN - BW / 2 - 0.05, y(30) + 0.12, NC);
  const aNN = arrow(XN + BW / 2 + 0.05, y(40) + 0.12, XNN - BW / 2 - 0.05, y(40) + 0.12, NC);
  await until(S(5));
  await play(out(rows), out(thisWk), out(v40), out(v30), fade(base), fade(names), fade(nameNN),
    fade(thisN), fade(thisS), fade(tN), fade(tS), fade(slotS), fade(slotN), fade(qS), fade(qN),
    draw(aSS), draw(aNS), ...fbox([['2 arrows into', C.ink], ['South’s next-week box', SC]], SC),
    ...say('TWO ARROWS INTO SOUTH’S BOX', SC));
  await until(S(6));
  await play(draw(aNN), ...fbox([['1 arrow into', C.ink], ['North’s next-week box', NC]], NC),
    ...say('ONE ARROW INTO NORTH’S BOX', NC));

  // ---------- 7-10: South's forecast ----------
  const s5 = piece(XSN, 0, 5, BC, '5');
  const s15 = piece(XSN, 5, 20, SC, '15');
  const s10 = piece(XSN, 20, 30, NC, '10');
  const sTot = label('30', XSN, y(30) + 0.3, SC, 24);
  await until(S(7));
  await play(out(qS), fade(s5), ...fbox([['South: start with 5', BC]], BC), ...say('START SOUTH WITH 5', BC));
  await until(S(8));
  await play(fade(s15), pulse(thisS, SC), ...fbox([['half of South’s 30', SC], ['30 ÷ 2 = 15', SC]], SC), ...say('HALF OF SOUTH’S 30 = 15', SC));
  await until(S(9));
  await play(fade(s10), pulse(thisN, NC), ...fbox([['a quarter of North’s 40', NC], ['40 ÷ 4 = 10', NC]], NC), ...say('A QUARTER OF NORTH’S 40 = 10', NC));
  await until(S(10));
  await play(fade(sTot), ...fbox([['South next week', SC], ['5 + 15 + 10 = 30', SC]], SC), ...say('SOUTH NEXT WEEK: 30', SC));

  // ---------- 11-15: North's forecast ----------
  const n10 = piece(XNN, 0, 10, BC, '10');
  const n30 = piece(XNN, 10, 40, NC, '30');
  const nTot = label('40', XNN, y(40) + 0.3, NC, 24);
  await until(S(11));
  await play(pulse(slotN, NC), ...say('NOW NORTH’S BOX', NC));
  await until(S(12));
  await play(out(qN), fade(n10), ...fbox([['North: start with 10', BC]], BC), ...say('START NORTH WITH 10', BC));
  await until(S(13));
  await play(fade(n30), pulse(thisN, NC), ...fbox([['three quarters of 40', NC], ['= 30', NC]], NC), ...say('THREE QUARTERS OF 40 = 30', NC));
  await until(S(14));
  await play(fade(nTot), ...fbox([['North next week', NC], ['10 + 30 = 40', NC]], NC), ...say('NORTH NEXT WEEK: 40', NC));
  const g40 = dashed(XN + BW / 2, y(40), XNN - BW / 2, y(40), NC);
  const g30 = dashed(XS + BW / 2, y(30), XSN - BW / 2, y(30), SC);
  await until(S(15));
  await play(out(aNN), out(aSS), out(aNS), draw(g40), draw(g30),
    ...fbox([['North: 40 → 40', NC], ['South: 30 → 30', SC], ['both steady', C.green]], C.green),
    ...say('SAME HEIGHT: BOTH STEADY', C.green));

  // ---------- 16-22: promotion at North ----------
  const thisN60 = piece(XN, 0, 60, NC);
  const tN60 = label('60', XN, y(60) + 0.25, NC, 22);
  const promo = label('promotion', XN, y(60) + 0.62, C.amber, 18, false);
  const aNS2 = arrow(XN + BW / 2 + 0.05, y(58), XSN - BW / 2 - 0.05, y(32), NC);
  await until(S(16));
  await play(out(thisN), out(tN), out(g40), out(g30), out(n10), out(n30), out(nTot), out(slotN), out(nameNN),
    fade(thisN60), fade(tN60), fade(promo), draw(aNS2),
    ...fbox([['promotion at North', BC], ['this week: 60 cases', NC]], BC), ...say('PROMOTION: NORTH WANTS 60', BC));
  await until(S(17));
  await play(pulse(thisS, SC), ...fbox([['South this week:', SC], ['still 30', SC]], SC), ...say('SOUTH STAYS AT 30', SC));
  await until(S(18));
  await play(pulse(s5, BC), ...fbox([['start: still 5', BC]], BC), ...say('THE STARTING 5 STAYS', BC));
  await until(S(19));
  await play(pulse(s15, SC), ...fbox([['half of 30: still 15', SC]], SC), ...say('HALF OF SOUTH: STILL 15', SC));
  const s15n = piece(XSN, 20, 35, NC, '15');
  await until(S(20));
  await play(out(s10), out(sTot), fade(s15n), ...fbox([['a quarter of 60', NC], ['60 ÷ 4 = 15', NC]], NC),
    ...say('A QUARTER OF NORTH’S 60 = 15', NC));
  const sTot35 = label('35', XSN, y(35) + 0.3, SC, 24);
  await until(S(21));
  await play(fade(sTot35), ...fbox([['South next week', SC], ['5 + 15 + 15 = 35', SC]], SC), ...say('SOUTH NEXT WEEK: 35', SC));
  const old30 = dashed(XS + BW / 2, y(30), XSN + BW / 2 + 0.2, y(30), SC);
  const plus5 = label('+5', XSN + BW / 2 + 0.45, (y(30) + y(35)) / 2, C.green, 24);
  await until(S(22));
  await play(draw(old30), fade(plus5), ...fbox([['South’s own count: 30', SC], ['forecast: 30 → 35', SC], ['up 5', C.green]], C.green),
    ...say('SOUTH’S FORECAST RISES BY 5', C.green));

  // ---------- 23-30: names and rules ----------
  const backY = YB - 1.08;
  const back = arrow((XSN + XNN) / 2, backY, (XN + XS) / 2 + 0.3, backY, VC, 3);
  const backTxt = label('1 week earlier', (XN + XNN) / 2 + 0.3, backY - 0.32, VC, 18, false);
  await until(S(23));
  await play(draw(back), fade(backTxt), ...fbox([['inputs come from', C.ink], ['one week earlier', VC]], VC), ...say('INPUTS ARE ONE WEEK EARLIER', VC));
  await until(S(24));
  await play(pulse(thisN60, VC), pulse(thisS, VC), ...fbox([['lagged value', VC], ['= an earlier count', C.ink]], VC), ...say('LAGGED VALUE = AN EARLIER COUNT', VC));
  await until(S(25));
  await play(...fbox([['autoregression', VC], ['forecast from past', C.ink], ['counts in the rows', C.ink]], VC), ...say('AUTOREGRESSION', VC));
  await until(S(26));
  await play(...fbox([['vector = a list', VC], ['(North, South)', C.ink], ['= (60, 30)', C.ink]], VC), ...say('VECTOR = A LIST OF NUMBERS', VC));
  await until(S(27));
  await play(...fbox([['forecast the list', C.ink], ['together:', C.ink], ['vector autoregression', VC]], VC), ...say('VECTOR AUTOREGRESSION', VC));
  await until(S(28));
  await play(pulse(s5, BC), pulse(s15, SC), pulse(s15n, NC),
    ...fbox([['South next =', SC], ['5 + half of South', SC], ['  + a quarter of North', NC]], SC), ...say('SOUTH’S RULE', SC));
  await until(S(29));
  await play(pulse(thisN60, NC), ...fbox([['North next =', NC], ['10 + three quarters', NC], ['  of North', NC]], NC), ...say('NORTH’S RULE', NC));
  await until(S(30));
  await play(pulse(back, VC), ...fbox([['both rules use the', C.ink], ['week just before', VC]], VC), ...say('BOTH RULES LOOK ONE WEEK BACK', VC));

  // ---------- 31-34: use, trap, recap ----------
  await until(S(31));
  await play(pulse(aNS2, NC), ...fbox([['extra arrow:', NC], ['North helps predict', NC], ['South’s orders', SC]], NC), ...say('THE EXTRA ARROW HELPS FORECAST', NC));
  await until(S(32));
  await play(pulse(aNS2, C.pink), ...fbox([['trap: the arrow is', C.pink], ['not proof that', C.pink], ['shoppers moved', C.pink]], C.pink), ...say('TRAP: AN ARROW IS NOT PROOF', C.pink));
  await until(S(33));
  await play(pulse(thisN60, BC), pulse(thisS, BC), ...fbox([['a town event could', BC], ['make both stores busy', BC], ['in nearby weeks', BC]], BC), ...say('A TOWN EVENT COULD MOVE BOTH', BC));
  await until(S(34));
  await play(pulse(aNS2, NC), ...fbox([['earlier counts of North', NC], ['help forecast South', SC], ['= vector autoregression', VC]], VC), ...say('ONE STORE HELPS FORECAST ANOTHER', VC));
}
