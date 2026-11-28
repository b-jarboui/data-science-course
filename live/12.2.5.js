// lesson 12.2.5
// Missingness indicators: fill the blank with the training mean, but keep a 0/1 record that it was blank. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;
  const PILL = P ? [0, 2.12, 0] : [0, 2.03, 0];
  const BOXP = P ? [0, 3.38, 0] : [0, -2.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const txt = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const rect = (w, h, pos, color, fill = C.card, op = 0.95, sw = 2) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: sw }); r.setFill(fill, op); r.moveTo(pos); return r; };
  const bar = (w, h, pos, color, op = 0.85) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(pos); return r; };
  const tag = (s, color, pos, size = 17) => { const t = pill(s, color, P ? Math.max(size, 18) : size); t.moveTo(pos); return t; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x, { runTime: 0.45 }));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x, { runTime: 0.3 }));
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.25 })] : [];
    boxNow = null; if (!lines) return a;
    const size = P ? 21 : 20, lh = P ? 0.4 : 0.34;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = rect(wd, ht, BOXP, color);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.1 : 10.8) / wd, (P ? 1.6 : 1.1) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP); a.push(new M.FadeIn(g, { runTime: 0.35 })); boxNow = g; return a;
  }
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic.filter(x => !n.includes(x)), ...mk.filter(x => !n.includes(x))), ...fin(...n.filter(x => !pic.includes(x) && !mk.includes(x)))]; pic = n; mk = []; return a; };
  const addPic = (...o) => { pic.push(...o.filter(Boolean)); return fin(...o); };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk.filter(x => !n.includes(x))), ...fin(...n.filter(x => !mk.includes(x)))]; mk = n; return a; };
  const swap = (oldO, newO) => { pic = pic.filter(o => o !== oldO); pic.push(newO); return [new M.FadeOut(oldO, { runTime: 0.3 }), new M.FadeIn(newO, { runTime: 0.45 })]; };

  // ---- 0-7 two listings ----
  const LW = P ? 6.6 : 4.6, LH = P ? 2.7 : 2.3;
  const LA = P ? [0, 0.2, 0] : [-3, 0, 0], LB = P ? [0, -3.1, 0] : [3, 0, 0];
  const listing = (p, n) => new M.VGroup(rect(LW, LH, p, C.muted), txt(`BIKE FOR SALE · SELLER ${n}`, P ? 21 : 17, C.ink, [p[0], p[1] + LH / 2 - (P ? 0.45 : 0.35), 0]),
    txt('mileage:', P ? 22 : 18, C.muted, [p[0] - (P ? 1.4 : 1.1), p[1] - 0.25, 0], true));
  const l1 = listing(LA, 1), l2 = listing(LB, 2);
  // a simple bike drawing fills the place of the second listing until it appears
  const bikeAt = (c, s, color) => {
    const pt = (x, y) => [c[0] + x * s, c[1] + y * s, 0];
    const w1 = new M.Circle({ radius: 0.85 * s, color: C.ink, strokeWidth: 3 }); w1.moveTo(pt(-1.35, -0.45));
    const w2 = new M.Circle({ radius: 0.85 * s, color: C.ink, strokeWidth: 3 }); w2.moveTo(pt(1.35, -0.45));
    const fr = [[[-1.35, -0.45], [-0.25, 0.65]], [[-0.25, 0.65], [1.0, 0.65]], [[1.0, 0.65], [1.35, -0.45]],
      [[-1.35, -0.45], [0.05, -0.45]], [[0.05, -0.45], [-0.25, 0.65]], [[0.05, -0.45], [1.0, 0.65]],
      [[-0.25, 0.65], [-0.4, 0.95]], [[-0.6, 0.95], [-0.15, 0.95]], [[1.0, 0.65], [0.9, 1.05]], [[0.7, 1.05], [1.15, 1.05]]]
      .map(([a, b]) => new M.Line({ start: pt(...a), end: pt(...b), color, strokeWidth: 4 }));
    return new M.VGroup(w1, w2, ...fr);
  };
  const bike0 = bikeAt([LB[0], LB[1] + 0.1, 0], P ? 0.95 : 0.8, C.cyan);
  await until(S(0)); await play(...picture(l1, bike0), ...say('YOU WANT TO BUY A USED BIKE'));
  await until(S(1)); await play(...swap(bike0, l2), ...say('TWO BIKES FOR SALE ONLINE'));
  const m1 = txt('3,000 km', P ? 26 : 22, C.cyan, [LA[0] + (P ? 1.15 : 0.8), LA[1] - 0.25, 0], true);
  const m2 = txt('______', P ? 26 : 22, C.muted, [LB[0] + (P ? 1.15 : 0.8), LB[1] - 0.25, 0], true);
  await until(S(2)); await play(...addPic(m1), ...fbox(['seller 1: travelled', ['3,000 km', C.cyan]]), ...say('SELLER 1: 3,000 KILOMETRES'));
  await until(S(3)); await play(...addPic(m2), new M.Flash(m2, { color: C.violet, flashRadius: 0.6 }), ...fbox(['seller 2: left it', ['BLANK', C.violet]], C.violet), ...say('SELLER 2: LEFT IT BLANK', C.violet));
  await until(S(4)); await play(...fbox(null), ...say('WHICH BIKE FEELS SAFER TO BUY?', C.amber));
  const nb = P ? [0, -5.1, 0] : [3, -1.45, 0];
  await until(S(5)); await play(...marks(tag('FORGOT THE NUMBER?', C.muted, nb, 15)), ...say('MAYBE THEY FORGOT', C.muted));
  await until(S(6)); await play(...marks(tag('OR HIDING A BIG NUMBER?', PINK, nb, 15)), ...say('OR MAYBE THEY HIDE IT', PINK));
  await until(S(7)); await play(...marks(), ...fbox(['a blank can tell us', ['something useful', C.green]], C.green), ...say('EVEN A BLANK IS A CLUE', C.green));

  // ---- 8-14 training bikes ----
  const BR = { F: ['Falcon', C.cyan], R: ['Ridge', C.amber], S: ['Swift', PINK] };
  const B = [['F', 1000, 700], ['R', 2000, 400], ['S', 3000, 300], ['F', 3000, 500], ['R', 3000, 200], ['S', 4000, 200], ['F', 4000, 600], ['R', 4000, 300], ['R', null, 150], ['S', null, 150]];
  const CW = P ? 3.6 : 2.4, CH = P ? 1.36 : 1.15, FS = P ? 18 : 15;
  const pos = i => P ? [(i % 2 ? 1 : -1) * 1.88, 1.05 - Math.floor(i / 2) * 1.58, 0] : [((i % 5) - 2) * 2.62, 0.85 - Math.floor(i / 5) * 1.4, 0];
  const at = (i, k) => { const p = pos(i); // k: title, price, mile, tag
    if (P) return { title: [p[0] - 0.5, p[1] + 0.3, 0], price: [p[0] + 1.2, p[1] + 0.3, 0], mile: [p[0] - 0.55, p[1] - 0.28, 0], tag: [p[0] + 1.2, p[1] - 0.28, 0] }[k];
    return { title: [p[0], p[1] + 0.35, 0], price: [p[0] - 0.35, p[1] - 0.33, 0], mile: [p[0] - 0.35, p[1], 0], tag: [p[0] + 0.78, p[1], 0] }[k];
  };
  const fmt = n => n.toLocaleString('en-US');
  const cards = B.map(([b, , pr], i) => new M.VGroup(rect(CW, CH, pos(i), BR[b][1]), txt(`Bike ${i + 1} · ${BR[b][0]}`, FS, BR[b][1], at(i, 'title'), false, P ? 2.3 : 0),
    txt(`$${pr}`, FS, C.green, at(i, 'price'), true)));
  const mile = (i, s, color) => txt(s, FS, color, at(i, 'mile'), true);
  const mil = B.map(([, km], i) => km ? mile(i, `${fmt(km)} km`, C.ink) : mile(i, 'blank', C.violet));
  const ind = (i, s, color) => { const p = at(i, 'tag'); return new M.VGroup(rect(P ? 0.72 : 0.62, P ? 0.42 : 0.32, p, color, C.bg, 0.8, 1.5), txt(s, FS, color, p, true)); };
  const all8 = [0, 1, 2, 3, 4, 5, 6, 7];
  const outline = (i, color) => rect(CW + 0.1, CH + 0.1, pos(i), color, color, 0, 3);

  await until(S(8)); await play(...picture(...all8.map(i => cards[i]), ...all8.map(i => mil[i])), ...fbox(['8 training bikes', ['the model learns from them', C.muted]]), ...say('OUR 8 TRAINING BIKES'));
  await until(S(9)); await play(new M.LaggedStart(all8.map(i => new M.Indicate(mil[i], { color: C.amber })), { lagRatio: 0.12, runTime: 1.6 }), ...fbox(['mileage = total distance', ['the bike has travelled', C.muted]]), ...say('EACH BIKE HAS A MILEAGE', C.amber));
  await until(S(10)); await play(...say('ADD TWO MORE SOLD BIKES', C.violet));
  await until(S(11)); await play(...addPic(cards[8]), ...fbox(['bike 9: Ridge, 5 years old', ['sold for $150', C.green]], C.amber), ...say('BIKE 9: RIDGE, $150', C.amber));
  await until(S(12)); await play(...addPic(cards[9]), ...fbox(['bike 10: Swift, 6 years old', ['sold for $150', C.green]], PINK), ...say('BIKE 10: SWIFT, $150', PINK));
  await until(S(13)); await play(...addPic(mil[8], mil[9]), ...marks(outline(8, C.violet), outline(9, C.violet)), ...fbox([['mileage: blank', C.violet], 'on both bikes'], C.violet), ...say('BOTH MILEAGES LEFT BLANK', C.violet));
  await until(S(14)); await play(...fbox([['MISSING VALUES', C.violet], 'numbers that we do not have'], C.violet), ...say('BLANKS = MISSING VALUES', C.violet));

  // ---- 15-23 fill: not zero, the mean ----
  await until(S(15)); await play(...marks(), ...fbox(['the model needs numbers', ['what goes in the blanks?', C.amber]], C.amber), ...say('WHAT SHOULD GO IN THE BLANKS?', C.amber));
  let z8 = mile(8, '0 km', PINK), z9 = mile(9, '0 km', PINK);
  await until(S(16)); await play(...swap(mil[8], z8), ...swap(mil[9], z9), ...say('ZERO KILOMETRES FOR BOTH?', PINK));
  mil[8] = z8; mil[9] = z9;
  await until(S(17)); await play(...marks(outline(8, PINK), outline(9, PINK)), ...fbox(['0 km = never ridden', ['anywhere at all', PINK]], PINK), ...say('ZERO SAYS: NEVER RIDDEN', PINK));
  const blank = i => mile(i, 'blank', C.violet);
  z8 = blank(8); z9 = blank(9);
  await until(S(18)); await play(...marks(), ...swap(mil[8], z8), ...swap(mil[9], z9), ...fbox(['missing is NOT zero'], PINK), ...say('BUT WE DO NOT KNOW THAT', PINK));
  mil[8] = z8; mil[9] = z9;
  await until(S(19)); await play(...marks(...all8.map(i => outline(i, C.amber))), ...fbox(['mean mileage of the', ['8 bikes with a known number', C.amber]], C.amber), ...say('FIND THE MEAN OF THE 8 KNOWN', C.amber));
  await until(S(20)); await play(...fbox(['1,000 + 2,000 + 3,000 + 3,000', '+ 3,000 + 4,000 + 4,000 + 4,000', ['= 24,000 km', C.amber]], C.amber), ...say('ADD: 24,000 KILOMETRES', C.amber));
  await until(S(21)); await play(...fbox(['24,000 ÷ 8', ['= 3,000 km', C.amber]], C.amber), ...say('MEAN = 3,000 KILOMETRES', C.amber));
  const f = i => mile(i, '3,000 km', C.amber);
  z8 = f(8); z9 = f(9);
  await until(S(22)); await play(...marks(), ...swap(mil[8], z8), ...swap(mil[9], z9), ...say('FILL BOTH BLANKS WITH 3,000', C.amber));
  mil[8] = z8; mil[9] = z9;
  await until(S(23)); await play(...fbox([['IMPUTATION', C.amber], 'filling a missing value', 'with a chosen value'], C.amber), ...say('THIS IS IMPUTATION', C.amber));

  // ---- 24-27 information lost ----
  const five = [2, 3, 4, 8, 9];
  await until(S(24)); await play(...marks(...five.map(i => outline(i, C.violet))), ...say('LOOK AT BIKES 3, 4, 5, 9 AND 10', C.violet));
  await until(S(25)); await play(new M.LaggedStart(five.map(i => new M.Indicate(mil[i], { color: C.violet })), { lagRatio: 0.15, runTime: 1.6 }), ...fbox(['all five show', ['3,000 km', C.amber]], C.violet), ...say('ALL FIVE SHOW 3,000 KM', C.violet));
  await until(S(26)); await play(...fbox(['which sellers left it blank?', ['we cannot see any more', PINK]], PINK), ...say('WHICH WERE BLANK? WE CAN’T TELL', PINK));
  await until(S(27)); await play(...fbox(['lost clue:', ['“the seller left it blank”', PINK]], PINK), ...say('A USEFUL CLUE IS LOST', PINK));

  // ---- 28-38 the indicator ----
  z8 = blank(8); z9 = blank(9);
  const yn = B.map((_, i) => i >= 8 ? ind(i, 'yes', C.violet) : ind(i, 'no', C.muted));
  await until(S(28)); await play(...marks(), ...swap(mil[8], z8), ...swap(mil[9], z9), ...addPic(...yn), ...fbox(['back to the original cards', ['+ a small tag by each mileage', C.violet]], C.violet), ...say('ADD A SMALL TAG TO EACH MILEAGE', C.violet));
  mil[8] = z8; mil[9] = z9;
  await until(S(29)); await play(new M.LaggedStart(yn.map(t => new M.Indicate(t.submobjects[1], { color: C.violet })), { lagRatio: 0.1, runTime: 1.6 }), ...fbox([['yes = mileage was missing', C.violet], 'no  = mileage was known'], C.violet), ...say('YES = MISSING, NO = KNOWN', C.violet));
  await until(S(30)); await play(...fbox(['the model needs numbers'], C.violet), ...say('TURN THE TAGS INTO NUMBERS', C.violet));
  const ones = B.map((_, i) => i >= 8 ? ind(i, '1', C.violet) : ind(i, '0', C.muted));
  await until(S(31)); await play(...yn.flatMap((t, i) => swap(t, ones[i])), ...fbox(['no  → 0', ['yes → 1', C.violet]], C.violet), ...say('NO = 0, YES = 1', C.violet));
  await until(S(32)); await play(...fbox([['MISSINGNESS INDICATOR', C.violet], 'the new 0 / 1 column'], C.violet), ...say('A MISSINGNESS INDICATOR', C.violet));
  await until(S(33)); await play(...fbox([['INDICATOR', C.violet], 'a number that says', 'whether something is true'], C.violet), ...say('INDICATOR: IS IT TRUE? 1 OR 0', C.violet));
  await until(S(34)); await play(...fbox(['missing = 1  if mileage is blank', '        = 0  otherwise'], C.violet), ...say('OUR RULE FOR THE NEW COLUMN', C.violet));
  await until(S(35)); await play(new M.LaggedStart(all8.map(i => new M.Indicate(ones[i].submobjects[1], { color: C.cyan })), { lagRatio: 0.1, runTime: 1.4 }), ...fbox(['bikes 1 to 8 → 0']), ...say('BIKES 1 TO 8 GET 0'));
  await until(S(36)); await play(...marks(outline(8, C.violet), outline(9, C.violet)), ...fbox([['bikes 9 and 10 → 1', C.violet]], C.violet), ...say('BIKES 9 AND 10 GET 1', C.violet));
  z8 = f(8); z9 = f(9);
  await until(S(37)); await play(...swap(mil[8], z8), ...swap(mil[9], z9), ...fbox(['fill the blanks again:', ['3,000 km', C.amber]], C.amber), ...say('FILL THE BLANKS WITH 3,000 AGAIN', C.amber));
  mil[8] = z8; mil[9] = z9;
  await until(S(38)); await play(new M.Indicate(ones[8].submobjects[1], { color: C.violet }), new M.Indicate(ones[9].submobjects[1], { color: C.violet }),
    ...fbox(['3,000 km + indicator 1', ['the record of “was missing” stays', C.violet]], C.violet), ...say('THE INDICATOR REMEMBERS', C.violet));

  // ---- 39-47 why it helps ----
  await until(S(39)); await play(...marks(), ...say('WHY MIGHT THIS COLUMN HELP?', C.green));
  await until(S(40)); await play(...marks(...all8.map(i => outline(i, C.green))), ...fbox(['700 + 400 + 300 + 500', '+ 200 + 200 + 600 + 300', ['= $3,200', C.green]], C.green), ...say('KNOWN MILEAGE: $3,200 IN TOTAL', C.green));
  await until(S(41)); await play(...fbox(['$3,200 ÷ 8', ['= $400 mean price', C.green]], C.green), ...say('MEAN PRICE: $400', C.green));
  await until(S(42)); await play(...marks(outline(8, C.violet), outline(9, C.violet)), ...fbox(['150 + 150', ['= $300', C.violet]], C.violet), ...say('MISSING MILEAGE: $300 IN TOTAL', C.violet));
  await until(S(43)); await play(...fbox(['$300 ÷ 2', ['= $150 mean price', C.violet]], C.violet), ...say('MEAN PRICE: $150', C.violet));
  const BX = P ? -3.3 : -4.6, BL = P ? 5.2 : 7.2, y1 = P ? -0.3 : 0.7, y2 = P ? -3.5 : -0.75, BH = P ? 1.0 : 0.45;
  const b1 = bar(BL, BH, [BX + BL / 2, y1, 0], C.green), b2 = bar(BL * 150 / 400, BH, [BX + BL * 150 / 800, y2, 0], C.violet);
  const tl = (s, y) => { const t = T(s, P ? 20 : 17, C.ink); t.moveTo([BX + t.getWidth() / 2, y + BH / 2 + 0.35, 0]); return t; };
  const t1 = tl('mileage known (indicator 0)', y1), t2 = tl('mileage missing (indicator 1)', y2);
  const v1 = txt('$400', P ? 24 : 20, C.green, [BX + BL + (P ? 0.68 : 0.55), y1, 0], true), v2 = txt('$150', P ? 24 : 20, C.violet, [BX + BL * 150 / 400 + (P ? 0.68 : 0.55), y2, 0], true);
  await until(S(44)); await play(...picture(b1, b2, t1, t2, v1, v2), ...fbox(['mean price', ['$400 vs $150', C.amber]], C.amber), ...say('MISSING MILEAGE SOLD FOR LESS', C.amber));
  await until(S(45)); await play(new M.Indicate(v2, { color: C.violet }), ...fbox(['the indicator lets the model', ['learn this difference', C.violet]], C.violet), ...say('THE MODEL CAN LEARN THIS GAP', C.violet));
  await until(S(46)); await play(...fbox(['a blank does NOT prove', ['it causes a lower price', PINK]], PINK), ...say('NOT PROOF OF CAUSE', PINK));
  await until(S(47)); await play(...marks(tag('BIKE 9: 5 YEARS · BIKE 10: 6 YEARS', C.amber, P ? [0, -5.2, 0] : [0, -1.6, 0], 15)), ...fbox(['other things, like age,', ['may explain the gap', C.amber]], C.amber), ...say('AGE MAY EXPLAIN THE DIFFERENCE', C.amber));

  // ---- 48-50 a new bike ----
  const NP = P ? [0, -2.0, 0] : [0, 0.1, 0], NW = P ? 6.8 : 6.0, NK = P ? 1.7 : 1;
  const nCard = new M.VGroup(rect(NW, 2.2 * NK, NP, C.ink), txt('NEW BIKE · mileage left blank', P ? 22 : 19, C.ink, [NP[0], NP[1] + 0.7 * NK, 0]),
    txt('mileage:', P ? 22 : 18, C.muted, [NP[0] - (P ? 2.15 : 1.9), NP[1] - 0.05 * NK, 0], true), txt('missing:', P ? 22 : 18, C.muted, [NP[0] - (P ? 2.15 : 1.9), NP[1] - 0.6 * NK, 0], true));
  let nMile = txt('blank', P ? 22 : 18, C.violet, [NP[0] + 0.3, NP[1] - 0.05 * NK, 0], true);
  const nInd = txt('1', P ? 24 : 20, C.violet, [NP[0] + 0.3, NP[1] - 0.6 * NK, 0], true);
  await until(S(48)); await play(...picture(nCard, nMile, nInd), ...fbox(['new bike, mileage missing', ['indicator = 1', C.violet]], C.violet), ...say('NEW BIKE, BLANK MILEAGE → INDICATOR 1', C.violet));
  const nFill = P ? txt('3,000 km (mean)', 22, C.amber, [NP[0] + 1.15, NP[1] - 0.05 * NK, 0], true)
    : txt('3,000 km (training mean)', 18, C.amber, [NP[0] + 1.2, NP[1] - 0.05, 0], true);
  await until(S(49)); await play(...swap(nMile, nFill), ...fbox(['fill with the SAME training mean', ['3,000 km', C.amber]], C.amber), ...say('SAME TRAINING MEAN: 3,000 KM', C.amber));
  await until(S(50)); await play(new M.Indicate(nInd, { color: C.violet }), ...fbox(['fill the missing number', ['+ keep a record it was missing', C.violet]], C.green), ...say('FILL IT, BUT KEEP THE RECORD', C.green));
}
