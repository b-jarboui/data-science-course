// 21.1.3 Lexical retrieval with BM25 (live version of script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const TOPIC = ['Hours', 'Borrowing', 'Renewals', 'Late fees', 'Rooms', 'Holidays'];
  const WORDS = [26, 28, 23, 24, 27, 18];          // page lengths, average 146 ÷ 6 ≈ 24.3
  const THE = [1, 2, 1, 0, 0, 3];                   // mentions of "the" on each page
  const PCOL = [C.ink, C.ink, C.ink, C.amber, C.cyan, C.ink];
  const CX = P ? 0 : -2.4, SP = P ? 1.25 : 1.4, CW = P ? 1.05 : 1.15, CH = P ? 1.35 : 1.25, CARDY = P ? 1.0 : 0.85;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.9, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];
  const BASE = P ? -5.2 : -2.85, SU = P ? 0.85 : 0.3, LU = P ? 0.12 : 0.085, BW = CW * 0.6;
  const colx = k => CX + (k - 2.5) * SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const rect = (w, ht, p, c, op = 0.82) => { const r = new M.Rectangle({ width: w, height: ht, color: c, strokeWidth: 1 }); r.setFill(c, op); r.moveTo(p); return r; };
  const label = (s, size, c, p) => { const t = T(s, size, c, true, true); t.moveTo(p); return t; };

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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // the six pages as glowing cards; a chip is one mention of a word, stacked under its card
  function card(k) {
    const x = colx(k), c = PCOL[k];
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: c, strokeWidth: 2.5 });
    r.setFill(c, 0.1); r.moveTo([x, CARDY, 0]);
    const n = label(String(k + 1), 32, c, [x, CARDY + 0.2, 0]);
    const t = fit(T(TOPIC[k], P ? 13 : 14, C.muted), CW - 0.16); t.moveTo([x, CARDY - 0.34, 0]);
    return new M.VGroup(r, n, t);
  }
  const chip = (s, k, j, c) => fit(label(s, 16, c, [colx(k), CARDY - CH / 2 - 0.25 - j * 0.3, 0]), SP - 0.12);

  // 0-2 the question and the guide
  const QB = P ? [0, 0.9, 0] : [CX - 1.6, 0.4, 0], GB = P ? [0, -2.2, 0] : [CX + 2.4, 0.4, 0];
  const qr = new M.RoundedRectangle({ width: P ? 4.2 : 3.4, height: 0.9, cornerRadius: 0.2, color: C.amber, strokeWidth: 2.5 });
  qr.setFill(C.card, 0.95); qr.moveTo(QB);
  const qt = T('late fee', 30, C.amber, true, true); qt.moveTo(QB);
  await until(S(0)); await play(new M.FadeIn(qr), new M.FadeIn(qt), ...say('A VISITOR TYPES: LATE FEE', C.amber));

  const sheets = Array.from({ length: 6 }, (_, k) => { const r = new M.Rectangle({ width: 1.0, height: 1.3, color: C.ink, strokeWidth: 2 }); r.setFill(C.card, 1); r.moveTo([GB[0] + (5 - k) * 0.08, GB[1] + (5 - k) * 0.08, 0]); return r; });
  const glab = T('guide: 6 pages', 17, C.muted); glab.moveTo([GB[0] + 0.2, GB[1] - 0.95, 0]);
  const arrow = P ? new M.Arrow({ start: [0, QB[1] - 0.55, 0], end: [0, GB[1] + 1.05, 0], color: C.muted })
    : new M.Arrow({ start: [QB[0] + 1.8, QB[1], 0], end: [GB[0] - 0.65, QB[1], 0], color: C.muted });
  await until(S(1)); await play(new M.LaggedStart(sheets.map(r => new M.FadeIn(r)), { lagRatio: 0.15, runTime: 1.2 }), new M.Create(arrow), new M.FadeIn(glab), ...say('FIRST: FIND THE RIGHT PAGE'));
  await until(S(2)); await play(new M.LaggedStart(sheets.map(r => new M.Indicate(r, { color: C.green })), { lagRatio: 0.15, runTime: 1.6 }), ...say('RETRIEVAL = FINDING THE USEFUL TEXT', C.green));

  // 3-9 six cards, the query, the words found
  const cards = TOPIC.map((_, k) => card(k));
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(qr, qt, arrow, glab, ...sheets)),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.6 }), ...say('6 PAGES = 6 CARDS'));
  await until(S(4)); await play(...say('QUERY = THE WORDS OF THE QUESTION', C.amber), ...fbox(['query:', ['late  fee', C.amber]], C.amber));
  await until(S(5)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.6 }), ...say('LOOK FOR late AND fee ON EVERY PAGE'));
  const lateChips = [0, 1, 2].map(j => chip('late', 3, j, C.amber));
  await until(S(6)); await play(new M.LaggedStart(lateChips.map(c => new M.FadeIn(c)), { lagRatio: 0.4, runTime: 1.5 }), new M.Indicate(cards[3], { color: C.amber }),
    ...fbox(['query: late fee', ['late: page 4, 3 times', C.amber]], C.amber));
  const feeChips = [chip('fee', 3, 3, C.cyan), chip('fee', 3, 4, C.cyan), chip('fee', 4, 0, C.cyan)];
  await until(S(7)); await play(new M.LaggedStart(feeChips.map(c => new M.FadeIn(c)), { lagRatio: 0.4, runTime: 1.5 }),
    ...fbox(['query: late fee', ['late: page 4 ×3', C.amber], ['fee:  page 4 ×2, page 5 ×1', C.cyan]], C.amber));
  const nones = [0, 1, 2, 5].map(k => chip('none', k, 0, C.muted));
  await until(S(8)); await play(new M.LaggedStart(nones.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.2 }), ...say('PAGES 1, 2, 3, 6: NEITHER WORD', C.muted));
  await until(S(9)); await play(new M.Indicate(cards[3], { color: C.green }), new M.Indicate(cards[4], { color: C.green }), ...say('SHARED WORDS → BETTER MATCH', C.green));

  // 10-13 common words are weak clues
  await until(S(10)); await play(...say('BUT WORDS ARE NOT ALL WORTH THE SAME', C.violet));
  const theChips = [];
  THE.forEach((n, k) => { for (let j = 0; j < n; j++) theChips.push(chip('the', k, j, C.violet)); });
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...nones)), new M.LaggedStart(theChips.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox(['query:', ['the  late  fee', C.violet]], C.violet), ...say('the IS ON 4 OF THE 6 PAGES', C.violet));
  await until(S(12)); await play(new M.LaggedStart(theChips.map(c => new M.Indicate(c, { color: C.muted })), { lagRatio: 0.1, runTime: 1.5 }), ...say('FOUND EVERYWHERE = ALMOST NO CLUE', C.muted));
  await until(S(13)); await play(new M.LaggedStart(lateChips.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('RARE WORD = STRONG CLUE (TF-IDF, UNIT 19)', C.amber));

  // 14-18 each word gets a weight: one bar per word
  const WX = colx(0) - CW / 2 + 0.9, WU = P ? 2.4 : 2.2;
  const WROW = P ? [-2.0, -2.6, -3.2] : [-1.7, -2.15, -2.6];
  function wbar(i, word, w, c) {
    const y = WROW[i], len = w * WU;
    return [label(word, 17, c, [WX - 0.5, y, 0]), rect(len, 0.26, [WX + len / 2, y, 0], c), label('≈ ' + w.toFixed(2), 16, c, [WX + len + 0.5, y, 0])];
  }
  await until(S(14)); await play(...say('WORD SCORE = HOW MUCH A WORD COUNTS', C.green));
  await until(S(15)); await play(...say('FEWER PAGES → BIGGER WORD SCORE', C.green));
  const w0 = wbar(0, 'late', 1.54, C.amber), w1 = wbar(1, 'fee', 1.03, C.cyan), w2 = wbar(2, 'the', 0.44, C.violet);
  await until(S(16)); await play(new M.FadeIn(new M.VGroup(...w0)), new M.Indicate(cards[3], { color: C.amber }), ...fbox(['late: on 1 page', ['word score ≈ 1.54', C.amber]], C.amber));
  await until(S(17)); await play(new M.FadeIn(new M.VGroup(...w1)), new M.Indicate(cards[3], { color: C.cyan }), new M.Indicate(cards[4], { color: C.cyan }),
    ...fbox(['fee: on 2 pages', ['word score ≈ 1.03', C.cyan]]));
  await until(S(18)); await play(new M.FadeIn(new M.VGroup(...w2)), ...fbox(['the: on 4 pages', ['word score ≈ 0.44', C.violet]], C.violet));

  // 19-24 repeats help less and less: the capped count
  const GX0 = P ? -3.0 : -6.0, GXW = P ? 6.0 : 7.4, GY0 = P ? -4.6 : -2.2, GYH = P ? 5.4 : 3.3;
  const gx = n => GX0 + n / 10 * GXW, gy = v => GY0 + v / 3 * GYH;
  const sat = n => n * 2.2 / (n + 1.2);       // count on a page of average length, usual settings
  const ax = new M.Line({ start: [GX0, GY0, 0], end: [gx(10) + 0.25, GY0, 0], color: C.muted, strokeWidth: 2 });
  const ay = new M.Line({ start: [GX0, GY0, 0], end: [GX0, gy(3) + 0.1, 0], color: C.muted, strokeWidth: 2 });
  const AXS = P ? 19 : 18;
  const xt = [1, 2, 3, 5, 10].map(n => label(String(n), AXS, C.muted, [gx(n), GY0 - 0.3, 0]));
  const yt = [1, 2, 3].map(v => label(String(v), AXS, C.muted, [GX0 - 0.3, gy(v), 0]));
  const xcap = T('mentions on the page', AXS, C.ink); xcap.moveTo([gx(5), GY0 - 0.7, 0]);
  const ycap = T('counts as', AXS, C.ink); ycap.moveTo([GX0 + ycap.getWidth() / 2 - 0.1, gy(3) + 0.35, 0]);
  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(...cards, ...lateChips, ...feeChips, ...theChips, ...w0, ...w1, ...w2)), ...clearBox(), ...say('IDEA 2: REPEATS HELP, LESS AND LESS', C.cyan));
  await play(new M.Create(ax), new M.Create(ay), new M.FadeIn(new M.VGroup(...xt, ...yt, xcap, ycap)));
  const inc = n => sat(n) - sat(n - 1);
  const incs = Array.from({ length: 10 }, (_, i) => rect(GXW * 0.045, inc(i + 1) / 3 * GYH, [gx(i + 1), GY0 + inc(i + 1) / 3 * GYH / 2, 0], C.cyan, 0.7));
  const incL = [1, 2, 10].map(n => label('+' + inc(n).toFixed(2), 15, C.cyan, [gx(n), GY0 + inc(n) / 3 * GYH + 0.22, 0]));
  await until(S(20)); await play(new M.LaggedStart(incs.map(r => new M.FadeIn(r)), { lagRatio: 0.3, runTime: 3.0 }), new M.FadeIn(new M.VGroup(...incL)),
    ...say('EACH REPEAT ADDS LESS', C.muted));
  const gdot = (n, v, c) => new M.Dot({ point: [gx(n), gy(v), 0], radius: 0.09, color: c });
  const d1 = gdot(1, 1, C.cyan), d1l = label('1', 17, C.cyan, [gx(1), gy(1) + 0.3, 0]);
  await until(S(21)); await play(new M.FadeOut(new M.VGroup(...incs, ...incL)), new M.FadeIn(d1), new M.FadeIn(d1l),
    ...fbox(['1 mention', ['counts as 1', C.cyan]]), ...say('PAGE OF AVERAGE LENGTH'));
  const seg = (a, b) => { const out = []; for (let n = a; n < b - 1e-9; n += 0.25) out.push(new M.Line({ start: [gx(n), gy(sat(n)), 0], end: [gx(n + 0.25), gy(sat(n + 0.25)), 0], color: C.amber, strokeWidth: 4 })); return out; };
  const curve1 = seg(0, 3), curve2 = seg(3, 10);
  const g3 = gdot(3, 3, C.muted), g3l = label('not 3', 16, C.muted, [gx(3) + 0.65, gy(3), 0]);
  const d3 = gdot(3, sat(3), C.amber), d3l = label('≈ 1.6', 17, C.amber, [gx(3) + 0.55, gy(sat(3)) - 0.3, 0]);
  await until(S(22)); await play(new M.LaggedStart(curve1.map(l => new M.Create(l)), { lagRatio: 0.5, runTime: 1.4 }), new M.FadeIn(g3), new M.FadeIn(g3l),
    new M.FadeIn(d3), new M.FadeIn(d3l), ...fbox(['3 mentions', ['count ≈ 1.6, not 3', C.amber]], C.amber));
  const ceil = new M.DashedLine({ start: [gx(0), gy(2.2), 0], end: [gx(10), gy(2.2), 0], color: C.pink });
  const ceilL = label('ceiling 2.2', 16, C.pink, [gx(10) - 0.8, gy(2.2) + 0.25, 0]);
  const d10 = gdot(10, sat(10), C.amber), d10l = label('≈ 2.0', 16, C.amber, [gx(10), gy(sat(10)) - 0.3, 0]);
  await until(S(23)); await play(new M.LaggedStart(curve2.map(l => new M.Create(l)), { lagRatio: 0.5, runTime: 2.2 }), new M.Create(ceil), new M.FadeIn(ceilL),
    new M.FadeIn(d10), new M.FadeIn(d10l), ...fbox(['usual settings:', ['never above 2.2', C.pink]], C.pink));
  await until(S(24)); await play(new M.Indicate(ceil, { color: C.pink }), ...say('CAPPED = GROWS SLOWLY, STAYS UNDER A CEILING', C.amber));

  // 25-27 page length
  const cards2 = TOPIC.map((_, k) => card(k));
  const floor = new M.Line({ start: [colx(0) - SP / 2, BASE, 0], end: [colx(5) + SP / 2, BASE, 0], color: C.muted, strokeWidth: 2 });
  const lbars = WORDS.map((w, k) => rect(BW, w * LU, [colx(k), BASE + w * LU / 2, 0], C.violet, 0.6));
  const llabs = WORDS.map((w, k) => label(String(w), 16, C.violet, [colx(k), BASE + w * LU + 0.22, 0]));
  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(ax, ay, ...xt, ...yt, xcap, ycap, d1, d1l, g3, g3l, d3, d3l, ...curve1, ...curve2, ceil, ceilL, d10, d10l)),
    ...clearBox(), ...say('IDEA 3: PAGE LENGTH (WORDS)', C.violet));
  await play(new M.LaggedStart(cards2.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }), new M.Create(floor),
    new M.LaggedStart(lbars.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 1.2 }), new M.FadeIn(new M.VGroup(...llabs)));
  await until(S(26)); await play(new M.LaggedStart([new M.Indicate(lbars[1], { color: C.pink }), new M.Indicate(lbars[5], { color: C.green })], { lagRatio: 0.8, runTime: 2.4 }),
    ...say('LONG: SMALL DISCOUNT · SHORT: SMALL BONUS', C.violet));
  const avg = new M.DashedLine({ start: [colx(0) - SP / 2, BASE + 24.3 * LU, 0], end: [colx(5) + SP / 2, BASE + 24.3 * LU, 0], color: C.amber });
  await until(S(27)); await play(new M.Create(avg), ...fbox(['average ≈ 24.3 words', ['all close: little change', C.muted]], C.violet), ...say('ALL ABOUT THE SAME LENGTH', C.muted));

  // 28-35 score page 4, then page 5, then the rest
  const chips2 = [...[0, 1, 2].map(j => chip('late', 3, j, C.amber)), chip('fee', 3, 3, C.cyan), chip('fee', 3, 4, C.cyan), chip('fee', 4, 0, C.cyan)];
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(...lbars, ...llabs, avg, floor)), new M.LaggedStart(chips2.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.Indicate(cards2[3], { color: C.amber }), ...fbox(['page 4:', 'late ×3   fee ×2'], C.amber), ...say('SCORE PAGE 4, ONE WORD AT A TIME', C.amber));
  await until(S(29)); await play(new M.LaggedStart(chips2.slice(0, 3).map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['late: 3 mentions', ['count ≈ 1.6', C.amber]], C.amber));
  const sLate = rect(BW, 2.43 * SU, [colx(3), BASE + 2.43 * SU / 2, 0], C.amber);
  await until(S(30)); await play(new M.FadeIn(sLate, { shift: [0, 0.2, 0] }), ...fbox(['late: count ≈ 1.6', '× word score ≈ 1.54', ['= ≈ 2.43', C.amber]], C.amber));
  await until(S(31)); await play(new M.LaggedStart(chips2.slice(3, 5).map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.3, runTime: 1.0 }),
    ...fbox(['fee: 2 mentions', ['count ≈ 1.4', C.cyan]]));
  const sFee = rect(BW, 1.42 * SU, [colx(3), BASE + 2.43 * SU + 1.42 * SU / 2, 0], C.cyan);
  await until(S(32)); await play(new M.FadeIn(sFee, { shift: [0, 0.2, 0] }), ...fbox(['fee: count ≈ 1.4', '× word score ≈ 1.03', ['= ≈ 1.42', C.cyan]]));
  const s4lab = label('3.85', 17, C.amber, [colx(3), BASE + 3.85 * SU + 0.22, 0]);
  await until(S(33)); await play(new M.FadeIn(s4lab), new M.Flash(s4lab, { color: C.amber }), ...fbox(['late ≈ 2.43', '+ fee ≈ 1.42', ['page 4 ≈ 3.85', C.amber]], C.amber));
  const s5 = rect(BW, 0.99 * SU, [colx(4), BASE + 0.99 * SU / 2, 0], C.cyan);
  const s5lab = label('0.99', 17, C.cyan, [colx(4), BASE + 0.99 * SU + 0.22, 0]);
  await until(S(34)); await play(new M.Indicate(chips2[5], { color: C.cyan }), new M.FadeIn(s5, { shift: [0, 0.2, 0] }), new M.FadeIn(s5lab),
    ...fbox(['page 5: fee ×1', '1 × word score ≈ 1', ['page 5 ≈ 0.99', C.cyan]]));
  const zeros = [0, 1, 2, 5].map(k => label('0', 17, C.muted, [colx(k), BASE + 0.22, 0]));
  await until(S(35)); await play(new M.LaggedStart(zeros.map(z => new M.FadeIn(z)), { lagRatio: 0.2, runTime: 1.2 }), ...say('THE OTHER 4 PAGES SCORE 0', C.muted));

  // 36 sorted: the score bars become a ranking
  const RX0 = P ? -2.3 : CX - 2.6, RU = P ? 1.3 : 1.25, RH = 0.34;
  const ry = r => (P ? 1.0 : 1.15) - r * (P ? 0.8 : 0.62);
  const rowLabel = (p, r, c) => label(`page ${p}`, 17, c, [RX0 - 0.75, ry(r), 0]);
  const rowValue = (v, r, c) => label(v ? v.toFixed(2) : '0', 17, c, [RX0 + v * RU + 0.5, ry(r), 0]);
  const R1 = [[4, 3.85], [5, 0.99], [1, 0], [2, 0], [3, 0], [6, 0]];
  const rcol = (p, v) => v ? PCOL[p - 1] : C.muted;
  const rLabs = R1.map(([p, v], r) => rowLabel(p, r, rcol(p, v))), rVals = R1.map(([p, v], r) => rowValue(v, r, rcol(p, v)));
  await until(S(36));
  await play(new M.FadeOut(new M.VGroup(...cards2, ...chips2, ...zeros, s4lab, s5lab)), ...clearBox(),
    new M.Transform(sLate, rect(2.43 * RU, RH, [RX0 + 2.43 * RU / 2, ry(0), 0], C.amber)),
    new M.Transform(sFee, rect(1.42 * RU, RH, [RX0 + 2.43 * RU + 1.42 * RU / 2, ry(0), 0], C.cyan)),
    new M.Transform(s5, rect(0.99 * RU, RH, [RX0 + 0.99 * RU / 2, ry(1), 0], C.cyan)),
    new M.FadeIn(new M.VGroup(...rLabs, ...rVals)), ...say('RANKED: PAGE 4 FIRST, THE LATE-FEE PAGE', C.amber));

  // 37-41 the name, the recipe, what it is for
  await until(S(37)); await play(...say('THIS RECIPE = BM25', C.green), ...fbox(['BM25 = an improved TF-IDF', ['made for ranking pages', C.green]], C.green));
  await until(S(38)); await play(...say('LEXICAL = ABOUT WORDS'), ...fbox(['lexical retrieval:', ['match pages by exact words', C.cyan]]));
  await until(S(39)); await play(new M.LaggedStart([new M.Indicate(sLate, { color: C.amber }), new M.Indicate(sFee, { color: C.cyan })], { lagRatio: 0.6, runTime: 2.0 }),
    ...fbox(['for each query word:', ['  word score × capped count', C.amber], 'then add them up'], C.amber));
  await until(S(40)); await play(...say('FAST, RELIABLE FIRST SEARCH', C.green), ...fbox(['great for:', ['names, codes, rare words', C.green]], C.green));
  await until(S(41)); await play(...say('NO TRAINING: READY AS SOON AS THE PAGES EXIST', C.green));

  // 42-45 the trap: same meaning, different words
  await until(S(42)); await play(...say('TRAP: SAME WORDS ≠ SAME MEANING', C.pink), ...clearBox());
  const cards3 = TOPIC.map((_, k) => card(k));
  await until(S(43)); await play(new M.FadeOut(new M.VGroup(sLate, sFee, s5, ...rLabs, ...rVals)),
    new M.LaggedStart(cards3.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['what happens if I bring', 'a novel back after', 'the deadline?'], C.pink));
  const miss = ['novel: 0', 'deadline: 0', 'bring: 0'].map((s, j) => chip(s, 3, j, C.pink));
  await until(S(44)); await play(new M.LaggedStart(miss.map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.2 }), new M.Indicate(cards3[3], { color: C.pink }),
    ...say('PAGE 4 NEVER SAYS novel, deadline, bring', C.pink));
  const R2 = [[2, 2.62], [3, 1.07], [6, 0.74], [5, 0.68], [4, 0.61], [1, 0.43]];
  const tBars = R2.map(([p, v], r) => rect(v * RU, RH, [RX0 + v * RU / 2, ry(r), 0], p === 4 ? C.amber : C.violet));
  const qLab = label('query: bring a novel back after the deadline', P ? 18 : 17, C.pink, [P ? 0 : CX, ry(5) - 0.62, 0]); fit(qLab, P ? FW - 0.6 : 8.0);
  const tLabs = R2.map(([p], r) => rowLabel(p, r, p === 4 ? C.amber : C.ink)), tVals = R2.map(([p, v], r) => rowValue(v, r, p === 4 ? C.amber : C.violet));
  await until(S(44) + 2.6);
  await play(new M.FadeOut(new M.VGroup(...cards3, ...miss)), new M.LaggedStart(tBars.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...tLabs, ...tVals, qLab)), ...say('BM25 PUTS PAGE 4 FIFTH', C.pink));
  await play(new M.Indicate(tBars[4], { color: C.pink }));
  await until(S(45)); await play(...say('NEXT LESSON: MATCH BY MEANING', C.violet));

  // 46 summary
  await until(S(46)); await play(...say('BM25 IN ONE SENTENCE', C.green),
    ...fbox(['rank pages by query words', ['rare word → bigger word score', C.amber], ['repeats → less and less', C.cyan]], C.green));
}
