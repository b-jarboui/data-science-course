// lesson 12.2.7
// Feature interactions: mileage per year = mileage ÷ age (age 0 counts as 1). Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const PINK = C.pink;
  const PILL = P ? [0, 2.12, 0] : [0, 2.03, 0];
  const BOXP = P ? [0, 3.38, 0] : [0, -2.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const txt = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const rect = (w, h, pos, color, fill = C.card, op = 0.95, sw = 2) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: sw }); r.setFill(fill, op); r.moveTo(pos); return r; };
  const blk = (w, h, pos, color, op = 0.85) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(pos); return r; };
  const tag = (s, color, pos, size = 17) => { const t = pill(s, color, P ? Math.max(size, 17) : size); t.moveTo(pos); return t; };
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

  // ---- 0-8 two bikes, same mileage ----
  const XA = P ? -1.95 : -3.5, XB = P ? 1.95 : 3.5, CY = P ? 1.15 : 1.1, CW = P ? 3.7 : 4.6, CHh = P ? 1.0 : 0.75;
  const head = (x, title, color) => new M.VGroup(rect(CW, CHh, [x, CY, 0], color), txt(title, 18, color, [x, CY + (P ? 0.25 : 0.17), 0]));
  const sub = (x, s, color = C.ink) => txt(s, P ? 17 : 15, color, [x, CY - (P ? 0.2 : 0.17), 0], true, CW - 0.3);
  // two simple bike drawings (wheels + frame) so the opening is not empty
  const drawBike = (c, s, color) => {
    const pt = (x, y) => [c[0] + x * s, c[1] + y * s, 0];
    const w1 = new M.Circle({ radius: 0.85 * s, color: C.ink, strokeWidth: 3 }); w1.moveTo(pt(-1.35, -0.45));
    const w2 = new M.Circle({ radius: 0.85 * s, color: C.ink, strokeWidth: 3 }); w2.moveTo(pt(1.35, -0.45));
    const fr = [[[-1.35, -0.45], [-0.25, 0.65]], [[-0.25, 0.65], [1.0, 0.65]], [[1.0, 0.65], [1.35, -0.45]],
      [[-1.35, -0.45], [0.05, -0.45]], [[0.05, -0.45], [-0.25, 0.65]], [[0.05, -0.45], [1.0, 0.65]],
      [[-0.25, 0.65], [-0.4, 0.95]], [[-0.6, 0.95], [-0.15, 0.95]], [[1.0, 0.65], [0.9, 1.05]], [[0.7, 1.05], [1.15, 1.05]]]
      .map(([a, b]) => new M.Line({ start: pt(...a), end: pt(...b), color, strokeWidth: 4 }));
    return new M.VGroup(w1, w2, ...fr);
  };
  const BA = P ? [0, 0.3, 0] : [-3.5, 0.1, 0], BB = P ? [0, -3.3, 0] : [3.5, 0.1, 0], BS = P ? 0.9 : 0.75;
  const bikeA = drawBike(BA, BS, C.cyan), bikeB = drawBike(BB, BS, C.amber);
  const k1 = tag('3,000 km', C.amber, [BA[0], BA[1] - 1.75 * BS, 0], 20), k2 = tag('3,000 km', C.amber, [BB[0], BB[1] - 1.75 * BS, 0], 20);
  await until(S(0)); await play(...picture(bikeA, bikeB), ...say('CHOOSING BETWEEN TWO USED BIKES'));
  await until(S(1)); await play(...addPic(k1, k2), ...say('BOTH: 3,000 KILOMETRES', C.amber));
  await until(S(2)); await play(...fbox(['used equally', ['heavily?', C.amber]], C.amber), ...say('USED EQUALLY HEAVILY?', C.amber));
  const h4 = head(XA, 'Bike 4 · Falcon', C.cyan), h5 = head(XB, 'Bike 5 · Ridge', C.amber);
  // the two drawings move under their cards and stay until the 100 km blocks arrive
  const BY2 = P ? -1.8 : -0.75, BS2 = P ? 0.8 : 0.6;
  await until(S(3)); await play(...picture(h4, h5, bikeA, bikeB),
    new M.Transform(bikeA, drawBike([XA, BY2, 0], BS2, C.cyan)), new M.Transform(bikeB, drawBike([XB, BY2, 0], BS2, C.amber)),
    ...fbox(['training bikes 4 and 5']), ...say('BIKES 4 AND 5'));
  let s4 = sub(XA, 'age ?  ·  3,000 km'), s5 = sub(XB, 'age ?  ·  3,000 km');
  await until(S(4)); await play(...addPic(s4, s5), ...fbox(['each card: age and mileage']), ...say('AGE AND MILEAGE ON EACH CARD'));
  await until(S(5)); await play(...fbox(['mileage = total distance', ['the bike has travelled', C.muted]]), ...say('MILEAGE = TOTAL DISTANCE', C.amber));
  let n4 = sub(XA, 'age 1  ·  3,000 km', C.cyan);
  await until(S(6)); await play(...swap(s4, n4), ...fbox([['bike 4: 1 year old', C.cyan]]), ...say('BIKE 4: 1 YEAR OLD'));
  s4 = n4;
  let n5 = sub(XB, 'age 6  ·  3,000 km', C.amber);
  await until(S(7)); await play(...swap(s5, n5), ...fbox([['bike 5: 6 years old', C.amber]], C.amber), ...say('BIKE 5: 6 YEARS OLD', C.amber));
  s5 = n5;
  await until(S(8)); await play(...fbox(['same mileage: 3,000 km', ['very different ages: 1 vs 6', PINK]], PINK), ...say('SAME MILEAGE, VERY DIFFERENT AGES', PINK));

  // ---- 9-20 blocks of 100 km ----
  const BW = P ? 0.5 : 0.26, BH = P ? 0.3 : 0.16, GX = P ? 0.58 : 0.3, GY = P ? 0.38 : 0.2;
  const grid = (n, cols, c) => Array.from({ length: n }, (_, i) => [c[0] + ((i % cols) - (cols - 1) / 2) * GX, c[1] - (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * GY, 0]);
  const H4 = P ? [XA, -0.95, 0] : [XA, -0.1, 0], H5 = P ? [XB, -0.95, 0] : [XB, 0.15, 0];
  const b4 = grid(30, P ? 10 : 10, H4).map(p => blk(BW, BH, p, C.cyan));
  const b5 = grid(30, 10, H5).map(p => blk(BW, BH, p, C.amber));
  if (P) { // phone: halves are narrow, use 5 columns
    grid(30, 5, H4).forEach((p, i) => b4[i].moveTo(p)); grid(30, 5, H5).forEach((p, i) => b5[i].moveTo(p));
  }
  pic = pic.filter(o => o !== bikeA && o !== bikeB);
  await until(S(9)); await play(new M.FadeOut(bikeA, { runTime: 0.3 }), new M.FadeOut(bikeB, { runTime: 0.3 }), new M.LaggedStart([...b4, ...b5].map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.6 }), ...fbox(['3,000 km = 30 blocks'], C.amber), ...say('3,000 KM = 30 BLOCKS EACH', C.amber));
  pic.push(...b4, ...b5);
  await until(S(10)); await play(new M.Indicate(b4[0], { color: C.ink }), new M.Indicate(b5[0], { color: C.ink }), ...fbox(['1 block = 100 km']), ...say('1 BLOCK = 100 KILOMETRES'));
  const yw = P ? 3.25 : 3.3, yh = P ? 2.65 : 0.95;
  const year4 = rect(yw, yh, H4, C.cyan, C.cyan, 0.05, 2), y4l = txt('year 1', P ? 18 : 15, C.cyan, [H4[0], H4[1] - yh / 2 - (P ? 0.3 : 0.22), 0]);
  await until(S(11)); await play(...addPic(year4, y4l), ...fbox([['bike 4:', C.cyan], 'all 30 blocks in 1 year']), ...say('BIKE 4: ALL IN ONE YEAR'));
  await until(S(12)); await play(new M.Indicate(s5, { color: C.amber }), ...fbox([['bike 5:', C.amber], '6 years for the same 30 blocks'], C.amber), ...say('BIKE 5: SIX YEARS FOR THE SAME', C.amber));
  await until(S(13)); await play(...say('SHARE IT EQUALLY OVER 6 YEARS', C.amber));
  const BXc = P ? [1.95, -4.15, 0] : [3.5, -0.95, 0], BP = P ? 0.63 : 1.0, BOW = P ? 0.55 : 0.8, BOH = P ? 2.15 : 1.15;
  const bx = k => [BXc[0] + (k - 2.5) * BP, BXc[1], 0];
  const boxes = [0, 1, 2, 3, 4, 5].map(k => rect(BOW, BOH, bx(k), C.amber, C.amber, 0.05, 2));
  const blab = [0, 1, 2, 3, 4, 5].map(k => txt(`yr ${k + 1}`, P ? 16 : 14, C.amber, [bx(k)[0], BXc[1] - BOH / 2 - (P ? 0.28 : 0.2), 0], false, P ? 0.6 : 0));
  const blabT = null;
  await until(S(14)); await play(new M.LaggedStart(boxes.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }), ...fin(...blab, blabT), ...fbox(['6 boxes: one for each year'], C.amber), ...say('6 BOXES, ONE PER YEAR', C.amber));
  pic.push(...boxes, ...blab, ...(blabT ? [blabT] : []));
  const slot = (k, j) => [bx(k)[0], BXc[1] - BOH / 2 + (P ? 0.27 : 0.17) + j * (P ? 0.4 : 0.2), 0];
  const bw2 = P ? 0.4 : 0.6;
  await until(S(15)); await play(new M.LaggedStart(b5.map((b, i) => new M.Transform(b, blk(bw2, BH, slot(i % 6, Math.floor(i / 6)), C.amber))), { lagRatio: 0.08, runTime: Math.max(2.5, E(15) - S(15) - 0.6) }), ...say('DEAL THE 30 BLOCKS OUT EQUALLY', C.amber));
  await until(S(16)); await play(...fbox(['30 blocks ÷ 6 boxes = 5 blocks', ['= 500 km per box', C.amber]], C.amber), ...say('5 BLOCKS = 500 KM EACH', C.amber));
  const r4 = tag(P ? '3,000 KM / YEAR' : '3,000 KM PER YEAR', C.cyan, P ? [XA, -3.25, 0] : [XA, -1.15, 0], 15);
  const r5 = tag(P ? '500 KM / YEAR' : '500 KM PER YEAR', C.amber, P ? [XB, -6.15, 0] : [XB, 0.3, 0], 15);
  await until(S(17)); await play(...addPic(r4), ...fbox(['bike 4: 3,000 ÷ 1', ['= 3,000 km per year', C.cyan]]), ...say('BIKE 4: 3,000 KM PER YEAR'));
  await until(S(18)); await play(...addPic(r5), ...fbox(['bike 5: 3,000 ÷ 6', ['= 500 km per year', C.amber]], C.amber), ...say('BIKE 5: 500 KM PER YEAR (AVERAGE)', C.amber));
  await until(S(19)); await play(...fbox(['not exactly 500 km', ['in every single year', PINK]], PINK), ...say('NOT EXACTLY 500 EVERY YEAR', PINK));
  await until(S(20)); await play(...fbox(['total use, shared out', ['= an average per year', C.green]], C.green), ...say('AN AVERAGE FOR EACH YEAR', C.green));
  await until(S(21)); await play(new M.Indicate(r4.submobjects[1], { color: C.cyan }), new M.Indicate(r5.submobjects[1], { color: C.amber }), ...fbox(['3,000 vs 500 per year', ['mileage alone: 3,000 vs 3,000', C.muted]]), ...say('A DIFFERENCE MILEAGE ALONE HIDES', C.green));
  await until(S(22)); await play(...fbox([['FEATURES', C.cyan], 'age · mileage']), ...say('AGE AND MILEAGE ARE FEATURES'));
  await until(S(23)); await play(...fbox(['new feature:', ['mileage per year', C.green], '= mileage ÷ age'], C.green), ...say('NEW FEATURE: MILEAGE PER YEAR', C.green));
  await until(S(24)); await play(...fbox([['FEATURE INTERACTION', C.violet], 'two features combined', 'into a new one'], C.violet), ...say('A FEATURE INTERACTION', C.violet));

  // ---- 25-31 bikes 6 and 7: km per year as bars ----
  const BASE = P ? -5.5 : -1.45, KS = P ? 1.05 : 0.5;           // height per 1,000 km
  const ybar = (x, km, color) => blk(P ? 0.62 : 0.7, km / 1000 * KS, [x, BASE + km / 1000 * KS / 2, 0], color);
  const ylab = (x, s, color) => txt(s, P ? 17 : 14, color, [x, BASE - (P ? 0.3 : 0.22), 0]);
  const h6 = head(XA, 'Bike 6 · Swift', PINK), h7 = head(XB, 'Bike 7 · Falcon', C.cyan);
  const s6 = sub(XA, 'age 4  ·  4,000 km', PINK), s7 = sub(XB, 'age 1  ·  4,000 km', C.cyan);
  await until(S(25)); await play(...picture(), ...fbox(null), ...say('ANOTHER PAIR OF BIKES', C.violet));
  await until(S(26)); await play(...addPic(h6, s6), ...fbox([['bike 6: 4 years old', PINK], '4,000 km'], PINK), ...say('BIKE 6: 4 YEARS, 4,000 KM', PINK));
  const px6 = k => XA + (k - 1.5) * (P ? 0.86 : 1.0);
  const bars6 = [0, 1, 2, 3].map(k => ybar(px6(k), 1000, PINK)), lab6 = [0, 1, 2, 3].map(k => ylab(px6(k), `yr ${k + 1}`, PINK));
  await until(S(27)); await play(new M.LaggedStart(bars6.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.2 }), ...fin(...lab6), ...fbox(['share 4,000 km', ['over 4 years', PINK]], PINK), ...say('SHARE 4,000 OVER 4 YEARS', PINK));
  pic.push(...bars6, ...lab6);
  const v6 = tag(P ? '1,000 KM / YEAR' : '1,000 KM PER YEAR', PINK, [XA, BASE + KS + 0.4, 0], 14);
  await until(S(28)); await play(...addPic(v6), ...fbox(['4,000 ÷ 4', ['= 1,000 km per year', PINK]], PINK), ...say('1,000 KM PER YEAR', PINK));
  const bar7 = ybar(XB, 4000, C.cyan), lab7 = ylab(XB, 'yr 1', C.cyan);
  await until(S(29)); await play(...addPic(h7, s7, bar7, lab7), ...fbox([['bike 7: 1 year old', C.cyan], 'also 4,000 km']), ...say('BIKE 7: 1 YEAR, ALSO 4,000 KM'));
  const v7 = tag(P ? '4,000 KM / YEAR' : '4,000 KM PER YEAR', C.cyan, [XB + (P ? 0 : 1.9), P ? BASE + 4 * KS + 0.35 : BASE + 4 * KS / 2, 0], 14);
  await until(S(30)); await play(...addPic(v7), ...fbox(['4,000 ÷ 1', ['= 4,000 km per year', C.cyan]]), ...say('4,000 KM PER YEAR'));
  await until(S(31)); await play(...fbox(['same 4,000 km', ['1,000 vs 4,000 per year', C.green]], C.green), ...say('SAME MILEAGE, DIFFERENT STORY', C.green));

  // ---- 32-41 a new bike of age 0 ----
  const NC = P ? [0, 0.9, 0] : [0, 1.0, 0];
  const nHead = new M.VGroup(rect(P ? 5.6 : 5.0, P ? 0.9 : 0.8, NC, C.cyan), txt('NEW BIKE · Falcon', P ? 21 : 18, C.cyan, NC));
  const nInfo = txt('600 km  ·  age 0 (first year)', P ? 19 : 17, C.ink, [NC[0], NC[1] - (P ? 0.78 : 0.65), 0], true, FW - 1);
  const NB = P ? [0, -1.0, 0] : [0, -0.15, 0], NGX = P ? 0.8 : GX, NBW = P ? 0.68 : BW, NBH = P ? 0.42 : BH;
  const nb = [0, 1, 2, 3, 4, 5].map(i => blk(NBW, NBH, [NB[0] + (i - 2.5) * NGX, NB[1], 0], C.cyan));
  await until(S(32)); await play(...picture(nHead), ...fbox(['a new Falcon arrives'], C.cyan), ...say('A NEW FALCON ARRIVES'));
  await until(S(33)); await play(...addPic(...nb), ...fbox(['600 km = 6 blocks']), ...say('600 KM = 6 BLOCKS'));
  await until(S(34)); await play(...addPic(nInfo), ...fbox(['age = 0', ['still in its first year', C.muted]]), ...say('RECORDED AGE: 0'));
  await until(S(35)); await play(...fbox(['600 ÷ 0 = ?', ['no answer', PINK]], PINK), ...say('WE CANNOT DIVIDE BY ZERO', PINK));
  const q = txt('0 boxes', P ? 24 : 22, PINK, [NB[0], NB[1] - (P ? 1.2 : 0.9), 0]);
  await until(S(36)); await play(...marks(q), new M.Indicate(nb[0], { color: PINK }), ...say('SHARE 600 KM BETWEEN 0 BOXES?', PINK));
  const q2 = txt('?', 40, PINK, P ? [NB[0], NB[1] - 2.3, 0] : [NB[0] + 1.6, NB[1], 0]);
  await until(S(37)); await play(...marks(q, q2), ...fbox(['no box to receive', ['the kilometres', PINK]], PINK), ...say('NO BOXES TO RECEIVE THEM', PINK));
  await until(S(38)); await play(...marks(), ...fbox(['we need a rule', ['for age 0', C.amber]], C.amber), ...say('WE NEED A RULE FOR AGE 0', C.amber));
  const NBY = P ? NB[1] - 2.6 : NB[1] - 1.2;
  const nbox = rect(P ? 5.4 : 2.4, P ? 1.2 : 0.9, [NB[0], NBY, 0], C.cyan, C.cyan, 0.05, 2),
    nbl = txt('counts as 1 year', P ? 21 : 15, C.cyan, P ? [NB[0], NBY - 1.0, 0] : [NB[0] + 2.25, NBY, 0]);
  await until(S(39)); await play(...addPic(nbox, nbl), ...fbox(['age 0 → treat as 1 year'], C.amber), ...say('AGE 0 COUNTS AS 1 YEAR', C.amber));
  await until(S(40)); await play(new M.LaggedStart(nb.map((b, i) => new M.Transform(b, blk(NBW, NBH, [NB[0] + (i - 2.5) * NGX, NBY, 0], C.cyan))), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox(['600 ÷ 1', ['= 600 km per year', C.cyan]]), ...say('600 KM PER YEAR'));
  await until(S(41)); await play(...fbox(['a useful estimate,', ['not the exact yearly mileage', C.muted]]), ...say('A USEFUL ESTIMATE', C.green));

  // ---- 42-48 the formula, the second new bike ----
  await until(S(42)); await play(...say('NOW AS A SHORT FORMULA', C.violet));
  await until(S(43)); await play(...fbox([['mileage per year', C.green], '= mileage ÷ age'], C.green), ...say('MILEAGE PER YEAR = MILEAGE ÷ AGE', C.green));
  await until(S(44)); await play(...fbox([['mileage per year', C.green], '= mileage ÷ age', ['(age 0 → use 1)', C.amber]], C.green), ...say('AGE 0? USE 1', C.amber));
  await until(S(45)); await play(...fbox(['rule chosen BEFORE', ['the model starts learning', C.violet]], C.violet), ...say('CHOSEN BEFORE LEARNING', C.violet));
  await until(S(46)); await play(...fbox(['same rule for training bikes', ['and every new bike', C.violet]], C.violet), ...say('SAME RULE FOR ALL BIKES', C.violet));
  const n1Head = new M.VGroup(rect(P ? 5.6 : 5.0, P ? 0.9 : 0.8, NC, C.muted), txt('NEW BIKE · Comet', P ? 21 : 18, C.muted, NC));
  const n1Info = txt('6,000 km  ·  age 3', P ? 19 : 17, C.ink, [NC[0], NC[1] - (P ? 0.78 : 0.65), 0], true);
  const px1 = k => (k - 1) * (P ? 1.6 : 1.2), NBASE = P ? -4.9 : -1.45, NKS = P ? 1.25 : 0.42;
  const bars1 = [0, 1, 2].map(k => blk(P ? 1.05 : 0.8, 2 * NKS, [px1(k), NBASE + NKS, 0], C.muted));
  const lab1 = [0, 1, 2].map(k => txt(`yr ${k + 1}`, P ? 18 : 14, C.muted, [px1(k), NBASE - (P ? 0.3 : 0.22), 0]));
  await until(S(47)); await play(...picture(n1Head, n1Info), ...fbox(['6,000 km, age 3'], C.muted), ...say('ANOTHER NEW BIKE: 6,000 KM, AGE 3', C.muted));
  const v1 = tag('2,000 KM PER YEAR', C.green, [0, NBASE + 2 * NKS + 0.4, 0], 14);
  await until(S(48)); await play(...addPic(...bars1, ...lab1, v1), ...fbox(['6,000 ÷ 3', ['= 2,000 km per year', C.green]], C.green), ...say('2,000 KM PER YEAR', C.green));

  // ---- 49-53 three features ----
  const TR = [[1, 1000], [2, 2000], [3, 3000], [1, 3000], [6, 3000], [4, 4000], [1, 4000], [2, 4000]];
  const fmt = n => n.toLocaleString('en-US');
  const cx = P ? [-2.9, -1.5, 0.3, 2.5] : [-3.6, -1.6, 0.8, 3.6], top = P ? 1.25 : 1.45, rh = P ? 0.8 : 0.4, TF = P ? 21 : 19;
  const hdr = ['bike', 'age', 'mileage', 'per year'].map((s, k) => txt(s, TF, [C.muted, C.cyan, C.amber, C.green][k], [cx[k], top, 0]));
  const rows = TR.map(([a, km], r) => { const y = top - (r + 1) * rh; return [txt(String(r + 1), TF, C.muted, [cx[0], y, 0], true), txt(String(a), TF, C.cyan, [cx[1], y, 0], true), txt(fmt(km), TF, C.amber, [cx[2], y, 0], true), txt(fmt(km / Math.max(1, a)), TF, C.green, [cx[3], y, 0], true)]; });
  await until(S(49)); await play(...picture(...hdr, ...rows.flat()), ...fbox(['3 separate features:', ['age · mileage · mileage per year', C.green]], C.green), ...say('THREE FEATURES FOR THE MODEL', C.green));
  await until(S(50)); await play(new M.LaggedStart(rows.map(r => new M.Indicate(r[3], { color: C.green })), { lagRatio: 0.15, runTime: 1.8 }), ...fbox(['mileage per year shows', ['how heavily a bike was used', C.green]], C.green), ...say('HOW HEAVILY WAS IT USED?', C.green));
  const y7 = top - 7 * rh;
  const hl = rect(P ? 6.8 : 8.6, rh * 0.9, [(cx[0] + cx[3]) / 2, y7, 0], PINK, PINK, 0.06, 2);
  await until(S(51)); await play(...marks(hl), ...fbox(['bike 7: 4,000 km per year', ['condition: Good', C.green]], PINK), ...say('HIGH PER YEAR ≠ POOR CONDITION', PINK));
  await until(S(52)); await play(...fbox(['still needed:', ['other information, like condition', C.amber]], C.amber), ...say('WE STILL NEED CONDITION', C.amber));
  await until(S(53)); await play(...marks(), ...fbox(['combine related features', ['when together they show more', C.green]], C.green), ...say('COMBINE FEATURES THAT TELL MORE TOGETHER', C.green));
}
