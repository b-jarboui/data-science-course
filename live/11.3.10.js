// 11.3.10 Hierarchical reconciliation. Beat i follows sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const NC = C.cyan, SC = C.pink, EC = C.amber, CC = C.violet, GC = C.green;
  const PILL = P ? [0, 2.7, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.4, 0] : [4.5, -0.3, 0];
  const BOXMAX = P ? FW - 1.0 : 4.3;

  const YB = P ? -3.0 : -2.55;
  const YU = P ? 0.0109 : 0.0083;
  const y = v => YB + v * YU;
  const XI = P ? [-3.1, -2.1, -1.1] : [-6.1, -5.1, -4.1];  // single store columns
  const IW = 0.8;
  const XST = P ? 1.0 : -2.4;   // store stack
  const XCH = P ? 2.85 : -0.55; // chain
  const CW = P ? 1.0 : 1.1;

  const point = (x, yy) => [x, yy, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, x, yy, color = C.ink, size = 20, mono = true) =>
    T(String(text), size, color, mono).moveTo(point(x, yy));
  const line = (x0, y0, x1, y1, color = C.muted, w = 2) =>
    new M.Line({ start: point(x0, y0), end: point(x1, y1), color, strokeWidth: w });
  const dashed = (x0, y0, x1, y1, color = C.muted) =>
    new M.DashedLine({ start: point(x0, y0), end: point(x1, y1), color });
  function block(x, a, b, color, w, fill = 0.85) {
    const r = new M.Rectangle({ width: w, height: Math.max(0.01, (b - a) * YU), color, strokeWidth: 2 });
    r.setFill(color, fill);
    return r.moveTo(point(x, (y(a) + y(b)) / 2));
  }
  function outline(x, a, b, color, w) {
    const r = new M.Rectangle({ width: w, height: (b - a) * YU, color, strokeWidth: 2 });
    r.setFill(color, 0.08);
    return r.moveTo(point(x, (y(a) + y(b)) / 2));
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

  // ---------- 0-1: one order for three stores ----------
  const CXI = P ? 0 : -3.3;
  function card(title, sub, color, x, yy, w = 2.0) {
    const r = new M.RoundedRectangle({ width: w, height: 1.05, cornerRadius: 0.14, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95);
    r.moveTo(point(x, yy));
    const g = [r, label(title, x, yy + (sub ? 0.2 : 0), color, 21)];
    if (sub) g.push(label(sub, x, yy - 0.22, C.ink, 18, false));
    return new M.VGroup(...g);
  }
  const supplier = card('SUPPLIER', 'one order', CC, CXI, P ? 1.3 : 0.7, 3.0);
  const storeX = P ? [-2.5, 0, 2.5] : [CXI - 2.4, CXI, CXI + 2.4];
  const storeY = P ? -1.4 : -1.6;
  const stores = [['NORTH', NC], ['SOUTH', SC], ['EAST', EC]].map(([n, c], k) => card(n, null, c, storeX[k], storeY, P ? 2.0 : 1.9));
  const links = storeX.map((sx, k) => line(CXI, (P ? 1.3 : 0.7) - 0.55, sx, storeY + 0.55, [NC, SC, EC][k], 2));
  await until(S(0));
  await play(fade(supplier), ...stores.map(fade), ...links.map(draw), ...say('ONE ORDER FOR THREE STORES', CC));
  await until(S(1));
  await play(...stores.map(s => pulse(s, C.ink)), ...fbox([['the order must agree', C.ink], ['with each store’s plan', C.ink]], C.ink),
    ...say('DOES THE ORDER MATCH THE STORES?', C.ink));

  // ---------- 2-4: three store forecasts ----------
  const base = line(P ? -3.7 : -6.7, YB, P ? 3.55 : 0.2, YB, C.muted, 2);
  const axisT = label('cases next week', P ? -2.4 : -5.4, y(440) + 0.25, C.muted, 17, false);
  const colN = block(XI[0], 0, 50, NC, IW), colS = block(XI[1], 0, 30, SC, IW), colE = block(XI[2], 0, 320, EC, IW);
  const vN = label('50', XI[0], y(50) + 0.25, NC, 21), vS = label('30', XI[1], y(30) + 0.25, SC, 21), vE = label('320', XI[2], y(320) + 0.25, EC, 21);
  const nN = label('North', XI[0], YB - 0.3, NC, 17, false), nS = label('South', XI[1], YB - 0.3, SC, 17, false), nE = label('East', XI[2], YB - 0.3, EC, 17, false);
  await until(S(2));
  await play(out(supplier), ...stores.map(out), ...links.map(out), fade(base), fade(axisT), fade(colN), fade(vN), fade(nN),
    ...fbox([['North: 50 cases', NC]], NC), ...say('NORTH FORECASTS 50 CASES', NC));
  await until(S(3));
  await play(fade(colS), fade(vS), fade(nS), ...fbox([['South: 30 cases', SC]], SC), ...say('SOUTH FORECASTS 30 CASES', SC));
  await until(S(4));
  await play(fade(colE), fade(vE), fade(nE), ...fbox([['East: 320 cases', EC]], EC), ...say('EAST FORECASTS 320 CASES', EC));

  // ---------- 5-9: the store stack and the chain ----------
  const segLX = XST - CW / 2 - 0.55;
  function stack(n, s, e) {
    const parts = [block(XST, 0, n, NC, CW), block(XST, n, n + s, SC, CW), block(XST, n + s, n + s + e, EC, CW)];
    const labs = [label(`N ${n}`, segLX, y(n / 2), NC, P ? 17 : 17), label(`S ${s}`, segLX, y(n + s / 2) + 0.06, SC, P ? 17 : 17),
      label(`E ${e}`, XST, y(n + s + e / 2), C.bg, P ? 20 : 20)];
    return { parts, labs, all: [...parts, ...labs] };
  }
  const stName = label('stores', XST, YB - 0.3, C.ink, 18, false);
  const chName = label('chain', XCH, YB - 0.3, CC, 18, false);
  const st80 = [block(XST, 0, 50, NC, CW), block(XST, 50, 80, SC, CW)];
  const st80l = [label('N 50', segLX, y(25), NC, 17), label('S 30', segLX, y(65) + 0.06, SC, 17)];
  const top80 = label('80', XST, y(80) + 0.25, C.ink, 21);
  await until(S(5));
  await play(out(colN), out(colS), out(vN), out(vS), out(nN), out(nS), ...st80.map(fade), ...st80l.map(fade), fade(top80), fade(stName),
    ...fbox([['50 + 30 = 80', C.ink]], C.ink), ...say('NORTH + SOUTH = 80'));
  let stk = stack(50, 30, 320);
  let stTop = label('400', XST, y(400) + 0.25, C.ink, 22);
  await until(S(6));
  await play(out(colE), out(vE), out(nE), out(top80), ...st80.map(out), ...st80l.map(out), ...stk.all.map(fade), fade(stTop),
    ...fbox([['80 + 320 = 400', C.ink]], C.ink), ...say('ADD EAST: 400 CASES'));
  let chain = block(XCH, 0, 440, CC, CW);
  let chTop = label('440', XCH, y(440) + 0.25, CC, 22);
  await until(S(7));
  await play(fade(chain), fade(chTop), fade(chName), ...fbox([['chain forecast: 440', CC]], CC), ...say('THE CHAIN’S OWN FORECAST: 440', CC));
  await until(S(8));
  await play(pulse(chain, CC), ...fbox([['chain =', CC], ['all three stores', C.ink], ['taken together', C.ink]], CC), ...say('CHAIN = ALL THREE STORES', CC));
  const gapLine = () => dashed(XST + CW / 2, y(400), XCH + CW / 2, y(400), EC);
  const gapMark = () => new M.VGroup(line((XST + XCH) / 2, y(400), (XST + XCH) / 2, y(440), EC, 4),
    label('40', (XST + XCH) / 2 + (P ? 0 : 0), y(440) + 0.25, EC, 21));
  let gL = gapLine(), gM = gapMark();
  await until(S(9));
  await play(draw(gL), fade(gM), ...fbox([['440 − 400 = 40', EC], ['the stack is 40 short', EC]], EC), ...say('THE STACK IS 40 SHORT', EC));

  // ---------- 10-14: names; option 1 bottom-up ----------
  await until(S(10));
  await play(pulse(stk.parts[2], C.ink), pulse(chain, CC),
    ...fbox([['hierarchy =', C.ink], ['parts (stores)', C.ink], ['+ their total (chain)', CC]], CC), ...say('PARTS AND TOTAL = A HIERARCHY', CC));
  await until(S(11));
  await play(...fbox([['reconciliation =', GC], ['make the levels', C.ink], ['agree', C.ink]], GC), ...say('RECONCILIATION', GC));
  await until(S(12));
  await play(...stk.parts.map(p => pulse(p, GC)), ...fbox([['option 1:', GC], ['keep the stores: 400', C.ink]], GC), ...say('OPTION 1: KEEP THE STORES', GC));
  const chain400 = block(XCH, 0, 400, CC, CW);
  const ch400Top = label('400', XCH, y(400) + 0.25, CC, 22);
  await until(S(13));
  await play(out(chain), out(chTop), out(gL), out(gM), fade(chain400), fade(ch400Top),
    ...fbox([['chain: 440 → 400', CC]], CC), ...say('BRING THE CHAIN DOWN TO 400', CC));
  await until(S(14));
  await play(pulse(chain400, GC), ...fbox([['bottom-up:', GC], ['the stores build', C.ink], ['the chain total', C.ink]], GC), ...say('BOTTOM-UP RECONCILIATION', GC));

  // ---------- 15-23: option 2 share in proportion ----------
  chain = block(XCH, 0, 440, CC, CW);
  chTop = label('440', XCH, y(440) + 0.25, CC, 22);
  await until(S(15));
  await play(out(chain400), out(ch400Top), fade(chain), fade(chTop), ...fbox([['option 2:', GC], ['keep the chain: 440', CC]], GC), ...say('OPTION 2: KEEP THE CHAIN AT 440', CC));
  let gapBox = outline(XST, 400, 440, EC, CW);
  const gapTxt = label('+40', XST + CW / 2 + 0.38, y(420), EC, 21);
  await until(S(16));
  await play(...fbox([['the stores must share', C.ink], ['40 extra cases', EC]], EC), ...say('THE STORES SHARE 40 EXTRA', EC));
  await until(S(17));
  await play(out(stTop), fade(gapBox), fade(gapTxt), ...fbox([['gap 40', EC], ['on top of 400', C.ink]], EC), ...say('THE 40 GAP NEXT TO THE 400', EC));
  stTop = null;
  await until(S(18));
  await play(pulse(gapBox, EC), ...fbox([['40 ÷ 400 = 10%', EC], ['1 case for every 10', C.ink]], EC), ...say('40 IS 10% OF 400', EC));
  await until(S(19));
  await play(...stk.parts.map(p => pulse(p, EC)), ...fbox([['each store gets', C.ink], ['+10% of its own', EC]], EC), ...say('EVERY STORE: +10% OF ITS OWN', EC));

  function restack(n, s, e, txt, color, say1) {
    const next = stack(n, s, e);
    const total = n + s + e;
    // the stack top number is shown again only when it reaches 440
    const nextTop = total === 440 ? label('440', XST, y(440) + 0.25, C.ink, 22) : null;
    const a = [...stk.all.map(out), ...next.all.map(fade), out(gapBox), out(gapTxt)];
    if (stTop) a.push(out(stTop));
    if (nextTop) a.push(fade(nextTop));
    stk = next; stTop = nextTop;
    if (total < 440) { gapBox = outline(XST, total, 440, EC, CW); a.push(fade(gapBox)); }
    return [...a, ...fbox(txt, color), ...say(say1, color)];
  }
  await until(S(20));
  await play(...restack(55, 30, 320, [['North: 50 + 5 = 55', NC]], NC, 'NORTH +5 = 55'));
  await until(S(21));
  await play(...restack(55, 33, 320, [['South: 30 + 3 = 33', SC]], SC, 'SOUTH +3 = 33'));
  await until(S(22));
  await play(...restack(55, 33, 352, [['East: 320 + 32 = 352', EC]], EC, 'EAST +32 = 352'));
  await until(S(23));
  await play(pulse(stk.parts[2], EC), ...fbox([['bigger block,', C.ink], ['bigger piece:', C.ink], ['+5   +3   +32', EC]], EC), ...say('BIGGER BLOCK, BIGGER PIECE', EC));

  // ---------- 24-30: check and multiplier ----------
  await until(S(24));
  await play(...stk.parts.map(p => pulse(p, GC)), ...say('CHECK THE STACK AGAIN', GC));
  await until(S(25));
  await play(pulse(stk.parts[0], NC), pulse(stk.parts[1], SC), ...fbox([['55 + 33 = 88', C.ink]], C.ink), ...say('55 + 33 = 88'));
  await until(S(26));
  await play(pulse(stTop, GC), ...fbox([['88 + 352 = 440', GC]], GC), ...say('88 + 352 = 440', GC));
  const match = line(XST - CW / 2, y(440), XCH + CW / 2, y(440), GC, 4);
  await until(S(27));
  await play(draw(match), ...fbox([['stores 440 = chain 440', GC]], GC), ...say('THE TWO HEIGHTS MATCH', GC));
  await until(S(28));
  await play(...fbox([['multiplier =', GC], ['chain ÷ store sum', C.ink], ['440 ÷ 400', C.ink]], GC), ...say('CHAIN ÷ STARTING STORE SUM', GC));
  await until(S(29));
  await play(...fbox([['440 ÷ 400 = 1.1', GC]], GC), ...say('1.1', GC));
  await until(S(30));
  await play(...fbox([['50 × 1.1 = 55', NC], ['30 × 1.1 = 33', SC], ['320 × 1.1 = 352', EC]], GC), ...say('MULTIPLY EACH STORE BY 1.1', GC));

  // ---------- 31-34: use, trap, recap ----------
  await until(S(31));
  await play(pulse(chain, CC), pulse(stk.parts[2], GC), ...fbox([['supplier: 440', CC], ['stores: 55 + 33 + 352', GC], ['= the same 440', GC]], GC),
    ...say('SUPPLIER AND STORES PLAN THE SAME', GC));
  const old = line(XST - CW / 2 - 0.1, y(400), XST + CW / 2 + 0.1, y(400), C.pink, 4);
  const lost = outline(XST, 400, 440, C.pink, CW + 0.04);
  const lostTxt = label('40 for no store', XST - CW / 2 - 1.1, y(420), C.pink, P ? 18 : 18, false);
  await until(S(32));
  await play(out(match), draw(old), ...fbox([['trap: supplier 440', C.pink], ['stores expect 400', C.pink]], C.pink), ...say('TRAP: 440 SENT, 400 EXPECTED', C.pink));
  await until(S(33));
  await play(fade(lost), fade(lostTxt), ...fbox([['40 cases arrive', C.pink], ['with no store', C.pink], ['waiting for them', C.pink]], C.pink), ...say('40 CASES WITH NO STORE', C.pink));
  await until(S(34));
  await play(out(old), out(lost), out(lostTxt), draw(match), ...fbox([['reconcile:', GC], ['store orders add up', C.ink], ['to the chain order', CC]], GC),
    ...say('STORE ORDERS ADD UP TO THE CHAIN', GC));
}
