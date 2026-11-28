// 10.3.9 Right censoring. Beat i = sentence i. Log 4: Amal 2, Badr 3, Chen 4+, Dina 6, Eli 7+, Farah 9, Gus 12+, Hana 12+.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TEAL = '#40D9C2', RED = '#F87181';
  const CX = P ? 0 : -2.55;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ---------- helpers ----------
  const tx = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const ln = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dl = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const outline = (w, h, p, color) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(color, 0.04); r.moveTo(p); return r; };
  const tag = (s, color, p, size = 15) => { const t = pill(s, color, size); t.moveTo(p); return t; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x));
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic, ...mk), ...fin(...n)]; pic = n; mk = []; return a; };
  const add = (...o) => { const n = o.filter(Boolean); pic.push(...n); return fin(...n); };
  const drop = (...o) => { pic = pic.filter(x => !o.includes(x)); return fout(...o); };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk), ...fin(...n)]; mk = n; return a; };
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow)] : [];
    if (!lines) { boxNow = null; return a; }
    const size = P ? 21 : 20, lh = P ? 0.39 : 0.43;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.1 : 4.35) / wd, (P ? 1.75 : 3.6) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP);
    a.push(new M.FadeIn(g)); boxNow = g; return a;
  }

  // ---------- data ----------
  const PEOPLE = [['Amal', 2, true], ['Badr', 3, true], ['Chen', 4, false], ['Dina', 6, true], ['Eli', 7, false], ['Farah', 9, true], ['Gus', 12, false], ['Hana', 12, false]];
  const idx = n => PEOPLE.findIndex(p => p[0] === n);

  // ---------- layout: one bar per patient ----------
  const Y0 = P ? 1.15 : 1.2, DY = P ? 0.8 : 0.46;
  const ROWY = PEOPLE.map((_, k) => Y0 - k * DY);
  const AY = ROWY[7] - (P ? 0.45 : 0.36);
  const NAMEX = P ? -3.3 : CX - 3.7, WX0 = P ? -2.65 : CX - 3.1, WX1 = P ? 2.9 : CX + 3.3;
  const wx = w => WX0 + w / 12 * (WX1 - WX0);
  const BW = P ? 11 : 10;
  const names = PEOPLE.map(([n], k) => tx(n, P ? 17 : 16, C.ink, [NAMEX, ROWY[k], 0]));
  const axis = new M.VGroup(ln([WX0, AY, 0], [WX1, AY, 0], C.muted, 2),
    ...[0, 2, 4, 6, 8, 10, 12].map(w => tx(String(w), 15, C.muted, [wx(w), AY - 0.22, 0], true)),
    tx('weeks', 15, C.muted, [WX1 + 0.05, AY - 0.46, 0]));
  const barOf = k => { const [, w, seen] = PEOPLE[k]; return ln([wx(0), ROWY[k], 0], [wx(w), ROWY[k], 0], seen ? TEAL : RED, BW); };
  const capOf = (k, color = TEAL) => ln([wx(PEOPLE[k][1]), ROWY[k] - 0.15, 0], [wx(PEOPLE[k][1]), ROWY[k] + 0.15, 0], color, 4);
  const openOf = k => { const x = wx(PEOPLE[k][1]) + 0.05, y = ROWY[k]; return new M.VGroup(ln([x, y, 0], [x + 0.32, y, 0], RED, 3), ln([x + 0.32, y, 0], [x + 0.18, y + 0.12, 0], RED, 3), ln([x + 0.32, y, 0], [x + 0.18, y - 0.12, 0], RED, 3)); };
  const bars = PEOPLE.map((_, k) => barOf(k));
  const caps = PEOPLE.map((_, k) => capOf(k));
  const opens = PEOPLE.map((_, k) => openOf(k));
  const stubs = PEOPLE.map((_, k) => ln([wx(0), ROWY[k], 0], [wx(1), ROWY[k], 0], C.muted, BW));
  const sideTag = (k, s, color) => tx(s, 15, color, [wx(PEOPLE[k][1]) + (P ? 0.95 : 1.05), ROWY[k] + 0.0, 0]);

  // 0-1
  await until(S(0)); await play(...say('HOW LONG UNTIL A FOLLOW-UP?', C.amber));
  await until(S(1)); await play(...picture(axis, ...names), ...say('8 PATIENTS START THE SAME DAY', C.cyan));
  // 2 bars grow to the right
  await until(S(2)); await play(new M.LaggedStart(stubs.map(s => new M.Create(s)), { lagRatio: 0.08, runTime: 1.4 }), ...say('EACH BAR GROWS WEEK BY WEEK', C.cyan));
  pic.push(...stubs);
  // 3-7 closed bars
  const closeOne = async (i, txt, withCap = true) => { const k = idx(PEOPLE[i][0]); pic.push(bars[k]); await play(new M.Create(bars[k]), ...say(txt, TEAL)); if (withCap) await play(...add(caps[k])); };
  await until(S(3)); await closeOne(0, 'AMAL: FOLLOW-UP IN WEEK 2');
  await until(S(4)); await closeOne(1, 'BADR: FOLLOW-UP IN WEEK 3');
  await until(S(5)); await closeOne(3, 'DINA: WEEK 6', false);
  await until(S(6)); await closeOne(5, 'FARAH: WEEK 9', false);
  await until(S(7)); await play(...add(caps[3], caps[5]), ...say('CLOSE BOTH BARS', TEAL));
  // 8-11 Chen and Eli
  const kC = idx('Chen'), kE = idx('Eli'), kG = idx('Gus'), kH = idx('Hana');
  const chenTag = sideTag(kC, 'moved away', RED);
  await until(S(8)); pic.push(bars[kC]); await play(new M.Create(bars[kC]), ...add(chenTag), ...say('CHEN MOVES AWAY IN WEEK 4', RED));
  await until(S(9)); await play(...drop(chenTag), ...add(opens[kC]), ...say('OPEN END + RIGHT ARROW', RED));
  const atLeast4 = tx('at least 4', 15, RED, [wx(4) + 1.05, ROWY[kC], 0]);
  await until(S(10)); await play(...add(atLeast4), ...fbox(['arrow means:', ['wait ≥ 4 weeks', RED]], RED), ...say('AT LEAST 4 WEEKS', RED));
  await until(S(11)); pic.push(bars[kE]); await play(new M.Create(bars[kE]), ...add(opens[kE]), ...fbox(['Eli changes clinics', 'in week 7', ['no follow-up seen', RED]], RED), ...say('ELI: OPEN END AT 7', RED));
  // 12-13 Gus and Hana, study end
  const endLine = dl([wx(12), AY, 0], [wx(12), ROWY[0] + 0.3, 0], C.amber);
  const endTag = tag('STUDY ENDS', C.amber, P ? [wx(12) - 0.9, ROWY[0] + 0.52, 0] : [wx(12) + 0.68, ROWY[0] + 0.2, 0], 15);
  await until(S(12)); pic.push(bars[kG], bars[kH]); await play(new M.Create(bars[kG]), new M.Create(bars[kH]), ...add(endLine, endTag), ...fbox(['Gus and Hana', ['still waiting', RED], 'at week 12'], RED), ...say('GUS & HANA: STILL WAITING AT 12', RED));
  await until(S(13)); await play(...add(opens[kG], opens[kH]), ...say('OPEN ENDS AT 12', RED));
  // 14-17 names
  const qs = [kC, kE, kG, kH].map(k => tx('?', 18, RED, [Math.min(wx(PEOPLE[k][1]) + 0.6, WX1 + 0.55), ROWY[k], 0], true));
  await until(S(14)); await play(...drop(atLeast4), ...marks(...qs), ...fbox(['we see how far', 'the bar reaches,', ['not where it ends', RED]], RED), ...say('WHERE DO THESE WAITS END?', RED));
  await until(S(15)); await play(...fbox([['CENSORED', RED], 'a record with', 'a missing end'], RED), ...say('MISSING END = CENSORED', RED));
    await until(S(16)); await play(new M.LaggedStart([kC, kE, kG, kH].map(k => new M.Indicate(opens[k], { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...fbox([['RIGHT CENSORING', RED], 'the unseen time lies', 'to the RIGHT', 'on the timeline'], RED), ...say('UNSEEN TIME → RIGHT CENSORING', RED));
  await until(S(17)); await play(...marks(), ...fbox(['known time =', ['lower bound', C.amber], 'the shortest the', 'full wait could be'], C.amber), ...say('KNOWN TIME = LOWER BOUND', C.amber));
  // 18-24 closed bars only
  const closedK = [0, 1, 3, 5];
  const boxes = closedK.map(k => outline(wx(PEOPLE[k][1]) - wx(0) + 0.3, 0.34, [(wx(0) + wx(PEOPLE[k][1])) / 2, ROWY[k], 0], TEAL));
  const boxK = k => outline(wx(PEOPLE[k][1]) - wx(0) + 0.3, 0.34, [(wx(0) + wx(PEOPLE[k][1])) / 2, ROWY[k], 0], TEAL);
  await until(S(18)); await play(...marks(...boxes), ...say('USE ONLY THE CLOSED BARS?', TEAL));
  await until(S(19)); await play(...marks(boxK(0), boxK(1)), ...fbox(['Amal + Badr', ['2 + 3 = 5', TEAL]], TEAL), ...say('2 + 3 = 5', TEAL));
  await until(S(20)); await play(...marks(boxK(0), boxK(1), boxK(3)), ...fbox(['+ Dina', ['5 + 6 = 11', TEAL]], TEAL), ...say('5 + 6 = 11', TEAL));
  await until(S(21)); await play(...marks(boxK(0), boxK(1), boxK(3), boxK(5)), ...fbox(['+ Farah', ['11 + 9 = 20', TEAL]], TEAL), ...say('11 + 9 = 20', TEAL));
  const avg5 = new M.VGroup(dl([wx(5), AY, 0], [wx(5), ROWY[0] + 0.25, 0], C.amber), tag('AVERAGE 5', C.amber, [wx(5) + (P ? 0.95 : 0.85), ROWY[0], 0], 15));
  await until(S(22)); await play(...marks(...boxes, avg5), ...fbox(['20 weeks ÷ 4 waits', ['= 5 weeks', C.amber]], C.amber), ...say('20 ÷ 4 = 5 WEEKS', C.amber));
  const ghBox = [kG, kH].map(k => outline(wx(12) - wx(0) + 0.3, 0.34, [(wx(0) + wx(12)) / 2, ROWY[k], 0], RED));
  await until(S(23)); await play(...marks(avg5, ...ghBox), ...fbox(['left out:', ['Gus and Hana', RED], ['already 12 weeks', RED]], RED), ...say('LEFT OUT: 12 WEEKS EACH!', RED));
  await until(S(24)); await play(...fbox(['5 weeks', ['too short', RED]], RED), ...say('5 WEEKS LOOKS TOO SHORT', RED));
  // 25-32 closing open bars at last sight
  const fakeCaps = [kC, kE, kG, kH].map(k => capOf(k, RED));
  await until(S(25)); await play(...marks(), ...add(...fakeCaps), ...say('CLOSE THEM AT THE LAST SIGHT?', RED));
  await until(S(26)); await play(...fbox(['open bars:', ['4, 7, 12, 12', RED]], RED), ...say('4, 7, 12 AND 12 WEEKS', RED));
  await until(S(27)); await play(...fbox(['4 + 7', ['= 11', RED]], RED), ...say('4 + 7 = 11', RED));
  await until(S(28)); await play(...fbox(['11 + 12', ['= 23', RED]], RED), ...say('11 + 12 = 23', RED));
  await until(S(29)); await play(...fbox(['23 + 12', ['= 35', RED]], RED), ...say('23 + 12 = 35', RED));
  await until(S(30)); await play(...fbox(['35 + 20 (closed bars)', ['= 55 weeks', C.amber]], C.amber), ...say('35 + 20 = 55', C.amber));
  await until(S(31)); await play(...fbox(['55 weeks', ['÷ 8 patients', C.amber]], C.amber), ...say('DIVIDE BY ALL 8', C.amber));
  const avg69 = new M.VGroup(dl([wx(6.875), AY, 0], [wx(6.875), ROWY[0] + 0.25, 0], C.amber), tag('≈ 6.9', C.amber, [wx(6.875) + 0.55, ROWY[0], 0], 15));
  await until(S(32)); await play(...marks(avg69), ...fbox(['55 ÷ 8 ≈ 6.9 weeks', ['a lower bound', C.amber]], C.amber), ...say('≈ 6.9 WEEKS · ONLY A LOWER BOUND', C.amber));
  await until(S(33)); await play(new M.LaggedStart(fakeCaps.map(c => new M.Indicate(c, { color: RED })), { lagRatio: 0.2, runTime: 1.2 }), ...fbox(['it treats the', 'known part', ['as the whole wait', RED]], RED), ...say('KNOWN PART ≠ WHOLE WAIT', RED));
  const extras = [kC, kE, kG, kH].map(k => dl([wx(PEOPLE[k][1]) + 0.1, ROWY[k], 0], [Math.min(wx(PEOPLE[k][1]) + 1.2, WX1 + 0.7), ROWY[k], 0], RED));
  await until(S(34)); await play(...drop(...fakeCaps), ...marks(avg69, ...extras), ...fbox(['any extra waiting', ['→ true average', C.amber], ['  is higher', C.amber]], C.amber), ...say('EXTRA WAITING → HIGHER AVERAGE', C.amber));

  // ---------- picture: the record (two facts per patient) ----------
  const TY0 = P ? 0.85 : 0.95, TDY = P ? 0.72 : 0.43;
  const TR = PEOPLE.map((_, k) => TY0 - k * TDY);
  const COL = P ? [-2.6, -0.3, 2.1] : [CX - 2.6, CX - 0.2, CX + 2.3];
  const head = [tx('patient', 15, C.muted, [COL[0], TR[0] + 0.48, 0]), tx('weeks seen', 15, C.muted, [COL[1], TR[0] + 0.48, 0]), tx('follow-up seen?', 15, C.muted, [COL[2], TR[0] + 0.48, 0])];
  const tNames = PEOPLE.map(([n], k) => tx(n, 17, C.ink, [COL[0], TR[k], 0]));
  const tWeeks = PEOPLE.map(([, w, s], k) => tx(String(w), 18, s ? TEAL : RED, [COL[1], TR[k], 0], true));
  const tSeen = PEOPLE.map(([, , s], k) => tx(s ? 'yes' : 'no', 17, s ? TEAL : RED, [COL[2], TR[k], 0], true));
  const rowBox = k => outline((COL[2] - COL[0]) + 1.6, TDY * 0.9, [(COL[0] + COL[2]) / 2, TR[k], 0], C.amber);
  await until(S(35)); await play(...fbox(null), ...picture(head[0], ...tNames), ...say('SAVE TWO FACTS PER PATIENT', C.cyan));
  await until(S(36)); await play(...add(head[1]), new M.LaggedStart(tWeeks.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.4 }), ...say('1. HOW LONG WE SEE THEM WAIT', C.cyan));
  pic.push(...tWeeks);
  await until(S(37)); await play(...add(head[2]), new M.LaggedStart(tSeen.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.4 }), ...say('2. FOLLOW-UP SEEN OR NOT', C.cyan));
  pic.push(...tSeen);
  await until(S(38)); await play(...marks(rowBox(0)), ...fbox(['Amal:', ['2 weeks, seen', TEAL]], TEAL), ...say('AMAL: 2 WEEKS · SEEN', TEAL));
  await until(S(39)); await play(...marks(rowBox(kC)), ...fbox(['Chen:', ['4 weeks, not seen', RED]], RED), ...say('CHEN: 4 WEEKS · NOT SEEN', RED));
  const plus = [kC, kE, kG, kH].map(k => tx(PEOPLE[k][1] + '+', 18, RED, [COL[1], TR[k], 0], true));
  await until(S(40)); await play(...drop(...[kC, kE, kG, kH].map(k => tWeeks[k])), ...add(...plus), ...fbox(['Chen:', ['4+', RED]], RED), ...say('WRITE IT AS 4+', RED));
  await until(S(41)); await play(...marks(), new M.LaggedStart(plus.map(t => new M.Indicate(t, { color: RED })), { lagRatio: 0.2, runTime: 1.2 }), ...fbox(['+ means', ['at least that long', RED]], RED), ...say('+ = AT LEAST THAT LONG', RED));
  await until(S(42)); await play(...fbox(['use this record', 'to study waits,', ['even when some go', C.green], ['beyond what we see', C.green]], C.green), ...say('STUDY WAITS, EVEN UNSEEN ENDS', C.green));
  await until(S(43)); await play(...marks(rowBox(kC)), ...fbox([['TRAP', RED], 'a missed observation', 'is NOT the end', 'of a wait'], RED), ...say('TRAP: MISSED ≠ ENDED', RED));
  await until(S(44)); await play(...marks(), ...fbox(['right censoring saves:', ['how much we see', TEAL], ['+ whether the end', RED], ['  is missing', RED]], C.cyan), ...say('TIME SEEN + END MISSING OR NOT', C.cyan));
}
