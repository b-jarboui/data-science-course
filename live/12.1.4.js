// 12.1.4 Baselines and accuracy (live lesson in site/live/engine.js).
// Beat i = sentence i (0-based, 39 sentences).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter data (chapters/12.1.md): 20 renewals
  const R = [
    ['Ali', 'Jan', 20, 0], ['Ali', 'Feb', 18, 0], ['Ali', 'Mar', 22, 0], ['Ali', 'Apr', 19, 0], ['Ali', 'May', 21, 0], ['Ali', 'Jun', 20, 0],
    ['Bea', 'Jan', 12, 0], ['Bea', 'Feb', 6, 0], ['Bea', 'Mar', 2, 1],
    ['Chen', 'Jan', 15, 0], ['Chen', 'Feb', 10, 0], ['Chen', 'Mar', 7, 0], ['Chen', 'Apr', 3, 1],
    ['Farah', 'Feb', 1, 1],
    ['Dina', 'Mar', 3, 0], ['Dina', 'Apr', 9, 0], ['Dina', 'May', 14, 0], ['Dina', 'Jun', 16, 0],
    ['Eli', 'May', 11, 0], ['Eli', 'Jun', 6, 1],
  ];
  const DINA_MAR = 14, ELI_JUN = 19;
  const stayed = R.map((_, i) => i).filter(i => !R[i][3]);
  const cancelled = R.map((_, i) => i).filter(i => R[i][3]);

  // Layout: laptop = cards left + note box right; phone = pill top + big cards/grids middle + note box in lower third
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, -4.35, 0] : [4.65, -0.3, 0];
  const COLS = P ? 4 : 5;
  const CW = P ? 1.68 : 1.52, CH = P ? 0.94 : 0.84;
  const SX = P ? 1.86 : 1.68, SY = P ? 1.10 : 1.02;
  const GY = P ? 0.35 : -0.60;
  const rowsN = Math.ceil(20 / COLS);
  const cpos = i => {
    const r = Math.floor(i / COLS), c = i % COLS;
    return [CX + (c - (COLS - 1) / 2) * SX, GY + ((rowsN - 1) / 2 - r) * SY, 0];
  };
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20, lh = P ? 0.46 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.68, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.34, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function fit(t, w) { const tw = t.getWidth(); if (tw > w) t.scale(w / tw); return t; }

  // A card: frame + name/month + hours kept as separate top-level parts so highlights never detach children
  function makeCards() {
    const textW = CW - (P ? 0.50 : 0.44);
    return R.map(([n, m, h], i) => {
      const p = cpos(i);
      const fr = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color: C.muted, strokeWidth: 1.6 });
      fr.setFill(C.card, 0.95); fr.moveTo(p);
      const t1 = fit(T(`${n} ${m}`, P ? 16 : 15, C.ink), textW);
      t1.moveTo([p[0] - 0.15, p[1] + (P ? 0.19 : 0.16), 0.015]);
      const t2 = fit(T(`${h} h`, P ? 18 : 16, C.muted, true), textW);
      t2.moveTo([p[0] - 0.15, p[1] - (P ? 0.19 : 0.17), 0.015]);
      return { fr, t1, t2, all: [fr, t1, t2] };
    });
  }
  function glow(i) {
    const col = R[i][3] ? C.pink : C.cyan;
    const g = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color: col, strokeWidth: 2.4 });
    g.setFill(col, 0.14); g.moveTo([cpos(i)[0], cpos(i)[1], 0.005]); return g;
  }
  function ring(i, color = C.amber, pad = 0.14, sw = 3.5) {
    const r = new M.RoundedRectangle({ width: CW + pad, height: CH + pad, cornerRadius: 0.13, color, strokeWidth: sw });
    r.moveTo([cpos(i)[0], cpos(i)[1], 0.02]); return r;
  }
  function check(i, color = C.green) {
    const p = cpos(i), x = p[0] + CW / 2 - (P ? 0.25 : 0.22), y = p[1] - 0.02, s = P ? 0.115 : 0.11;
    return new M.VGroup(
      new M.Line({ start: [x - s, y, 0.025], end: [x - s * 0.2, y - s * 0.8, 0.025], color, strokeWidth: 4 }),
      new M.Line({ start: [x - s * 0.2, y - s * 0.8, 0.025], end: [x + s * 1.1, y + s * 1.1, 0.025], color, strokeWidth: 4 }));
  }
  function cross(i, color = C.pink) {
    const p = cpos(i), x = p[0] + CW / 2 - (P ? 0.25 : 0.22), y = p[1], s = P ? 0.105 : 0.1;
    return new M.VGroup(
      new M.Line({ start: [x - s, y - s, 0.025], end: [x + s, y + s, 0.025], color, strokeWidth: 4 }),
      new M.Line({ start: [x - s, y + s, 0.025], end: [x + s, y - s, 0.025], color, strokeWidth: 4 }));
  }
  const fadeAll = (arr, rt = 0.5) => new M.FadeOut(new M.VGroup(...arr), { runTime: rt });
  const fadeCard = (items, rt = 0.28) => new M.LaggedStart(items.map(o => new M.FadeIn(o, { runTime: rt })), { lagRatio: 0, runTime: rt });

  // 0-1 opening claim teaser card
  const TC = P ? [0, 0.45, 0] : [CX, -0.55, 0];
  const tBox = new M.RoundedRectangle({ width: P ? 5.6 : 5.4, height: P ? 3.1 : 2.8, cornerRadius: 0.22, color: C.amber, strokeWidth: 2.5 });
  tBox.setFill(C.card, 0.95); tBox.moveTo(TC);
  const tHead = T('TEAMMATE’S CLAIM', P ? 18 : 16, C.muted, true, true); tHead.moveTo([TC[0], TC[1] + (P ? 0.95 : 0.82), 0.01]);
  const tBig = T('80 / 100', P ? 56 : 52, C.amber, true, true); tBig.moveTo([TC[0], TC[1] + 0.06, 0.01]);
  const tSub = T('guesses right', P ? 22 : 20, C.ink); tSub.moveTo([TC[0], TC[1] - (P ? 0.85 : 0.78), 0.01]);
  const teaser = new M.VGroup(tBox, tHead, tBig, tSub);

  await until(S(0));
  await play(new M.FadeIn(teaser, { runTime: 0.7 }), ...say('“80 OUT OF 100 GUESSES RIGHT”', C.amber),
    ...fbox(['a teammate’s rule', ['80 / 100 right', C.amber]], C.amber));
  await until(S(1));
  await play(...say('DOES THAT FIND WHO WILL CANCEL?', C.violet),
    ...fbox(['a teammate’s rule', ['80 / 100 right', C.amber], ['who will cancel?', C.violet]], C.violet));

  // 2-4 the 20 cards
  let cards = makeCards();
  await until(S(2));
  await play(new M.FadeOut(teaser, { runTime: 0.4 }),
    new M.LaggedStart(cards.map(c => fadeCard(c.all, 0.3)), { lagRatio: 0.12, runTime: 2.0 }),
    ...say('20 RENEWAL CARDS, ANSWERS SHOWING', C.ink), ...fbox(['20 renewals', 'stayed or cancelled'], C.muted));
  let glows = R.map((_, i) => glow(i));
  await until(S(3));
  await play(new M.LaggedStart(stayed.map(i => new M.FadeIn(glows[i], { runTime: 0.3 })), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('16 STAYED (CYAN)', C.cyan), ...fbox([['stayed:    16', C.cyan]], C.cyan));
  await until(S(4));
  await play(new M.LaggedStart(cancelled.map(i => new M.FadeIn(glows[i], { runTime: 0.3 })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('4 CANCELLED (PINK)', C.pink), ...fbox([['stayed:    16', C.cyan], ['cancelled:  4', C.pink]], C.pink));

  // 5-9 always stay
  await until(S(5));
  await play(...say('GUESS “STAY” FOR EVERY CARD', C.cyan), ...fbox(['rule: always “stay”', ['(no clues used)', C.muted]], C.cyan));
  let marks = [];
  const chk = stayed.map(i => check(i));
  await until(S(6));
  await play(new M.LaggedStart(chk.map(c => new M.Create(c, { runTime: 0.3 })), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('A CHECK WHERE “STAY” IS RIGHT', C.green));
  marks.push(...chk);
  await until(S(7));
  await play(new M.LaggedStart(chk.map(c => new M.Indicate(c, { color: C.green, runTime: 0.4 })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('16 CHECKS', C.green), ...fbox([['checks = 16', C.green]], C.green));
  const crs = cancelled.map(i => cross(i));
  await until(S(8));
  await play(new M.LaggedStart(crs.map(c => new M.Create(c, { runTime: 0.3 })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('4 PINK CARDS: WRONG', C.pink), ...fbox([['right = 16', C.green], ['wrong =  4', C.pink]], C.pink));
  marks.push(...crs);
  await until(S(9));
  await play(...say('16 OUT OF 20 RIGHT', C.green), ...fbox(['always “stay”', ['16 / 20 right', C.green]], C.green));

  // 10-13 five copies = 100 (stacked 3 + 2 on phone so grids and captions are big and readable)
  const SQ = P ? 0.34 : 0.21, SQ_GAP = P ? 0.08 : 0.06, SQ_STEP = SQ + SQ_GAP;
  const copyCenter = k => P
    ? (k < 3 ? [(k - 1) * 2.35, 1.95] : [(k - 3.5) * 2.60, -1.15])
    : [CX + (k - 2) * 1.62, -0.45];
  const squares = [], sqChecks = [];
  for (let k = 0; k < 5; k++) {
    const [bx, by] = copyCenter(k);
    for (let i = 0; i < 20; i++) {
      const r = Math.floor(i / 4), c = i % 4;
      const x = bx + (c - 1.5) * SQ_STEP, y = by + (2 - r) * SQ_STEP;
      const col = R[i][3] ? C.pink : C.cyan;
      const q = new M.Square({ sideLength: SQ, color: col, strokeWidth: P ? 2.0 : 1.5 });
      q.setFill(col, 0.24); q.moveTo([x, y, 0]);
      squares.push(q);
      if (!R[i][3]) {
        const s = SQ * 0.28;
        sqChecks.push(new M.VGroup(
          new M.Line({ start: [x - s, y, 0.02], end: [x - s * 0.2, y - s * 0.78, 0.02], color: C.green, strokeWidth: P ? 3.2 : 2.5 }),
          new M.Line({ start: [x - s * 0.2, y - s * 0.78, 0.02], end: [x + s * 1.05, y + s * 0.95, 0.02], color: C.green, strokeWidth: P ? 3.2 : 2.5 })
        ));
      }
    }
  }
  const copyLabGroup = new M.VGroup(...[0, 1, 2, 3, 4].map(k => {
    const [bx, by] = copyCenter(k);
    const t = T(`copy ${k + 1}`, P ? 20 : 17, C.ink, true, true);
    t.moveTo([bx, by - 2 * SQ_STEP - SQ / 2 - (P ? 0.32 : 0.34), 0]);
    return t;
  }));
  await until(S(10));
  await play(fadeAll([...cards.flatMap(c => c.all), ...glows, ...marks], 0.6),
    new M.LaggedStart(squares.map(q => new M.FadeIn(q, { runTime: 0.2 })), { lagRatio: 0.01, runTime: 2.0 }),
    new M.FadeIn(copyLabGroup, { runTime: 0.8 }),
    ...say('5 COPIES × 20 = 100 CARDS', C.violet), ...fbox(['5 copies × 20 cards', ['= 100 cards', C.violet]], C.violet));
  await until(S(11));
  await play(new M.LaggedStart(sqChecks.map(d => new M.FadeIn(d, { runTime: 0.15 })), { lagRatio: 0.02, runTime: 2.2 }),
    ...say('5 × 16 = 80 CHECKS', C.green), ...fbox(['16 checks per copy', ['5 × 16 = 80 checks', C.green]], C.green));
  await until(S(12));
  await play(...say('80 OUT OF 100 = 80%', C.green), ...fbox(['80 / 100', ['= 80 percent', C.green]], C.green));
  await until(S(13));
  await play(...say('ACCURACY = SHARE OF RIGHT GUESSES', C.amber), ...fbox([['accuracy', C.amber], '= share of guesses', '  that are right'], C.amber));

  // 14-18 always cancel
  cards = makeCards(); glows = R.map((_, i) => glow(i)); marks = [];
  await until(S(14));
  await play(fadeAll([...squares, ...sqChecks, copyLabGroup], 0.5),
    new M.LaggedStart(cards.map((c, i) => fadeCard([...c.all, glows[i]], 0.25)), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('NOW GUESS “CANCEL” FOR EVERY CARD', C.pink), ...fbox(['rule: always “cancel”'], C.pink));
  const chk2 = cancelled.map(i => check(i));
  await until(S(15));
  await play(new M.LaggedStart(chk2.map(c => new M.Create(c, { runTime: 0.3 })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('ONLY THE 4 PINK CARDS ARE RIGHT', C.pink), ...fbox(['always “cancel”', ['4 / 20 right', C.pink]], C.pink));
  marks.push(...chk2);
  await until(S(16));
  await play(...say('5 COPIES: 5 × 4 = 20 CHECKS', C.pink), ...fbox(['5 × 4 = 20 checks', ['= 20 / 100', C.pink]], C.pink));
  await until(S(17));
  await play(...say('THAT IS 20%', C.pink), ...fbox(['always “stay”   80%', ['always “cancel” 20%', C.pink]], C.pink));
  await until(S(18));
  await play(...say('CONSTANT PREDICTOR: SAME GUESS', C.violet), ...fbox([['constant predictor', C.violet], 'gives the same guess', 'to every card'], C.violet));

  // 19-21 baseline
  await until(S(19));
  await play(fadeAll(marks, 0.4), ...say('“ALWAYS STAY” = THE RULE TO BEAT', C.cyan),
    ...fbox(['rule to beat:', ['always “stay” = 80%', C.cyan]], C.cyan));
  marks = [];
  await until(S(20));
  await play(...say('BASELINE = SIMPLE RULE TO COMPARE', C.violet), ...fbox([['baseline', C.violet], 'a simple rule', 'used for comparison'], C.violet));
  await until(S(21));
  await play(...say('BASELINE ACCURACY: 80%', C.cyan), ...fbox(['baseline: always “stay”', ['accuracy = 80%', C.cyan]], C.cyan));

  // 22-30 hours rule
  await until(S(22));
  await play(new M.LaggedStart(cards.map(c => new M.Indicate(c.t2, { color: C.amber, runTime: 0.3 })), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('OUR RULE READS HOURS PLAYED', C.amber), ...fbox(['hours rule:', ['reads hours played', C.amber]], C.amber));
  const low = R.map((_, i) => i).filter(i => R[i][2] < 5);
  const flags = low.map(i => ring(i, C.amber, 0.08, 2.8));
  await until(S(23));
  await play(new M.LaggedStart(flags.map(f => new M.Create(f, { runTime: 0.4 })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('FEWER THAN 5 HOURS → “CANCEL”', C.amber), ...fbox(['hours < 5', ['→ guess “cancel”', C.amber]], C.amber));
  await until(S(24));
  await play(...say('ALL OTHER CARDS → “STAY”', C.cyan), ...fbox(['hours < 5 → “cancel”', ['otherwise → “stay”', C.cyan]], C.amber));

  const dinaRing = ring(DINA_MAR, C.ink, 0.14, 3.5);
  await until(S(25));
  await play(new M.Create(dinaRing, { runTime: 0.6 }), ...say('DINA, MARCH', C.amber),
    ...fbox(['Dina, March', ['3 hours played', C.amber]], C.amber));
  await until(S(26));
  await play(new M.Indicate(cards[DINA_MAR].t2, { color: C.amber, runTime: 0.9 }), ...say('3 HOURS → GUESS “CANCEL”', C.amber),
    ...fbox(['Dina, March: 3 h', ['3 < 5 → “cancel”', C.amber]], C.amber));
  const x1 = cross(DINA_MAR);
  await until(S(27));
  await play(new M.Create(x1, { runTime: 0.5 }), ...say('SHE STAYED: 1 WRONG GUESS', C.pink),
    ...fbox(['Dina, March: 3 h', 'guess: cancel', ['real: stayed (wrong)', C.pink]], C.pink));

  const eliRing = ring(ELI_JUN, C.cyan, 0.14, 3.5);
  await until(S(28));
  await play(new M.FadeOut(dinaRing, { runTime: 0.4 }), new M.Create(eliRing, { runTime: 0.6 }),
    new M.Indicate(cards[ELI_JUN].t2, { color: C.cyan, runTime: 0.8 }),
    ...say('ELI, JUNE: 6 HOURS', C.cyan),
    ...fbox(['Eli, June: 6 h', ['6 ≥ 5 → guess “stay”', C.cyan]], C.cyan));
  const x2 = cross(ELI_JUN);
  await until(S(29));
  await play(new M.Create(x2, { runTime: 0.5 }), ...say('GUESS “STAY”, BUT ELI CANCELLED', C.pink),
    ...fbox(['Eli, June: 6 h', 'guess: stay', ['real: cancelled (wrong)', C.pink]], C.pink));

  const others = R.map((_, i) => i).filter(i => i !== DINA_MAR && i !== ELI_JUN);
  const chk3 = others.map(i => check(i));
  await until(S(30));
  await play(new M.FadeOut(eliRing, { runTime: 0.4 }),
    new M.LaggedStart(chk3.map(c => new M.Create(c, { runTime: 0.25 })), { lagRatio: 0.1, runTime: 1.8 }),
    ...say('THE OTHER 18 CARDS: RIGHT', C.green), ...fbox([['right = 18', C.green], ['wrong =  2', C.pink]], C.green));

  // 31-33 formula
  await until(S(31));
  await play(...say('THE SCORE IN ONE LINE', C.amber));
  await until(S(32));
  await play(...say('RIGHT GUESSES ÷ ALL GUESSES', C.amber), ...fbox([['accuracy =', C.amber], '  right guesses', '  ÷ all guesses'], C.amber));
  await until(S(33));
  await play(...say('18 ÷ 20 = 90%', C.green), ...fbox([['accuracy =', C.amber], '  18 ÷ 20', ['  = 90 percent', C.green]], C.green));

  // 34-38 compare, trap
  await until(S(34));
  await play(...say('2 MORE RIGHT THAN THE BASELINE', C.green), ...fbox([['baseline:   16 / 20 = 80%', C.cyan], ['hours rule: 18 / 20 = 90%', C.green]], C.green));
  await until(S(35));
  await play(...say('BASELINE = SIMPLE STARTING RULE', C.violet), ...fbox([['baseline', C.violet], 'a simple starting rule', 'on the same cards'], C.violet));
  await until(S(36));
  await play(fadeAll([x1, x2, ...chk3, ...flags], 0.5), ...say('TRAP: 80% SOUNDS HIGH', C.pink),
    ...fbox([['trap:', C.pink], '80% sounds high!'], C.pink));
  const missX = cancelled.map(i => cross(i));
  const missRings = cancelled.map(i => ring(i, C.pink, 0.12, 3.2));
  await until(S(37));
  await play(new M.LaggedStart(missX.map(c => new M.Create(c, { runTime: 0.3 })), { lagRatio: 0.2, runTime: 1.0 }),
    new M.LaggedStart(missRings.map(r => new M.Create(r, { runTime: 0.35 })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('ALWAYS “STAY”: 0 OF 4 CANCELS', C.pink), ...fbox(['always “stay” = 80%', ['cancels found: 0 of 4', C.pink]], C.pink));
  await until(S(38));
  await play(...say('COMPARE ON THE SAME CARDS', C.green), ...fbox(['same 20 cards:', ['baseline   80%', C.cyan], ['hours rule 90%', C.green]], C.green));
}
