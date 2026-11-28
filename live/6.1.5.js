// lesson 6.1.5
// 6.1.5 Consistency.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Layout: ml line 499..503 with TRUE 501 (and DIAL 500 for recipe B). Early beats: spread bars (typical distance)
// for 1 / 4 / 16 / 64 bottles + a legend (left on laptop, under the line on phone). Then the cyan hill for 4, 16, 64
// bottles, the "within 1 ml" band, and the pink hill getting thin around 500.5.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;

  const PILL = P ? [0, 4.3, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 3.1, 0] : [4.75, 0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    const BC = P ? [0, 3.95 - ht / 2, 0] : BOXP;   // phone: the box hangs from a fixed top
    r.setFill(C.card, 0.95); r.moveTo(BC);
    const left = BC[0] - wd / 2 + 0.32, top = BC[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 3.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // ---- geometry
  const LY = P ? -2.2 : -2.6;
  const x0 = P ? -3.5 : -4.0, L0 = P ? 6.7 : 5.9;
  const n2x = v => x0 + (v - 499) / 4 * L0;
  const ROW = P ? 0.75 : 0.65, ROW0 = 0.65;
  const rowY = k => LY + ROW0 + (3 - k) * ROW;
  const goldTop = rowY(0) + 0.55;
  const NUM = P ? 18 : 19;
  const legX = P ? -3.4 : -6.85;
  const legY = k => P ? -3.6 - k * 0.62 : rowY(k);
  const capY = P ? -3.05 : goldTop + 0.45;

  const axis = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [499, 500, 501, 502, 503].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted }),
    T(String(v), P ? 16 : 17, C.muted, true).moveTo([n2x(v), LY - 0.36, 0])
  ));
  const unit = T('ml', P ? 16 : 17, C.muted); unit.moveTo([x0 + L0 + 0.3, LY, 0]);
  const gold = new M.DashedLine({ start: [n2x(501), LY, 0], end: [n2x(501), goldTop, 0], color: C.amber, strokeWidth: 3 });
  const goldTag = pill('TRUE 501', C.amber, 16); goldTag.moveTo([n2x(501), goldTop + 0.3, 0]);
  const dial = new M.Line({ start: [n2x(500), LY, 0], end: [n2x(500), goldTop, 0], color: C.muted, strokeWidth: 2.5 });
  const dialTag = pill('DIAL 500', C.muted, 16); dialTag.moveTo([n2x(500) - 0.1 - dialTag.getWidth() / 2, goldTop + 0.3, 0]);

  function bar(c, half, k, color) {
    const y = rowY(k), lo = c - half, hi = c + half;
    const ln = new M.Line({ start: [n2x(lo), y, 0], end: [n2x(hi), y, 0], color, strokeWidth: 7 });
    const c1 = new M.Line({ start: [n2x(lo), y - 0.16, 0], end: [n2x(lo), y + 0.16, 0], color, strokeWidth: 4 });
    const c2 = new M.Line({ start: [n2x(hi), y - 0.16, 0], end: [n2x(hi), y + 0.16, 0], color, strokeWidth: 4 });
    const mid = new M.Dot({ point: [n2x(c), y, 0], radius: 0.1, color });
    return new M.VGroup(ln, c1, c2, mid);
  }
  function legend(s, k, color) {
    const t = T(s, NUM, color, true);
    t.moveTo([legX + t.getWidth() / 2, legY(k), 0]);
    return t;
  }
  // histogram whose area stays the same: narrower = taller
  const HMAX = goldTop - LY - 0.2;
  function makeHist(mu, sd, color) {
    const bars = [], nBins = 40, bw = 4 / nBins, pxW = L0 / nBins * 0.88;
    const top = Math.min(HMAX, HMAX * 0.25 / sd);
    for (let i = 0; i < nBins; i++) {
      const vc = 499 + (i + 0.5) * bw, z = (vc - mu) / sd, h = top * Math.exp(-0.5 * z * z);
      if (h < 0.04) continue;
      const rect = new M.Rectangle({ width: pxW, height: h, color, strokeWidth: 1 });
      rect.setFill(color, 0.5); rect.moveTo([n2x(vc), LY + h / 2, 0]); bars.push(rect);
    }
    return new M.VGroup(...bars);
  }

  // 0: 4 bottles each day
  await until(S(0));
  await play(new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, unit)), new M.Create(gold), new M.FadeIn(goldTag),
    ...say('SO FAR: 4 BOTTLES EACH DAY'));

  // 1: what if she measured more bottles?
  await until(S(1));
  await play(...fbox(['bottles per day:', ['4 → 16 → 64 ?', C.amber]], C.amber), ...say('WHAT IF MORE BOTTLES?', C.amber));

  // 2: would both recipes improve?
  await until(S(2));
  await play(...fbox([['recipe A', C.cyan], ['recipe B', PINK], 'better with more?'], C.ink), ...say('DO BOTH RECIPES IMPROVE?', C.ink));

  // 3: Recipe A, plain average
  const legCap = T('typical distance (SD)', P ? 16 : 15, C.muted); legCap.moveTo([P ? 0 : -5.55, capY, 0]);
  await until(S(3));
  await play(new M.FadeIn(legCap), ...fbox([['Recipe A', C.cyan], 'plain average'], C.cyan), ...say('RECIPE A: PLAIN AVERAGE', C.cyan));

  // 4: 4 bottles -> SE = 1 ml
  const bar4 = bar(501, 1, 1, C.cyan), leg4 = legend('4 bottles: ±1', 1, C.cyan);
  await until(S(4));
  await play(new M.Create(bar4), new M.FadeIn(leg4), ...fbox([['4 bottles', C.cyan], 'standard error = 1 ml'], C.cyan), ...say('4 BOTTLES: STANDARD ERROR 1 ml', C.cyan));

  // 5: 1 bottle spread = 2 ml
  const bar1 = bar(501, 2, 0, C.ink), leg1 = legend('1 bottle: ±2', 0, C.ink);
  await until(S(5));
  await play(new M.Create(bar1), new M.FadeIn(leg1), ...fbox(['1 bottle: SD = 2 ml'], C.ink), ...say('1 BOTTLE SPREAD = 2 ml', C.ink));

  // 6: divide by sqrt(n)
  await until(S(6));
  await play(...fbox([['standard error', C.cyan], '= 2 ÷ √(bottles)'], C.cyan), ...say('2 ÷ √(NUMBER OF BOTTLES)', C.cyan));

  // 7: sqrt(16)=4, sqrt(64)=8
  await until(S(7));
  await play(...fbox(['√16 = 4  (4 × 4 = 16)', '√64 = 8  (8 × 8 = 64)'], C.cyan), ...say('√16 = 4   ·   √64 = 8', C.cyan));

  // 8: 16 bottles -> 0.5 ml
  const bar16 = bar(501, 0.5, 2, C.cyan), leg16 = legend('16 bottles: ±0.5', 2, C.cyan);
  await until(S(8));
  await play(new M.Create(bar16), new M.FadeIn(leg16), ...fbox(['16 bottles:', ['2 ÷ 4 = 0.5 ml', C.cyan]], C.cyan), ...say('16 BOTTLES: 0.5 ml', C.cyan));

  // 9: 64 bottles -> 0.25 ml
  const bar64 = bar(501, 0.25, 3, C.cyan), leg64 = legend('64 bottles: ±0.25', 3, C.cyan);
  await until(S(9));
  await play(new M.Create(bar64), new M.FadeIn(leg64), ...fbox(['64 bottles:', ['2 ÷ 8 = 0.25 ml', C.cyan]], C.cyan), ...say('64 BOTTLES: 0.25 ml', C.cyan));

  // 10: 1,000 days, 4 bottles -> wide cyan hill
  const hA4 = makeHist(501, 1.0, C.cyan), hA16 = makeHist(501, 0.5, C.cyan), hA64 = makeHist(501, 0.25, C.cyan);
  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(bar1, bar4, bar16, bar64, leg1)), new M.FadeIn(hA4), new M.Indicate(leg4, { color: C.amber }),
    ...fbox(['1,000 days,', ['4 bottles each', C.cyan]], C.cyan), ...say('4 BOTTLES: WIDE CYAN HILL', C.cyan));

  // 11: 16 -> narrower and taller
  await until(S(11));
  await play(new M.FadeOut(hA4), new M.FadeIn(hA16), new M.Indicate(leg16, { color: C.amber }),
    ...fbox(['1,000 days,', ['16 bottles each', C.cyan]], C.cyan), ...say('16 BOTTLES: NARROWER & TALLER', C.cyan));

  // 12: 64 -> thin spike on gold line
  await until(S(12));
  await play(new M.FadeOut(hA16), new M.FadeIn(hA64), new M.Indicate(leg64, { color: C.amber }),
    ...fbox(['1,000 days,', ['64 bottles each', C.cyan]], C.cyan), ...say('64 BOTTLES: THIN SPIKE ON 501', C.cyan));

  // 13: within 1 ml of truth (500 to 502): green outline band
  const band = new M.Rectangle({ width: n2x(502) - n2x(500), height: goldTop - LY - 0.05, color: C.green, strokeWidth: 2.5 });
  band.setFill(C.green, 0.06); band.moveTo([n2x(501), (LY + goldTop) / 2, 0]);
  const bandLab = T('within 1 ml', NUM, C.green, true); bandLab.moveTo([n2x(502) + 0.15 + bandLab.getWidth() / 2, rowY(0), 0]);
  await until(S(13));
  await play(new M.FadeIn(band), new M.FadeIn(bandLab), ...fbox(['how often within', ['1 ml of 501?', C.green]], C.green), ...say('WITHIN 1 ml OF THE TRUTH', C.green));

  // 14-16: share of days inside the band
  const gA4 = makeHist(501, 1.0, C.cyan), gA16 = makeHist(501, 0.5, C.cyan), gA64 = makeHist(501, 0.25, C.cyan);
  await until(S(14));
  await play(new M.FadeOut(hA64), new M.FadeIn(gA4),
    ...fbox(['within 1 ml of 501:', ['4 bottles: ~68 in 100', C.cyan]], C.green), ...say('4 BOTTLES: ABOUT 68 IN 100 DAYS', C.cyan));

  await until(S(15));
  await play(new M.FadeOut(gA4), new M.FadeIn(gA16),
    ...fbox(['within 1 ml of 501:', '4 bottles: ~68 in 100', ['16 bottles: ~95 in 100', C.cyan]], C.green), ...say('16 BOTTLES: ABOUT 95 IN 100 DAYS', C.cyan));

  await until(S(16));
  await play(new M.FadeOut(gA16), new M.FadeIn(gA64),
    ...fbox(['4 bottles: ~68 in 100', '16 bottles: ~95 in 100', ['64 bottles: almost always', C.green]], C.green), ...say('64 BOTTLES: ALMOST EVERY DAY', C.green));

  // 17: crowd closer and closer around truth
  await until(S(17));
  await play(new M.Indicate(gA64, { color: C.amber }), ...say('CROWDS CLOSER TO THE TRUTH', C.amber));

  // 18: consistent
  await until(S(18));
  await play(...fbox([['CONSISTENT', C.green], 'crowds onto the truth', 'as the sample grows'], C.green), ...say('CONSISTENT', C.green));

  // 19: definition in plain words
  await until(S(19));
  await play(...fbox(['enough data:', ['as close as you want,', C.green], ['almost every time', C.green]], C.green), ...say('ENOUGH DATA → AS CLOSE AS YOU WANT', C.green));

  // 20: Recipe A is consistent
  await until(S(20));
  await play(...fbox([['Recipe A', C.cyan], ['is consistent', C.green]], C.green), ...say('RECIPE A IS CONSISTENT', C.green));

  // 21: Now Recipe B (cyan items go, pink legend will come)
  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(gA64, band, bandLab, leg4, leg16, leg64)), new M.Create(dial), new M.FadeIn(dialTag),
    ...fbox([['Recipe B', PINK], 'halfway to the dial 500'], PINK), ...say('NOW RECIPE B', PINK));

  // 22: halfway to 500
  await until(S(22));
  await play(new M.Indicate(dial, { color: C.muted }), ...fbox([['B =', PINK], '(sample mean + 500) ÷ 2'], PINK), ...say('HALFWAY FROM SAMPLE MEAN TO 500', PINK));

  // 23: sample average gets close to 501
  await until(S(23));
  await play(new M.Indicate(gold, { color: C.amber }), ...fbox(['more bottles:', ['sample mean → 501', C.cyan]], C.cyan), ...say('SAMPLE MEAN → 501', C.amber));

  // 24: B lands near 500.5
  const bLine = new M.Line({ start: [n2x(500.5), LY, 0], end: [n2x(500.5), rowY(0), 0], color: PINK, strokeWidth: 3 });
  const bLab = legend('B centre: 500.5', 0, PINK);
  await until(S(24));
  await play(new M.Create(bLine), new M.FadeIn(bLab), ...fbox(['(501 + 500) ÷ 2', ['= 500.5', PINK]], PINK), ...say('B STILL LANDS NEAR 500.5', PINK));

  // 25: pink hill gets thinner (0.5 -> 0.25 -> 0.125), legend follows
  const hB4 = makeHist(500.5, 0.5, PINK), hB16 = makeHist(500.5, 0.25, PINK), hB64 = makeHist(500.5, 0.125, PINK);
  const lb4 = legend('B, 4: ±0.5', 1, PINK), lb16 = legend('B, 16: ±0.25', 2, PINK), lb64 = legend('B, 64: ±0.125', 3, PINK);
  await until(S(25));
  await play(new M.FadeIn(hB4), new M.FadeIn(lb4), ...fbox([['Recipe B, SD:', PINK], '0.5 → 0.25 → 0.125 ml'], PINK), ...say('PINK HILL GETS THINNER', PINK));
  await play(new M.FadeOut(hB4), new M.FadeIn(hB16), new M.FadeIn(lb16));
  await play(new M.FadeOut(hB16), new M.FadeIn(hB64), new M.FadeIn(lb64));

  // 26: gets thin in the WRONG place (0.5 below gold line)
  const offY = rowY(1);
  const offGap = new M.Arrow({ start: [n2x(501), offY, 0], end: [n2x(500.5) + 0.05, offY, 0], color: C.amber, strokeWidth: 4, buff: 0, tipLength: 0.16 });
  const offLab = T('0.5 ml low', NUM, C.amber, true); offLab.moveTo([n2x(501) + 0.2 + offLab.getWidth() / 2, offY, 0]);
  await until(S(26));
  await play(new M.GrowArrow(offGap), new M.FadeIn(offLab), ...say('THIN IN THE WRONG PLACE', PINK));

  // 27: shrinks scatter, never its lean
  await until(S(27));
  await play(...fbox([['Recipe B', PINK], 'scatter → 0', ['lean stays −0.5 ml', C.violet]], PINK), ...say('SHRINKS SCATTER, NEVER LEAN', C.violet));

  // 28: B is not consistent
  await until(S(28));
  await play(...fbox([['Recipe B', PINK], ['is NOT consistent', C.violet]], C.violet), ...say('RECIPE B IS NOT CONSISTENT', C.violet));

  // 29: B won at 4 bottles, but with more data lean dominates
  await until(S(29));
  await play(new M.Indicate(offGap, { color: C.amber }), ...fbox(['4 bottles: B won', ['more data: the lean', C.amber], ['is most of the error', C.amber]], C.amber), ...say('WITH MORE DATA, LEAN DOMINATES', C.amber));

  // 30: at 16 bottles, MSE(A)=0.25, MSE(B)=0.3125 -> A wins
  await until(S(30));
  await play(...fbox(['16 bottles, MSE:', ['A: 0.25 + 0 = 0.25', C.cyan], ['B: 0.0625 + 0.25 ≈ 0.31', PINK], ['A wins', C.green]], C.cyan),
    ...say('16 BOTTLES: A (0.25) BEATS B (0.31)', C.cyan));

  // 31: definition: pick any small margin (0.1 ml)
  const m1 = new M.DashedLine({ start: [n2x(500.9), LY, 0], end: [n2x(500.9), rowY(0), 0], color: C.green, strokeWidth: 2 });
  const m2 = new M.DashedLine({ start: [n2x(501.1), LY, 0], end: [n2x(501.1), rowY(0), 0], color: C.green, strokeWidth: 2 });
  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(offGap, offLab)), new M.Create(m1), new M.Create(m2),
    ...fbox(['pick any small margin', ['e.g. 0.1 ml around 501', C.green]], C.green), ...say('PICK ANY SMALL MARGIN', C.green));

  // 32: chance of missing by more than margin -> 0
  await until(S(32));
  await play(...fbox([['consistent:', C.green], 'chance of missing by', 'more than the margin', ['shrinks toward 0', C.green]], C.green), ...say('CHANCE OF MISSING → 0', C.green));

  // 33: handy check: bias -> 0 AND variance -> 0
  await until(S(33));
  await play(...fbox(['handy check:', ['bias → 0 and', C.green], ['variance → 0', C.green], ['recipe A passes', C.cyan]], C.green), ...say('BIAS → 0 AND VARIANCE → 0', C.green));

  // 34: camera zooming on a target
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(m1, m2)), new M.Indicate(gold, { color: C.amber }), new M.Indicate(bLine, { color: PINK }),
    ...fbox(['zoom in:', ['A stays centred', C.cyan], ['B drifts to the side', PINK]], C.ink), ...say('ZOOMING IN ON THE TARGET', C.amber));

  // 35: what is it for? minimum promise
  await until(S(35));
  await play(...fbox(['minimum promise:', ['more data → as close', C.green], ['as you need', C.green]], C.green), ...say('MORE DATA → CLOSER TO TRUTH', C.green));

  // 36: spending on more measurements pays off
  await until(S(36));
  await play(...fbox(['more measurements', ['pay off', C.green]], C.green), ...say('MORE MEASUREMENTS PAY OFF', C.green));

  // 37: Trap - more data does not fix a built-in lean
  await until(S(37));
  await play(new M.Indicate(hB64, { color: C.violet }), ...fbox([['TRAP', C.violet], 'more data never fixes', 'a built-in lean'], C.violet), ...say('TRAP: MORE DATA ≠ LESS BIAS', C.violet));

  // 38: more confidently wrong
  await until(S(38));
  await play(...fbox(['a biased recipe:', ['more confidently wrong', C.violet]], C.violet), ...say('ONLY MORE CONFIDENTLY WRONG', C.violet));

  // 39: biased sample (only people who reply)
  await until(S(39));
  await play(...fbox(['same for a biased sample:', ['asking only the people', C.violet], ['who reply', C.violet]], C.violet), ...say('SAME FOR A BIASED SAMPLE', C.violet));

  // 40: next lesson - new angle
  await until(S(40));
  await play(...say('NEXT: WHICH VALUE EXPLAINS THE DATA?', C.cyan));

  // 41: one-sentence summary
  await until(S(41));
  await play(...fbox([['CONSISTENT RECIPE', C.green], 'gets closer and closer', 'to the truth as data grows'], C.green), ...say('CONSISTENCY = CLOSER WITH MORE DATA', C.green));
}
