// 21.2.7 Human preference evaluation: a blinded paired comparison (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const CX = P ? 0 : -1.7;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.4, 0] : [4.3, -0.5, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const ins = objs => objs.map(o => new M.FadeIn(o));
  const out = objs => new M.FadeOut(new M.VGroup(...objs));

  // text placed at p, shrunk to fit maxw
  function lab(s, size, color, p, maxw = 0, mono = false, bold = false) {
    const t = T(s, size, color, mono, bold);
    if (maxw && t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(p); return t;
  }
  function rect(w, h, color, p, fill = C.card, op = 0.9, round = 0) {
    const r = round ? new M.RoundedRectangle({ width: w, height: h, cornerRadius: round, color, strokeWidth: 2 })
      : new M.Rectangle({ width: w, height: h, color, strokeWidth: 2 });
    r.setFill(fill, op); r.moveTo(p); return r;
  }
  const dot = (p, color, r = 0.17) => { const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d; };
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: a, end: b, color });
  const textLines = (x0, y0, len, n, gap = 0.3) => Array.from({ length: n }, (_, j) => new M.Line({
    start: [x0, y0 - j * gap, 0], end: [x0 + len * (j === n - 1 ? 0.55 : 1), y0 - j * gap, 0], color: C.muted, strokeWidth: 3 }));
  function person(p, color = C.ink) {
    const head = new M.Circle({ radius: 0.14, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([p[0], p[1] + 0.02, 0]);
    return new M.VGroup(head, body);
  }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0, k = Math.min(1, maxw / wd);
    if (k < 1) g.scale(k);
    if (P) g.moveTo([0, -3.45 - ht * k / 2, 0]);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // 0-3 the assistant; old A (blue) and new B (orange)
  const cy = P ? 0.6 : -0.4;
  const one = rect(3.0, 1.3, C.cyan, [CX, cy, 0], C.card, 0.9, 0.16);
  const oneT = lab('library assistant', 22, C.cyan, [CX, cy + 0.16, 0], 2.7, false, true);
  const oneV = lab('new version', 17, C.muted, [CX, cy - 0.3, 0], 2.7);
  await until(S(0)); await play(...ins([one, oneT, oneV]), ...say('A NEW VERSION OF THE ASSISTANT'));
  const ask = lab('“When does the library open?”', 20, C.ink, [CX, cy + 1.65, 0], P ? FW - 1 : 6);
  const askA = arrow([CX, cy + 1.4, 0], [CX, cy + 0.7, 0]);
  const ansA = arrow([CX, cy - 0.7, 0], [CX, cy - 1.15, 0]);
  const ansL = textLines(CX - 1.3, cy - 1.35, 2.6, 2, 0.25);
  await until(S(1)); await play(new M.FadeIn(ask), new M.Create(askA), new M.Create(ansA), ...ansL.map(l => new M.Create(l)), ...say('A PROGRAM THAT ANSWERS QUESTIONS'));
  const bx = P ? 1.9 : 2.2, bw = P ? 3.4 : 3.8;
  const side = [-1, 1].map((sg, k) => {
    const col = k ? ORANGE : BLUE, p = [CX + sg * bx, cy, 0];
    return [rect(bw, 1.3, col, p, C.card, 0.9, 0.16), lab(k ? 'assistant B' : 'assistant A', 22, col, [p[0], cy + 0.16, 0], bw - 0.3, false, true),
      lab(k ? 'new' : 'old', 17, C.muted, [p[0], cy - 0.3, 0], bw - 0.3)];
  }).flat();
  await until(S(2)); await play(out([one, oneT, oneV, ask, askA, ansA, ...ansL]), ...ins(side), ...say('A = OLD (BLUE)    B = NEW (ORANGE)'));
  const which = lab('?', 56, C.amber, [CX, cy + 1.25, 0], 0, false, true);
  await until(S(3)); await play(new M.FadeIn(which), ...say('WHICH ONE DO PEOPLE FIND BETTER?', C.amber));

  // 4-5 ten held-out question cards
  const TOPIC = ['hours', 'hours', 'hours', 'hours', 'hours', 'loans', 'loans', 'loans', 'rooms', 'rooms'];
  const TCOL = { hours: C.cyan, loans: C.pink, rooms: C.amber };
  const csx = P ? 1.45 : 1.35, csy = P ? 1.2 : 1.05, gy = P ? 0.4 : -0.6;
  const cardAt = k => [CX + (k % 5 - 2) * csx, gy + (k < 5 ? 0.5 : -0.5) * csy, 0];
  function card(k, p) {
    const col = TCOL[TOPIC[k]];
    const r = rect(1.1, 0.8, col, p, C.card, 0.95, 0.1);
    const q = lab('Q' + (k + 1), 20, C.ink, [p[0], p[1] + 0.12, 0], 1.0, true, true);
    const tp = lab(TOPIC[k], 15, col, [p[0], p[1] - 0.2, 0], 1.0);
    return new M.VGroup(r, q, tp);
  }
  const cards = TOPIC.map((_, k) => card(k, cardAt(k)));
  await until(S(4)); await play(out([...side, which]), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.8 }), ...say('10 HELD-OUT QUESTION CARDS'));
  const fw = 4 * csx + 1.5, fh = csy + 1.2;
  const fence = new M.Rectangle({ width: fw, height: fh, color: C.violet, strokeWidth: 2 }); fence.moveTo([CX, gy, 0]);
  const fenceT = lab('kept aside: never used while building A or B', 17, C.violet, [CX, gy + fh / 2 + 0.3, 0], fw);
  await until(S(5)); await play(new M.Create(fence), new M.FadeIn(fenceT), ...say('HELD OUT: NEVER USED WHILE BUILDING', C.violet));

  // 6-7 one card, both assistants, two answers side by side
  const qy = P ? 2.7 : 1.0, cardP = [P ? -2.6 : CX - 2.6, qy, 0];
  const Q = cards[7];
  const qT = lab('“How long can I keep a book?”', 20, C.ink, [P ? 0.75 : CX + 0.75, qy, 0], P ? 5.2 : 4.8);
  const by = P ? 1.15 : -0.35;
  const bots = [-1, 1].map((sg, k) => {
    const col = k ? ORANGE : BLUE, p = [CX + sg * 1.9, by, 0];
    return [rect(2.4, 0.9, col, p, C.card, 0.9, 0.14), lab(k ? 'assistant B' : 'assistant A', 19, col, p, 2.1, false, true)];
  }).flat();
  const botA = [-1, 1].map(sg => arrow([CX + sg * 0.5, qy - 0.45, 0], [CX + sg * 1.9, by + 0.5, 0]));
  await until(S(6));
  await play(out([...cards.filter(c => c !== Q), fence, fenceT]), new M.Transform(Q, Q.copy().scale(1.25).moveTo(cardP)), ...say('ONE CARD, ONE QUESTION, BOTH ASSISTANTS'));
  await play(new M.FadeIn(qT), ...botA.map(a => new M.Create(a)), ...ins(bots));

  const sy = P ? 0.55 : -0.75, sw = P ? 7.6 : 7.0, sh = P ? 2.5 : 2.1, pw = P ? 3.4 : 3.1, ph = P ? 2.05 : 1.7, px = P ? 1.9 : 1.75;
  const ry = P ? -1.75 : -2.5;
  const panel = (sg, color) => rect(pw, ph, color, [CX + sg * px, sy, 0], C.bg, 0.9);
  const tag = (sg, name, color) => lab(name, 20, color, [CX + sg * px, sy + ph / 2 - 0.3, 0], pw - 0.4, true, true);
  function screen() {
    const frame = rect(sw, sh, C.muted, [CX, sy, 0], C.card, 0.6, 0.14);
    const top = sy + ph / 2 - 0.7, x0 = sg => CX + sg * px - pw / 2 + 0.3;
    return { frame, panL: panel(-1, BLUE), panR: panel(1, ORANGE), lines: [...textLines(x0(-1), top, pw - 0.6, 2), ...textLines(x0(1), top, pw - 0.6, 3)],
      tagL: tag(-1, 'A', BLUE), tagR: tag(1, 'B', ORANGE) };
  }
  const body = w => [w.frame, w.panL, w.panR, ...w.lines];
  const readerAt = () => [person([CX, ry, 0]), lab('rater', 17, C.muted, [CX + 0.75, ry + 0.15, 0])];
  let scr = screen();
  await until(S(7)); await play(out([...bots, ...botA]), ...ins([...body(scr), scr.tagL, scr.tagR]), ...say('BOTH ANSWERS, SIDE BY SIDE'));

  // 8-11 the reader picks, or says tie
  let reader = readerAt();
  await until(S(8)); await play(...ins(reader), ...say('THE RATER'));
  await until(S(9)); await play(new M.LaggedStart([new M.Indicate(scr.panL, { color: BLUE }), new M.Indicate(scr.panR, { color: ORANGE })], { lagRatio: 0.5, runTime: 1.2 }), ...say('PICK THE BETTER ANSWER'));
  const eq = lab('=', 34, C.amber, [CX, sy, 0], 0, true, true);
  await until(S(10)); await play(new M.FadeIn(eq), ...say('“TIE” = EQUALLY GOOD', C.amber));
  const qA = [-1, 1].map(sg => arrow([CX + sg * 0.5, qy - 0.4, 0], [CX + sg * px, sy + ph / 2 + 0.05, 0]));
  await until(S(11)); await play(new M.FadeOut(eq), ...qA.map(a => new M.Create(a)), ...say('SAME QUESTION: NEITHER GOT AN EASIER ONE'));

  // 12 two runners, same track, same day
  const tx0 = CX - (P ? 3.2 : 3.0), tx1 = CX + (P ? 3.4 : 3.2), laneY = [sy + 0.45, sy - 0.45], RCOL = [BLUE, ORANGE];
  const track = [sy + 0.9, sy, sy - 0.9].map(y => new M.Line({ start: [tx0, y, 0], end: [tx1, y, 0], color: C.muted, strokeWidth: 2 }));
  const gates = [tx0 + 0.15, tx1 - 0.3].map((x, k) => new M.Line({ start: [x, sy - 0.9, 0], end: [x, sy + 0.9, 0], color: k ? C.amber : C.ink, strokeWidth: 3 }));
  const runners = RCOL.map((col, k) => dot([tx0 + 0.5, laneY[k], 0], col, 0.2));
  const runT = ['A', 'B'].map((s, k) => lab(s, 20, RCOL[k], [tx0 - 0.25, laneY[k], 0], 0, true, true));
  await until(S(12));
  await play(out([...body(scr), scr.tagL, scr.tagR, ...reader, ...qA]), ...ins([...track, ...gates, ...runT, ...runners]), ...say('SAME TRACK, SAME DAY: ONLY RUNNERS DIFFER'));
  await play(...runners.map((r, k) => new M.Transform(r, dot([tx1 - 0.65, laneY[k], 0], RCOL[k], 0.2), { runTime: 2.0 })));

  // 13 the name: paired comparison
  scr = screen(); reader = readerAt();
  await until(S(13)); await play(out([...track, ...gates, ...runT, ...runners]), ...ins([...body(scr), scr.tagL, scr.tagR, ...reader]), ...say('PAIRED COMPARISON', C.green));

  // 14-19 the catch, hiding the names, the coin, blinding
  const newTag = pill('NEW', C.pink, 14); newTag.moveTo([CX + px + pw / 2 - 0.45, sy + ph / 2 - 0.3, 0]);
  await until(S(14)); await play(new M.FadeIn(newTag), ...say('CATCH: THE RATER KNOWS WHICH IS NEW', C.pink));
  const lean = arrow([CX + 0.2, ry + 0.6, 0], [CX + px, sy - ph / 2 - 0.08, 0], C.pink);
  await until(S(15)); await play(new M.Create(lean), ...say('THEY MIGHT LEAN TOWARD “NEW”', C.pink));
  const tagsLR = [tag(-1, 'LEFT', C.muted), tag(1, 'RIGHT', C.muted)];
  await until(S(16)); await play(out([newTag, lean, scr.tagL, scr.tagR]), ...ins(tagsLR),
    new M.Transform(scr.panL, panel(-1, C.muted)), new M.Transform(scr.panR, panel(1, C.muted)), ...say('HIDE THE NAMES: “LEFT” AND “RIGHT”'));
  scr.panL.setFill(C.bg, 0.9); scr.panR.setFill(C.bg, 0.9);
  const leftA = arrow([CX - 0.2, ry + 0.6, 0], [CX - px, sy - ph / 2 - 0.08, 0], C.amber);
  await until(S(17)); await play(new M.Create(leftA), ...say('SOME PEOPLE LEAN LEFT', C.amber));
  const coinP = [CX + (P ? 1.7 : 2.3), ry + 0.2, 0];
  const coin = new M.Circle({ radius: 0.34, color: C.amber }); coin.setFill(C.amber, 0.25); coin.moveTo(coinP);
  const coinT = lab('coin', 15, C.amber, coinP, 0.6);
  await until(S(18)); await play(new M.FadeOut(leftA), new M.FadeIn(coin), new M.FadeIn(coinT), ...say('A COIN FLIP DECIDES WHO GOES LEFT', C.amber));
  await play(new M.Indicate(coin, { color: C.amber }));
  await until(S(19)); await play(out([coin, coinT]), new M.LaggedStart(tagsLR.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.4, runTime: 1.4 }), ...say('BLINDING: THE RATER IS BLIND TO NAMES', C.green));

  // 20-21 one pick, then uncover the name
  const pick = new M.Rectangle({ width: pw + 0.16, height: ph + 0.16, color: C.green, strokeWidth: 4 }); pick.moveTo([CX + px, sy, 0]);
  const pickA = arrow([CX + 0.2, ry + 0.6, 0], [CX + px, sy - ph / 2 - 0.12, 0], C.green);
  await until(S(20)); await play(new M.Create(pick), new M.Create(pickA), ...say('THE RATER PICKS: RIGHT', C.green));
  const tagsAB = [tag(-1, 'A', BLUE), tag(1, 'B', ORANGE)];
  await until(S(21)); await play(out(tagsLR), ...ins(tagsAB), new M.Transform(scr.panL, panel(-1, BLUE)), new M.Transform(scr.panR, panel(1, ORANGE)), ...say('UNCOVERED: RIGHT CAME FROM B', ORANGE));
  scr.panL.setFill(C.bg, 0.9); scr.panR.setFill(C.bg, 0.9);

  // 22-28 tally boxes: B wins, A wins, tie
  const ty = P ? 0.5 : -0.9, tw = 2.2, th = 1.7, tsp = P ? 2.45 : 2.5;
  const tX = [CX - tsp, CX, CX + tsp], tCol = [ORANGE, BLUE, C.muted];
  const tBox = tX.map((x, k) => rect(tw, th, tCol[k], [x, ty, 0], C.card, 0.8));
  const tName = ['B wins', 'A wins', 'tie'].map((s, k) => lab(s, 20, tCol[k], [tX[k], ty + th / 2 + 0.3, 0], tw, false, true));
  const markP = (k, j) => [tX[k] + (j % 3 - 1) * 0.55, ty + 0.4 - Math.floor(j / 3) * 0.55, 0];
  const SEQ = [0, 1, 0, 0, 2, 1, 0, 0, 1, 0];   // card by card: 0 = B wins, 1 = A wins, 2 = tie
  const marks = [[], [], []], order = [];
  SEQ.forEach(k => { const m = dot(markP(k, marks[k].length), tCol[k]); marks[k].push(m); order.push(m); });
  await until(S(22));
  await play(out([...body(scr), ...tagsAB, ...reader, pick, pickA, Q, qT]), new M.Create(tBox[0]), new M.FadeIn(tName[0]), ...say('ONE MARK IN “B WINS”', ORANGE));
  await play(new M.FadeIn(order[0]), new M.Flash(order[0], { color: ORANGE }));
  await until(S(23)); await play(...[1, 2].flatMap(k => [new M.Create(tBox[k]), new M.FadeIn(tName[k])]), ...say('TWO MORE BOXES: “A WINS” AND “TIE”'));
  await until(S(24)); await play(new M.LaggedStart(order.slice(1).map(m => new M.FadeIn(m)), { lagRatio: 0.5, runTime: Math.max(2, E(24) - S(24) - 0.3) }), ...say('ALL 10 CARDS, ONE AT A TIME'));
  const counts = [6, 3, 1].map((n, k) => lab(String(n), 28, tCol[k], [tX[k], ty - th / 2 - 0.35, 0], 0, true, true));
  const cSay = ['B: 6 MARKS', 'A: 3 MARKS', 'TIE: 1 MARK'];
  for (let k = 0; k < 3; k++) {
    await until(S(25 + k));
    await play(new M.FadeIn(counts[k]), new M.LaggedStart(marks[k].map(m => new M.Indicate(m, { color: tCol[k] })), { lagRatio: 0.2, runTime: 1.2 }), ...say(cSay[k], tCol[k]));
  }
  await until(S(28)); await play(...fbox(['6 + 3 + 1', ['= 10 cards', C.amber]], C.amber), ...say('ONE MARK FOR EACH CARD', C.amber));

  // 29-33 set the tie aside: 9 decided comparisons, B won 6
  await until(S(29)); await play(...say('HOW OFTEN DID THE RATER PREFER B?', C.amber));
  const aside = lab('set aside', 15, C.muted, [tX[2], ty - th / 2 - 0.75, 0]);
  await until(S(30)); await play(new M.Transform(tBox[2], rect(tw, th, C.line, [tX[2], ty, 0], C.card, 0.4)), new M.Transform(marks[2][0], dot(markP(2, 0), C.line)),
    new M.FadeIn(aside), ...say('A TIE PICKS NO WINNER: SET IT ASIDE', C.muted));
  await until(S(31)); await play(...fbox(['B wins = 6', 'A wins = 3', ['ties   = 1 of 10', C.muted]]), ...say('STILL WRITTEN DOWN: 1 TIE OUT OF 10', C.muted));
  const dx0 = tX[0] - tw / 2 - 0.12, dx1 = tX[1] + tw / 2 + 0.12, dTop = ty + th / 2 + 0.6, dBot = ty - th / 2 - 0.65;
  const dec = new M.Rectangle({ width: dx1 - dx0, height: dTop - dBot, color: C.green, strokeWidth: 2 }); dec.moveTo([(dx0 + dx1) / 2, (dTop + dBot) / 2, 0]);
  const decT = lab('decided: 6 + 3 = 9', 18, C.green, [(dx0 + dx1) / 2, dBot - 0.3, 0], dx1 - dx0);
  await until(S(32)); await play(new M.Create(dec), new M.FadeIn(decT), ...fbox(['decided = 6 + 3', ['        = 9', C.green]], C.green), ...say('9 DECIDED COMPARISONS', C.green));
  await until(S(33)); await play(new M.LaggedStart(marks[0].map(m => new M.Indicate(m, { color: ORANGE })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['decided = 9', ['B wins  = 6 of 9', ORANGE]], ORANGE), ...say('B WON 6 OF THE 9', ORANGE));

  // 34-37 nine dots: three rows of three, two orange in every row
  const gc = P ? [0, 0.6] : [CX, -0.6], gsp = P ? 0.85 : 0.8;
  const gridP = (r, c) => [gc[0] + (c - 1) * gsp, gc[1] + (1 - r) * gsp, 0];
  const nine = [];
  for (let r = 0; r < 3; r++) nine.push([marks[0][2 * r], ORANGE, r, 0], [marks[0][2 * r + 1], ORANGE, r, 1], [marks[1][r], BLUE, r, 2]);
  await until(S(34)); await play(out([...tBox, ...tName, ...counts, aside, dec, decT, marks[2][0]]),
    new M.LaggedStart(nine.map(([m, col, r, c]) => new M.Transform(m, dot(gridP(r, c), col, 0.24))), { lagRatio: 0.15, runTime: 1.8 }), ...say('THE 9 PICKS: 3 ROWS OF 3'));
  const rowT = [0, 1, 2].map(r => { const t = lab('2 orange · 1 blue', 16, C.muted, [0, 0, 0], P ? 2.2 : 2.6); t.moveTo([gc[0] + gsp + 0.45 + t.getWidth() / 2, gridP(r, 0)[1], 0]); return t; });
  await until(S(35)); await play(new M.LaggedStart(rowT.map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 1.8 }), ...say('EVERY ROW: 2 ORANGE, 1 BLUE', ORANGE));
  await until(S(36)); await play(...fbox(['6 of 9', ['= 2 of every 3', C.amber]], C.amber), ...say('6 OUT OF 9 = 2 OUT OF EVERY 3', C.amber));
  await until(S(37)); await play(...fbox(['6 of 9 = 2 of 3', ['= two thirds (2/3)', C.green]], C.green), ...say('TWO THIRDS', C.green));

  // 38-40 percent: two thirds of 100 squares is about 67
  const hc = P ? [0, 0.5] : [CX, -0.5], hs = P ? 0.32 : 0.24;
  const sqP = i => [hc[0] + (i % 10 - 4.5) * hs, hc[1] + (4.5 - Math.floor(i / 10)) * hs, 0];
  const sq = (i, col, op) => { const b = new M.Rectangle({ width: hs * 0.8, height: hs * 0.8, color: col, strokeWidth: 1 }); b.setFill(col, op); b.moveTo(sqP(i)); return b; };
  const hund = Array.from({ length: 100 }, (_, i) => sq(i, C.muted, 0.25));
  const hundT = lab('100 squares', 18, C.muted, [hc[0], hc[1] - 5 * hs - 0.35, 0]);
  await until(S(38)); await play(out([...nine.map(n => n[0]), ...rowT]), new M.LaggedStart(hund.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.6 }),
    new M.FadeIn(hundT), ...say('PERCENT = OUT OF EVERY 100'));
  const t67 = lab('67 of 100 ≈ two thirds', 18, ORANGE, [hc[0], hc[1] - 5 * hs - 0.35, 0], P ? FW - 1 : 5);
  await until(S(39)); await play(new M.LaggedStart(hund.slice(0, 67).map((b, i) => new M.Transform(b, sq(i, ORANGE, 0.85))), { lagRatio: 0.08, runTime: 3.0 }),
    new M.FadeOut(hundT), new M.FadeIn(t67), ...fbox(['2/3 of 100 ≈ 67', ['B preferred ≈ 67%', ORANGE]], ORANGE), ...say('B PREFERRED ABOUT 67% OF THE TIME', ORANGE));
  await until(S(40)); await play(new M.Indicate(t67, { color: C.amber }), ...say('B’S PREFERENCE RATE ≈ 67%', C.amber));

  // 41-44 the formula
  const ry2 = P ? 0.8 : -0.4, rsp = P ? 0.62 : 0.55, rx0 = CX - 9.6 * rsp / 2;
  const rowX = i => rx0 + (i < 9 ? i : 9.6) * rsp;
  const row = Array.from({ length: 10 }, (_, i) => dot([rowX(i), ry2, 0], i < 6 ? ORANGE : i < 9 ? BLUE : C.muted, 0.18));
  const rowN = [['B wins', ORANGE, 2.5], ['A wins', BLUE, 7], ['tie', C.muted, 9.6]].map(([s, col, i]) => lab(s, 16, col, [rx0 + i * rsp, ry2 + 0.5, 0]));
  await until(S(41)); await play(out([...hund, t67]), ...ins([...row, ...rowN]), ...say('A SHORT RULE: A FORMULA'));
  await until(S(42)); await play(...fbox([['preference rate', C.ink], ['= B wins ÷ decided', C.amber]], C.amber),
    new M.LaggedStart(row.slice(0, 6).map(d => new M.Indicate(d, { color: ORANGE })), { lagRatio: 0.2, runTime: 1.5 }));
  const decL = new M.Line({ start: [rowX(0) - 0.2, ry2 - 0.4, 0], end: [rowX(8) + 0.2, ry2 - 0.4, 0], color: C.green, strokeWidth: 3 });
  const decL2 = lab('decided = B wins + A wins = 9', 16, C.green, [(rowX(0) + rowX(8)) / 2, ry2 - 0.75, 0], 8 * rsp + 0.4);
  const outT = lab('left out', 15, C.muted, [rowX(9), ry2 - 0.4, 0]);
  await until(S(43)); await play(new M.Create(decL), new M.FadeIn(decL2), new M.FadeIn(outT),
    ...fbox([['decided = B wins + A wins', C.green], ['ties left out', C.muted]], C.green), ...say('TIES ARE LEFT OUT', C.muted));
  await until(S(44)); await play(...fbox(['rate = 6 ÷ (6 + 3)', '     = 6 ÷ 9', ['     ≈ 67%', C.amber]], C.amber), ...say('6 ÷ 9 ≈ 67%', C.amber));

  // 45-47 what it is for: qualities with no answer key
  const mid = P ? 0.6 : -0.5;
  const key = rect(2.6, 1.9, C.muted, [CX, mid, 0], C.card, 0.9, 0.12);
  const keyT = lab('answer key', 20, C.ink, [CX, mid + 0.6, 0], 2.3, false, true);
  const keyL = textLines(CX - 0.9, mid + 0.1, 1.8, 3, 0.3);
  const cross = [[1, -1], [-1, 1]].map(([a, b]) => new M.Line({ start: [CX - 1.0, mid + a * 0.75, 0], end: [CX + 1.0, mid + b * 0.75, 0], color: C.pink, strokeWidth: 5 }));
  await until(S(45)); await play(out([...row, ...rowN, decL, decL2, outT]), ...clearBox(), ...ins([key, keyT, ...keyL]), ...say('WHAT IS IT FOR?', C.green));
  await play(...cross.map(l => new M.Create(l)), ...say('SOME QUALITIES HAVE NO ANSWER KEY', C.pink));
  const quals = [['Is it clear?', C.cyan], ['Is it polite?', C.violet], ['Is it easy to follow?', C.green]]
    .map(([s, col], k) => lab(s, 28, col, [CX, mid + (1 - k) * 0.8, 0], P ? FW - 1 : 6, false, true));
  await until(S(46)); await play(out([key, keyT, ...keyL, ...cross]), new M.LaggedStart(quals.map(q => new M.FadeIn(q)), { lagRatio: 0.6, runTime: Math.max(2, E(46) - S(46) - 0.5) }),
    ...say('CLEAR? POLITE? EASY TO FOLLOW?', C.violet));
  await until(S(47)); await play(...fbox([['raters prefer B', ORANGE], ['blinded, paired', C.muted]], ORANGE), ...say('BLINDED PAIRED COMPARISON', C.green));

  // 48-50 the trap: preferred is not correct
  const pw2 = P ? 3.4 : 3.1, ph2 = P ? 2.6 : 2.2, px2 = P ? 1.85 : 1.75;
  const trapP = [-1, 1].map(sg => rect(pw2, ph2, C.muted, [CX + sg * px2, mid, 0], C.bg, 0.9));
  const trapT = [lab('short answer', 16, C.muted, [CX - px2, mid + ph2 / 2 - 0.3, 0], pw2 - 0.3),
    lab('long, confident answer', 16, C.muted, [CX + px2, mid + ph2 / 2 - 0.3, 0], pw2 - 0.3)];
  const trapL = [...textLines(CX - px2 - pw2 / 2 + 0.3, mid + ph2 / 2 - 0.7, pw2 - 0.6, 2, 0.28),
    ...textLines(CX + px2 - pw2 / 2 + 0.3, mid + ph2 / 2 - 0.7, pw2 - 0.6, 6, 0.28)];
  const pref = pill('PREFERRED', C.green, 15); pref.moveTo([CX + px2, mid + ph2 / 2 + 0.3, 0]);
  await until(S(48)); await play(out(quals), ...clearBox(), ...ins([...trapP, ...trapT, ...trapL, pref]), ...say('TRAP: PREFERRED IS NOT CORRECT', C.pink));
  const wrong = lab('✗ wrong', 22, C.pink, [CX + px2, mid - ph2 / 2 - 0.35, 0], 0, false, true);
  await until(S(49)); await play(new M.FadeIn(wrong), new M.Indicate(trapP[1], { color: C.pink }), ...say('LONG AND CONFIDENT, BUT WRONG', C.pink));
  const agY = P ? -1.9 : -2.6;
  const agT = lab('✓ check against the librarians’ agreed answer', 17, C.green, [CX, agY, 0], P ? FW - 1.2 : 6.4);
  const ag = rect(agT.getWidth() + 0.5, 0.55, C.green, [CX, agY, 0], C.card, 0.9, 0.12);
  await until(S(50)); await play(new M.FadeIn(ag), new M.FadeIn(agT), ...say('STILL CHECK CORRECTNESS', C.green));

  // 51-53 only 9 picks by one reader: one flip moves a lot
  const ry3 = P ? 1.0 : -0.3;
  const few = Array.from({ length: 9 }, (_, i) => dot([CX + (i - 4) * rsp, ry3, 0], i < 6 ? ORANGE : BLUE, 0.2));
  const one1 = [person([CX, ry3 - 1.4, 0]), lab('one rater', 17, C.muted, [CX + 1.0, ry3 - 1.25, 0])];
  await until(S(51)); await play(out([...trapP, ...trapT, ...trapL, pref, wrong, ag, agT]), ...ins([...few, ...one1]), ...say('ONLY 9 PICKS, ALL BY ONE RATER', C.amber));
  const f5 = [CX + rsp, ry3, 0];
  await until(S(52)); await play(new M.Transform(few[5], dot(f5, BLUE, 0.2)), new M.Flash(few[5], { color: BLUE }),
    ...fbox(['one B win goes to A:', ['B = 5 of 9 ≈ 56%', C.amber], 'just over half'], C.amber));
  await until(S(53)); await play(new M.Transform(few[5], dot(f5, ORANGE, 0.2)), ...fbox(['6 of 9 ≈ 67%', '5 of 9 ≈ 56%', ['one pick moves it a lot', C.amber]], C.amber),
    ...say('ABOUT 67%: A ROUGH FIRST LOOK', C.amber));

  // 54 recap
  await until(S(54)); await play(...clearBox(), new M.LaggedStart(few.map(d => new M.Indicate(d)), { lagRatio: 0.15, runTime: 1.8 }),
    ...showA('HIDE NAMES · SAME QUESTION · COUNT WINS · SET TIES ASIDE', C.green, P ? PILL : [0, PILL[1], 0]));
}
