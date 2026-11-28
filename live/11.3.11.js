// 11.3.11 Change points. Beat i follows sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const SC = C.pink, LC = C.green, OC = C.amber, VC = C.violet;
  const D = [30, 31, 29, 30, 40, 41, 39, 40];
  const PILL = P ? [0, 2.75, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [4.5, -0.3, 0];
  const BOXMAX = P ? FW - 1.0 : 4.3;

  const CX = P ? 0.15 : -2.5;
  const SP = P ? 0.84 : 0.8;
  const YB = P ? -2.7 : -2.45;
  const YU = P ? 0.32 : 0.255;
  const x = w => CX + (w - 4.5) * SP;
  const y = v => YB + (v - 28) * YU;

  const point = (a, b) => [a, b, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, a, b, color = C.ink, size = 20, mono = true) =>
    T(String(text), size, color, mono).moveTo(point(a, b));
  const line = (x0, y0, x1, y1, color = C.muted, w = 2) =>
    new M.Line({ start: point(x0, y0), end: point(x1, y1), color, strokeWidth: w });
  const dashed = (x0, y0, x1, y1, color = C.muted) =>
    new M.DashedLine({ start: point(x0, y0), end: point(x1, y1), color });
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
  function clearBox() { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; }

  // ---------- 0-2: intro ----------
  function crate(cx, cy) {
    const r = new M.Rectangle({ width: 0.9, height: 0.75, color: SC, strokeWidth: 2.5 });
    r.setFill(SC, 0.18);
    r.moveTo(point(cx, cy));
    return new M.VGroup(r, line(cx - 0.45, cy + 0.15, cx + 0.45, cy + 0.15, SC, 1.5));
  }
  const IY = P ? 0.4 : 0.1;
  const crates = [-1.2, 0, 1.2].map(dx => crate(CX + dx, IY));
  const introT = label('SOUTH: about 30 cases a week', CX, IY - 0.85, SC, 22);
  const moreT = label('new weeks: more customers', CX, IY - 1.4, OC, 21, false);
  await until(S(0));
  await play(...crates.map(fade), fade(introT), ...say('SOUTH ORDERS ABOUT 30 A WEEK', SC));
  await until(S(1));
  await play(fade(moreT), ...say('MORE CUSTOMERS IN NEW WEEKS', OC));
  await until(S(2));
  await play(pulse(introT, OC), ...say('WHEN DID 30 STOP BEING A GOOD GUIDE?', OC));

  // ---------- 3-5: the chart ----------
  const left = x(1) - 0.5, right = x(8) + 0.5;
  const axisParts = [line(left, YB, right, YB, C.muted, 2), line(left, YB, left, y(42.5), C.muted, 2)];
  for (const v of [30, 35, 40]) {
    axisParts.push(line(left, y(v), right, y(v), C.grid, 1), label(v, left - 0.33, y(v), C.muted, 18));
  }
  for (let w = 1; w <= 8; w++) axisParts.push(label(w, x(w), YB - 0.28, C.muted, 18));
  axisParts.push(label('week', CX, YB - 0.62, C.muted, 17, false), label('cases', left + 0.3, y(42.5) + 0.22, C.muted, 17, false));
  const axes = new M.VGroup(...axisParts);
  const dots = D.map((v, i) => {
    const halo = new M.Dot({ point: point(x(i + 1), y(v)), radius: 0.17, color: SC });
    halo.setFill(SC, 0.18);
    const d = new M.Dot({ point: point(x(i + 1), y(v)), radius: 0.08, color: SC });
    return new M.VGroup(halo, d, label(v, x(i + 1) + 0.3, y(v) + 0.2, SC, 17));
  });
  await until(S(3));
  await play(...crates.map(out), out(introT), out(moreT), fade(axes), ...say('EIGHT WEEKS AT SOUTH', SC));
  await until(S(4));
  await play(new M.LaggedStart(dots.slice(0, 4).map(fade), { lagRatio: 0.25, runTime: 1.2 }), ...fbox([['weeks 1-4:', SC], ['30, 31, 29, 30', SC]], SC), ...say('30, 31, 29, 30', SC));
  await until(S(5));
  await play(new M.LaggedStart(dots.slice(4).map(fade), { lagRatio: 0.25, runTime: 1.2 }), ...fbox([['weeks 5-8:', SC], ['40, 41, 39, 40', SC]], SC), ...say('40, 41, 39, 40', SC));

  // helpers for levels and strokes
  const level = (a, b, v, color = LC) => line(x(a) - 0.4, y(v), x(b) + 0.4, y(v), color, 4);
  function strokes(a, b, v) {
    const objs = [];
    for (let w = a; w <= b; w++) {
      const d = Math.abs(D[w - 1] - v);
      if (d === 0) continue;
      objs.push(line(x(w), y(v), x(w), y(D[w - 1]), VC, 3));
      objs.push(label(Number.isInteger(d) ? d : d.toFixed(1), x(w) - 0.24, (y(v) + y(D[w - 1])) / 2, VC, 16));
    }
    return objs;
  }
  function divider(k) {
    const xx = x(k) + SP / 2;
    return new M.VGroup(dashed(xx, YB, xx, y(42.5), LC),
      label(`split after week ${k}`, xx, YB - 0.95, LC, P ? 18 : 18, false));
  }

  // ---------- 6-11: one flat line ----------
  const flat = level(1, 8, 35, OC);
  const flatStrokes = strokes(1, 8, 35);
  await until(S(6));
  await play(draw(flat), ...fbox([['one flat line', OC], ['280 ÷ 8 = 35', OC]], OC), ...say('ONE LINE AT THE AVERAGE: 35', OC));
  await until(S(7));
  await play(new M.LaggedStart(flatStrokes.filter((_, i) => i % 2 === 0).map(draw), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox([['a stroke from', VC], ['each dot to the line', VC]], VC), ...say('A STROKE FROM EACH DOT', VC));
  await until(S(8));
  await play(pulse(dots[0], VC), fade(flatStrokes[1]), ...fbox([['30 to 35: 5 cases', VC]], VC), ...say('30 IS 5 AWAY', VC));
  await until(S(9));
  await play(pulse(dots[4], VC), fade(flatStrokes[9]), ...fbox([['40 to 35: 5 cases', VC]], VC), ...say('40 IS ALSO 5 AWAY', VC));
  await until(S(10));
  await play(...flatStrokes.filter((_, i) => i % 2 === 1 && i !== 1 && i !== 9).map(fade),
    ...fbox([['length only:', VC], ['above and below', C.ink], ['count the same', C.ink]], VC), ...say('COUNT LENGTHS, NOT DIRECTIONS', VC));
  await until(S(11));
  await play(...fbox([['5+4+6+5 + 5+6+4+5', VC], ['= 40 cases', OC]], OC), ...say('TOTAL DISTANCE: 40', OC));

  // ---------- 12-17: split after week 4 ----------
  let div = divider(4);
  await until(S(12));
  await play(out(flat), ...flatStrokes.map(out), fade(div), ...fbox([['split after week 4', LC]], LC), ...say('A DIVIDER AFTER WEEK 4', LC));
  await until(S(13));
  await play(...fbox([['each side gets', C.ink], ['its own average line', LC]], LC), ...say('EACH SIDE: ITS OWN AVERAGE', LC));
  let lv1 = level(1, 4, 30), lv2 = level(5, 8, 40);
  await until(S(14));
  await play(draw(lv1), ...fbox([['(30+31+29+30) ÷ 4', C.ink], ['= 30', LC]], LC), ...say('FIRST FOUR: AVERAGE 30', LC));
  await until(S(15));
  await play(draw(lv2), ...fbox([['(40+41+39+40) ÷ 4', C.ink], ['= 40', LC]], LC), ...say('LAST FOUR: AVERAGE 40', LC));
  let st = [...strokes(1, 4, 30), ...strokes(5, 8, 40)];
  await until(S(16));
  await play(...st.map(fade), ...fbox([['left:  0 + 1 + 1 + 0', VC], ['right: 0 + 1 + 1 + 0', VC]], VC), ...say('TWO ON THE LINE, TWO ONE AWAY', VC));
  await until(S(17));
  await play(...fbox([['total distance', C.ink], ['= 4 cases', LC]], LC), ...say('TOTAL DISTANCE: 4', LC));

  function moveSplit(k, a1, a2) {
    const nd = divider(k), n1 = level(1, k, a1), n2 = level(k + 1, 8, a2);
    const anim = [out(div), out(lv1), out(lv2), ...st.map(out), fade(nd)];
    div = nd; lv1 = n1; lv2 = n2; st = [...strokes(1, k, a1), ...strokes(k + 1, 8, a2)];
    return anim;
  }

  // ---------- 18-21: after week 3 ----------
  await until(S(18));
  await play(...moveSplit(3, 30, 38), ...fbox([['split after week 3', LC]], LC), ...say('MOVE THE DIVIDER: AFTER WEEK 3', LC));
  await until(S(19));
  await play(draw(lv1), ...fbox([['(30+31+29) ÷ 3 = 30', LC]], LC), ...say('FIRST THREE: AVERAGE 30', LC));
  await until(S(20));
  await play(draw(lv2), ...fbox([['(30+40+41+39+40) ÷ 5', C.ink], ['= 38', LC]], LC), ...say('OTHER FIVE: AVERAGE 38', LC));
  await until(S(21));
  await play(...st.map(fade), ...fbox([['0 + 1 + 1', VC], ['+ 8 + 2 + 3 + 1 + 2', VC], ['= 18 cases', OC]], OC), ...say('TOTAL DISTANCE: 18', OC));

  // ---------- 22-25: after week 5 ----------
  await until(S(22));
  await play(...moveSplit(5, 32, 40), ...fbox([['split after week 5', LC]], LC), ...say('NOW TRY AFTER WEEK 5', LC));
  await until(S(23));
  await play(draw(lv1), ...fbox([['(30+31+29+30+40) ÷ 5', C.ink], ['= 32', LC]], LC), ...say('FIRST FIVE: AVERAGE 32', LC));
  await until(S(24));
  await play(draw(lv2), ...fbox([['(41+39+40) ÷ 3 = 40', LC]], LC), ...say('LAST THREE: AVERAGE 40', LC));
  await until(S(25));
  await play(...st.map(fade), ...fbox([['2 + 1 + 3 + 2 + 8', VC], ['+ 1 + 1 + 0', VC], ['= 18 cases', OC]], OC), ...say('ALSO 18', OC));

  // ---------- 26-28: every split ----------
  const TOT = [34.3, 29, 18, 4, 18, 29, 34.3];
  const MX = P ? 0 : 4.5, MB = P ? -6.55 : -2.0, MS = P ? 0.85 : 0.6, MU = P ? 0.055 : 0.07;
  const mx = k => MX + (k - 4) * MS;
  const miniBars = TOT.map((t, i) => {
    const r = new M.Rectangle({ width: MS * 0.7, height: t * MU, color: i === 3 ? LC : C.muted, strokeWidth: 2 });
    r.setFill(i === 3 ? LC : C.muted, i === 3 ? 0.85 : 0.35);
    return r.moveTo(point(mx(i + 1), MB + t * MU / 2));
  });
  const miniVals = TOT.map((t, i) => label(t, mx(i + 1), MB + t * MU + 0.2, i === 3 ? LC : C.ink, P ? 16 : 15));
  const miniK = TOT.map((_, i) => label(i + 1, mx(i + 1), MB - 0.25, C.muted, 16));
  const miniT = label('total distance, split after week ...', MX, MB + 34.3 * MU + 0.6, C.ink, P ? 17 : 16, false);
  const mini = [...miniBars, ...miniVals, ...miniK, miniT];
  await until(S(26));
  await play(...clearBox(), ...mini.map(fade), ...say('CHECK EVERY OTHER SPLIT'));
  await until(S(27));
  await play(pulse(miniBars[3], LC), ...say('ALL OTHERS ARE MORE THAN 4', LC));
  await until(S(28));
  await play(...mini.map(out), ...moveSplit(4, 30, 40), ...fbox([['best split:', LC], ['after week 4', LC], ['total distance 4', LC]], LC),
    ...say('BACK TO AFTER WEEK 4', LC));
  await play(draw(lv1), draw(lv2), ...st.map(fade));

  // ---------- 29-34: change point ----------
  const ring5 = new M.Circle({ radius: 0.3, color: OC, strokeWidth: 3.5 });
  ring5.setFill(C.bg, 0);
  ring5.moveTo(point(x(5), y(40)));
  await until(S(29));
  await play(draw(ring5), ...fbox([['week 5: the first week', OC], ['at the higher level', OC]], OC), ...say('WEEK 5: FIRST WEEK AT THE NEW LEVEL', OC));
  await until(S(30));
  await play(pulse(ring5, OC), ...fbox([['change point', OC], ['= first week of', C.ink], ['a lasting shift', C.ink]], OC), ...say('CHANGE POINT = WEEK 5', OC));
  await until(S(31));
  await play(...fbox([['week 5: a new apartment', C.ink], ['block opened near South', C.ink]], SC), ...say('NEW APARTMENT BLOCK IN WEEK 5', SC));
  await until(S(32));
  await play(pulse(lv1, LC), pulse(lv2, LC), ...fbox([['try each split', LC], ['each side gets', C.ink], ['its own average', C.ink]], LC), ...say('TRY EACH SPLIT', LC));
  await until(S(33));
  await play(...st.map(s => pulse(s, VC)), ...fbox([['add the distances', VC], ['pick the smallest total', LC]], LC), ...say('PICK THE SMALLEST TOTAL', LC));
  await until(S(34));
  await play(...fbox([['use it when the old level', C.ink], ['may no longer guide', C.ink], ['your orders', C.ink]], C.cyan), ...say('USE IT WHEN THE OLD LEVEL SEEMS WRONG'));

  // ---------- 35-38: cost, trap, recap ----------
  const oldLine = dashed(x(5) - 0.4, y(30), x(8) + 0.4, y(30), OC);
  const shorts = [5, 6, 7, 8].map(w => line(x(w) + 0.12, y(30), x(w) + 0.12, y(D[w - 1]), C.pink, 4));
  const shortTxt = [5, 6, 7, 8].map(w => label(D[w - 1] - 30, x(w) - 0.2, y(35), C.pink, 17));
  await until(S(35));
  await play(...st.map(out), out(ring5), draw(oldLine), ...shorts.map(draw), ...shortTxt.map(fade),
    ...fbox([['order 30 after week 4:', OC], ['short 10, 11, 9, 10', C.pink], ['about 10 each week', C.pink]], C.pink), ...say('ABOUT 10 CASES SHORT EACH WEEK', C.pink));
  await until(S(36));
  await play(...shorts.map(out), ...shortTxt.map(out), out(oldLine), pulse(dots[4], C.pink),
    ...fbox([['trap: one unusual week', C.pink], ['is not a lasting shift', C.pink]], C.pink), ...say('TRAP: ONE ODD WEEK IS NOT A SHIFT', C.pink));
  await until(S(37));
  await play(new M.LaggedStart([4, 5, 6, 7].map(i => pulse(dots[i], LC)), { lagRatio: 0.3, runTime: 1.4 }), pulse(lv2, LC),
    ...fbox([['look for several weeks', C.ink], ['near the new line', LC]], LC), ...say('SEVERAL WEEKS NEAR THE NEW LINE', LC));
  await until(S(38));
  const ring5b = new M.Circle({ radius: 0.3, color: OC, strokeWidth: 3.5 });
  ring5b.setFill(C.bg, 0);
  ring5b.moveTo(point(x(5), y(40)));
  await play(draw(ring5b), ...fbox([['change point: week 5', OC], ['new level 40 holds', LC], ['in later weeks', LC]], OC), ...say('A NEW LEVEL BEGINS AND HOLDS', OC));
}
