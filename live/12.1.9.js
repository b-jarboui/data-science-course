// lesson 12.1.9
// Temporal splits: train on earlier renewals (Jan-Apr), test on later ones (May-Jun). Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;
  const PILL = P ? [0, 2.12, 0] : [0, 2.03, 0];
  const BOXP = P ? [0, 3.38, 0] : [0, -2.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const txt = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const rect = (w, h, pos, color, fill = C.card, op = 0.95, sw = 2) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: sw }); r.setFill(fill, op); r.moveTo(pos); return r; };
  const line = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dash = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const tag = (s, color, pos, size = 17) => { const t = pill(s, color, Math.max(15, P ? size - 2 : size)); t.moveTo(pos); return t; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x, { runTime: 0.45 }));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x, { runTime: 0.3 }));
  function arrow(a, b, color = C.amber, w = 2.5) {
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, h = 0.16, k = h * 0.6;
    return new M.VGroup(line(a, b, color, w), line(b, [b[0] - h * ux - k * uy, b[1] - h * uy + k * ux, 0], color, w), line(b, [b[0] - h * ux + k * uy, b[1] - h * uy - k * ux, 0], color, w));
  }
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

  // ---- shared data: 20 renewals (month 0 = Jan ... 5 = Jun) ----
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const D = [
    ['Ali', 0, 20], ['Ali', 1, 18], ['Ali', 2, 22], ['Ali', 3, 19], ['Ali', 4, 21], ['Ali', 5, 20],
    ['Bea', 0, 12], ['Bea', 1, 6], ['Bea', 2, 2, 1],
    ['Chen', 0, 15], ['Chen', 1, 10], ['Chen', 2, 7], ['Chen', 3, 3, 1],
    ['Farah', 1, 1, 1],
    ['Dina', 2, 3], ['Dina', 3, 9], ['Dina', 4, 14], ['Dina', 5, 16],
    ['Eli', 4, 11], ['Eli', 5, 6, 1],
  ].map(([name, m, h, cx]) => ({ name, m, h, cx: !!cx }));
  const seen = [0, 0, 0, 0, 0, 0];
  D.forEach(d => { d.j = seen[d.m]++; });
  const find = (n, m) => D.findIndex(d => d.name === n && MON[d.m] === m);
  const oc = d => d.cx ? PINK : C.cyan;

  const CW = P ? 1.18 : 1.7, CH = P ? 0.9 : 0.5, MX = P ? 1.27 : 2.0, AY = P ? -4.6 : -1.45, Y0 = P ? -3.45 : -0.95, PYc = P ? 1.0 : 0.58;
  const colx = k => (k - 2.5) * MX;
  const pos = i => [colx(D[i].m), Y0 + D[i].j * PYc, 0];
  function timeline() {
    const axis = line([colx(0) - MX / 2, AY, 0], [colx(5) + MX / 2, AY, 0], C.muted, 3);
    const labs = MON.map((s, k) => txt(s, P ? 16 : 16, C.muted, [colx(k), AY - 0.3, 0]));
    const cards = D.map((d, i) => { const p = pos(i); return P ? new M.VGroup(rect(CW, CH, p, oc(d)), txt(d.name, 16, oc(d), [p[0] - 0.08, p[1] + 0.2, 0], false, CW - 0.4), txt(`${d.h}h`, 17, C.ink, [p[0] - 0.08, p[1] - 0.2, 0], true)) : new M.VGroup(rect(CW, CH, p, oc(d)), txt(`${d.name} ${d.h}h`, 15, oc(d), [p[0] - 0.15, p[1], 0], true, CW - 0.4)); });
    return { axis, labs, cards };
  }
  const outline = (i, color) => { const p = pos(i); return rect(CW + 0.1, CH + 0.1, p, color, color, 0, 3); };
  const check = (i, good) => { const p = pos(i); return txt(good ? '✓' : '✗', P ? 18 : 18, good ? C.green : PINK, [p[0] + CW / 2 - (P ? 0.16 : 0.2), p[1], 0]); };
  const TEST5 = [find('Bea', 'Feb'), find('Chen', 'Apr'), find('Ali', 'May'), find('Dina', 'Jun'), find('Eli', 'Jun')];
  const TOPY = P ? 0.95 : 1.1;

  // 0-2 cards on a line from January to June
  let G = timeline();
  await until(S(0)); await play(...picture(G.axis, ...G.labs), ...fbox(['the app guesses on', ['FUTURE renewal days', C.amber]], C.amber), ...say('GUESSES ON FUTURE RENEWAL DAYS', C.amber));
  await until(S(1)); await play(...say('PRACTISE WITH OLD CARDS: HOW?', C.amber));
  await until(S(2)); await play(new M.LaggedStart(G.cards.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 2.0 }), ...fbox(['20 renewal cards', ['Jan → Jun · hours played', C.muted]]), ...say('ALL 20 CARDS FROM JANUARY TO JUNE'));
  pic.push(...G.cards);

  // 3-6 the old random test marks
  const randMarks = () => TEST5.map(i => outline(i, C.amber));
  await until(S(3)); await play(...marks(...randMarks()), ...fbox([['first split (random):', C.amber], '5 test cards marked'], C.amber), ...say('MARK THE 5 RANDOM TEST CARDS', C.amber));
  const bea = find('Bea', 'Feb');
  await until(S(4)); await play(new M.Indicate(G.cards[bea].submobjects[1], { color: C.amber }), ...fbox([['Bea Feb = TEST', C.amber]], C.amber), ...say('BEA’S FEBRUARY CARD: TEST', C.amber));
  const lateTrain = [find('Dina', 'May'), find('Eli', 'May'), find('Ali', 'Jun')];
  await until(S(5)); await play(...marks(...randMarks(), ...lateTrain.map(i => outline(i, C.cyan))), ...fbox(['later cards still in training:', ['Ali Jun · Dina May · Eli May', C.cyan]]), ...say('LATER CARDS STILL MARKED TRAINING'));
  const far = arrow([colx(1), TOPY, 0], [colx(5), TOPY, 0], C.amber);
  const farLab = txt('4 months later', P ? 16 : 16, C.amber, [colx(3), TOPY + 0.28, 0]);
  await until(S(6)); await play(...marks(...randMarks(), ...lateTrain.map(i => outline(i, C.cyan)), far, farLab), ...fbox(['on 1 Feb, June is', ['months in the future', C.amber]], C.amber), ...say('FROM BEA’S FEB DAY, JUNE IS MONTHS AWAY', C.amber));

  // 7-8 weather
  const WA = P ? [0, 0.1, 0] : [-3, 0, 0], WB = P ? [0, -2.6, 0] : [3, 0, 0], WW = P ? 5.2 : 4.2, WH = P ? 2.0 : 2.4;
  const today = new M.VGroup(rect(WW, WH, WA, C.cyan), txt('TODAY', 20, C.cyan, [WA[0], WA[1] + WH / 2 - 0.35, 0]),
    txt('weather reports you have', 18, C.ink, [WA[0], WA[1] - 0.1, 0]), txt('✓', 30, C.green, [WA[0], WA[1] - 0.6, 0]));
  const tomorrow = new M.VGroup(rect(WW, WH, WB, C.amber), txt('TOMORROW', 20, C.amber, [WB[0], WB[1] + WH / 2 - 0.35, 0]),
    txt('the weather', 18, C.ink, [WB[0], WB[1] - 0.1, 0]), txt('?', 36, C.amber, [WB[0], WB[1] - 0.6, 0]));
  const wArrow = P ? arrow([0, WA[1] - WH / 2 - 0.05, 0], [0, WB[1] + WH / 2 + 0.05, 0]) : arrow([WA[0] + WW / 2 + 0.1, 0, 0], [WB[0] - WW / 2 - 0.1, 0, 0]);
  await until(S(7)); await play(...picture(tomorrow), ...fbox(['guess tomorrow’s weather'], C.amber), ...say('GUESS TOMORROW’S WEATHER', C.amber));
  await until(S(8)); await play(...addPic(today, wArrow), ...fbox(['use only what you have', ['TODAY', C.cyan]]), ...say('ONLY TODAY’S REPORTS', C.cyan));

  // 9 the same problem
  G = timeline();
  const back = arrow([colx(5), TOPY, 0], [colx(1), TOPY, 0], PINK);
  const backLab = txt('learning from later cards', P ? 16 : 16, PINK, [colx(3), TOPY + 0.28, 0]);
  await until(S(9)); await play(...picture(G.axis, ...G.labs, ...G.cards), ...marks(...randMarks(), back, backLab), ...fbox(['rule learns from June,', ['then "guesses" February', PINK]], PINK), ...say('SAME PROBLEM FOR THE MUSIC APP', PINK));

  // 10-17 split by time
  const SX = (colx(3) + colx(4)) / 2;
  const cut = dash([SX, AY - 0.2, 0], [SX, TOPY + 0.45, 0], C.amber);
  await until(S(10)); await play(...marks(), ...addPic(cut), ...fbox(['cut between April and May'], C.amber), ...say('DRAW A LINE BETWEEN APRIL AND MAY', C.amber));
  const FL = colx(0) - MX / 2 + 0.05, FR = colx(5) + MX / 2 - 0.05, FB = AY + 0.22, FT = Y0 + 3 * PYc + CH / 2 + 0.15;
  const frame = (x0, x1, color) => rect(x1 - x0, FT - FB, [(x0 + x1) / 2, (FT + FB) / 2, 0], color, color, 0.04, 2.2);
  const earlyF = frame(FL, SX - 0.07, C.cyan), lateF = frame(SX + 0.07, FR, C.amber);
  const earlyLab = txt('EARLIER: Jan – Apr', P ? 16 : 18, C.cyan, [(FL + SX) / 2, FT + 0.25, 0]);
  const lateLab = txt('LATER', P ? 16 : 18, C.amber, [(SX + FR) / 2, FT + 0.25, 0]);
  await until(S(11)); await play(...addPic(earlyF, earlyLab), ...fbox(['Jan · Feb · Mar · Apr', ['→ the earlier pile', C.cyan]]), ...say('JANUARY TO APRIL: EARLIER PILE'));
  const EARLY = D.map((d, i) => d.m <= 3 ? i : -1).filter(i => i >= 0), LATE = D.map((d, i) => d.m >= 4 ? i : -1).filter(i => i >= 0);
  await until(S(12)); await play(new M.LaggedStart(EARLY.map(i => new M.Indicate(G.cards[i].submobjects[1], { color: C.cyan })), { lagRatio: 0.12, runTime: 1.5 }), ...fbox(['3 + 4 + 4 + 3', ['= 14 cards', C.cyan]]), ...say('14 CARDS ON THE LEFT'));
  const EC = EARLY.filter(i => D[i].cx);
  await until(S(13)); await play(...marks(...EC.map(i => outline(i, PINK))), ...fbox([['3 cancels:', PINK], 'Farah Feb · Bea Mar · Chen Apr']), ...say('3 OF THEM CANCELLED', PINK));
  await until(S(14)); await play(...marks(), ...addPic(lateF, lateLab), ...fbox(['May · Jun', ['→ the later pile', C.amber]], C.amber), ...say('MAY AND JUNE: LATER PILE', C.amber));
  await until(S(15)); await play(...marks(outline(find('Eli', 'Jun'), PINK)), ...fbox(['3 + 3 = 6 cards', ['1 cancel: Eli Jun', PINK]], C.amber), ...say('6 CARDS, 1 CANCEL', C.amber));
  const trainLab = txt('TRAINING · 14', P ? 16 : 18, C.cyan, [(FL + SX) / 2, FT + 0.25, 0]);
  const testLab = txt('LOCKED TEST · 6', P ? 16 : 18, C.amber, [(SX + FR) / 2, FT + 0.25, 0]);
  await until(S(16)); await play(...marks(), new M.FadeOut(earlyLab), new M.FadeOut(lateLab), new M.FadeIn(trainLab), new M.FadeIn(testLab), ...fbox(['earlier → training', ['later → test', C.amber]]), ...say('TRAIN ON EARLIER, TEST ON LATER'));
  pic = pic.filter(o => o !== earlyLab && o !== lateLab); pic.push(trainLab, testLab);
  await until(S(17)); await play(...fbox([['TEMPORAL SPLIT', C.green], 'a split based on time'], C.green), ...say('THIS IS A TEMPORAL SPLIT', C.green));

  // 18-20 answers must be known before the first test guess
  await until(S(18)); await play(...fbox(['training: all 14 earlier cards', ['answers known → we can score', C.muted]]), ...say('ALL 14 EARLIER CARDS FOR TRAINING'));
  const APR = D.map((d, i) => d.m === 3 ? i : -1).filter(i => i >= 0);
  const firstGuess = tag('FIRST TEST GUESS: 1 MAY', C.amber, P ? [0, -5.6, 0] : [4.2, -2.45, 0], 15);
  await until(S(19)); await play(...marks(...APR.map(i => outline(i, C.violet)), firstGuess), ...fbox(['April answers: 30 days', ['1 Apr → 1 May', C.violet]], C.violet), ...say('EACH TRAINING ANSWER KNOWN BEFORE THE TEST?', C.violet));
  await until(S(20)); await play(...fbox(['30 days still open?', ['leave that card out for now', C.amber]], C.amber), ...say('ANSWER STILL OPEN? LEAVE IT OUT', C.amber));

  // 21-24 score the rule on the earlier pile
  await until(S(21)); await play(...marks(), ...fbox([['RULE', C.amber], 'fewer than 5 hours → CANCEL', 'otherwise → STAY'], C.amber), ...say('OUR RULE: UNDER 5 HOURS = CANCEL', C.amber));
  await until(S(22)); await play(...say('SCORE IT ON THE EARLIER PILE'));
  const dinaMar = find('Dina', 'Mar');
  const ticksE = EARLY.map(i => check(i, i !== dinaMar));
  await until(S(23)); await play(new M.LaggedStart(ticksE.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.6 }), ...fbox(['earlier pile:', ['13 of 14 right', C.green]], C.green), ...say('13 OUT OF 14 RIGHT', C.green));
  pic.push(...ticksE);
  await until(S(24)); await play(...marks(outline(dinaMar, PINK)), ...fbox(['Dina Mar: 3 h → guess CANCEL', ['but she stayed', PINK]], PINK), ...say('THE MISS: DINA’S MARCH CARD', PINK));

  // 25-34 the later pile, one customer at a time
  await until(S(25)); await play(...marks(...LATE.map(i => outline(i, C.amber))), ...fbox(['same rule, no changes:', ['under 5 h → CANCEL, else STAY', C.amber]], C.amber), ...say('KEEP THE RULE FIXED: CHECK LATER CARDS', C.amber));
  const later = [];
  const step = async (k, names, lines, color, sayS, ticks) => {
    await until(S(k));
    const t = (ticks || []).map(([i, good]) => check(i, good));
    later.push(...t);
    await play(...marks(...names.map(i => outline(i, C.amber))), ...fin(...t), ...fbox(lines, color), ...say(sayS, color));
    pic.push(...t);
  };
  const aM = find('Ali', 'May'), aJ = find('Ali', 'Jun'), dM = find('Dina', 'May'), dJ = find('Dina', 'Jun'), eM = find('Eli', 'May'), eJ = find('Eli', 'Jun');
  await step(26, [aM, aJ], ['Ali May: 21 h', 'Ali Jun: 20 h'], C.cyan, 'ALI: 21 AND 20 HOURS');
  await step(27, [aM, aJ], ['21 h, 20 h → STAY, STAY', ['both right ✓ ✓', C.green]], C.green, 'BOTH GUESSES RIGHT', [[aM, true], [aJ, true]]);
  await step(28, [dM, dJ], ['Dina May: 14 h', 'Dina Jun: 16 h'], C.cyan, 'DINA: 14 AND 16 HOURS');
  await step(29, [dM, dJ], ['14 h, 16 h → STAY, STAY', ['both right ✓ ✓', C.green]], C.green, 'BOTH RIGHT FOR DINA TOO', [[dM, true], [dJ, true]]);
  await step(30, [eM], ['Eli May: 11 h'], C.cyan, 'ELI MAY: 11 HOURS');
  await step(31, [eM], ['11 h → STAY', ['Eli stayed ✓', C.green]], C.green, 'GUESS STAY, ELI STAYED', [[eM, true]]);
  await step(32, [eJ], ['Eli Jun: 6 h'], C.cyan, 'ELI JUNE: 6 HOURS');
  await step(33, [eJ], ['6 h → STAY', ['but Eli cancelled ✗', PINK]], PINK, 'GUESS STAY, BUT ELI CANCELLED', [[eJ, false]]);
  await until(S(34)); await play(...marks(), ...fbox(['later pile (test):', ['5 of 6 right', C.green]], C.green), ...say('5 OUT OF 6 RIGHT ON THE TEST', C.green));

  // 35-36 Eli is new
  const joined = tag('ELI JOINED 1 APR', C.violet, P ? [0, -5.6, 0] : [4.2, -2.45, 0], 15);
  await until(S(35)); await play(...marks(outline(eM, C.violet), outline(eJ, C.violet), joined), ...fbox(['Eli: both cards in the test', ['May · Jun', C.violet]], C.violet), ...say('BOTH OF ELI’S CARDS ARE IN THE TEST', C.violet));
  await until(S(36)); await play(...fbox(['Eli in training: 0 cards', ['→ a brand-new customer', C.violet]], C.violet), ...say('ELI IS NEW TO THE RULE', C.violet));

  // 37-38 the trap and the takeaway
  const back2 = arrow([colx(5), TOPY + 0.75, 0], [colx(1), TOPY + 0.75, 0], PINK);
  await until(S(37)); await play(...marks(back2), ...fbox(['shuffled cards:', ['learn from later, guess earlier', PINK]], PINK), ...say('TRAP: SHUFFLING MIXES THE TIMES', PINK));
  await until(S(38)); await play(...marks(), new M.Indicate(trainLab, { color: C.cyan }), ...fbox(['learn from EARLIER known answers', ['test the fixed rule on LATER cards', C.amber]], C.green), ...say('EARLIER TO LEARN, LATER TO TEST', C.green));
}
