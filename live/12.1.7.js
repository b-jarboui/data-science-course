// lesson 12.1.7
// Target leakage: a "cancel date" column gives the answer away. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;
  const PILL = P ? [0, 2.25, 0] : [0, 2.03, 0];
  const BOXP = P ? [0, 3.60, 0] : [0, -2.60, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const txt = (s, size, color, pos, mono = false, maxW = 0, bold = false) => {
    const t = T(s, size, color, mono, bold);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo(pos);
    return t;
  };
  const leftTxt = (s, size, color, x, y, mono = false, maxW = 0, bold = false) => {
    const t = T(s, size, color, mono, bold);
    let w = t.getWidth();
    if (maxW && w > maxW) { t.scale(maxW / w); w = maxW; }
    t.moveTo([x + w / 2, y, 0]);
    return t;
  };
  const rect = (w, h, pos, color, fill = C.card, op = 0.95, sw = 2) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: sw });
    r.setFill(fill, op);
    r.moveTo(pos);
    return r;
  };
  const bar = (w, h, pos, color, op = 0.85) => {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 });
    r.setFill(color, op);
    r.moveTo(pos);
    return r;
  };
  const line = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dash = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const tag = (s, color, pos, size = 17) => { const t = pill(s, color, Math.max(15, size)); t.moveTo(pos); return t; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x, { runTime: 0.45 }));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x, { runTime: 0.3 }));
  function arrow(a, b, color = C.amber, w = 2.5) {
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, h = 0.16, k = h * 0.6;
    return new M.VGroup(
      line(a, b, color, w),
      line(b, [b[0] - h * ux - k * uy, b[1] - h * uy + k * ux, 0], color, w),
      line(b, [b[0] - h * ux + k * uy, b[1] - h * uy - k * ux, 0], color, w)
    );
  }
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.25 })] : [];
    boxNow = null;
    if (!lines) return a;
    const size = P ? 21 : 20, lh = P ? 0.4 : 0.34;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = rect(wd, ht, BOXP, color);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.0 : 10.8) / wd, (P ? 1.55 : 1.1) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP);
    a.push(new M.FadeIn(g, { runTime: 0.35 }));
    boxNow = g;
    return a;
  }
  let pic = [], mk = [];
  const picture = (...o) => {
    const n = o.filter(Boolean);
    const a = [
      ...fout(...pic.filter(x => !n.includes(x)), ...mk.filter(x => !n.includes(x))),
      ...fin(...n.filter(x => !pic.includes(x) && !mk.includes(x)))
    ];
    pic = n;
    mk = [];
    return a;
  };
  const marks = (...o) => {
    const n = o.filter(Boolean);
    const a = [...fout(...mk.filter(x => !n.includes(x))), ...fin(...n.filter(x => !mk.includes(x)))];
    mk = n;
    return a;
  };

  // ---- shared data: 20 renewals ----
  const D = [
    ['Ali', 'Jan'], ['Ali', 'Feb'], ['Ali', 'Mar'], ['Ali', 'Apr'], ['Ali', 'May'], ['Ali', 'Jun'],
    ['Bea', 'Jan'], ['Bea', 'Feb'], ['Bea', 'Mar', '12 Mar'],
    ['Chen', 'Jan'], ['Chen', 'Feb'], ['Chen', 'Mar'], ['Chen', 'Apr', '20 Apr'],
    ['Farah', 'Feb', '5 Feb'],
    ['Dina', 'Mar'], ['Dina', 'Apr'], ['Dina', 'May'], ['Dina', 'Jun'],
    ['Eli', 'May'], ['Eli', 'Jun', '25 Jun'],
  ].map(([name, m, date]) => ({ name, m, date, cx: !!date }));
  const oc = d => d.cx ? PINK : C.cyan;
  const CX_IDX = D.map((d, i) => d.cx ? i : -1).filter(i => i >= 0);
  const ST_IDX = D.map((d, i) => d.cx ? -1 : i).filter(i => i >= 0);

  const COLS = P ? 4 : 5;
  const CW = P ? 1.80 : 1.90, CH = P ? 1.30 : 0.70;
  const PX = P ? 1.92 : 2.10, PY = P ? 1.52 : 0.79;
  const TOP = P ? 1.40 : 1.24;
  const SH = P ? 0.52 : 0.29;
  const pos = i => [((i % COLS) - (COLS - 1) / 2) * PX, TOP - Math.floor(i / COLS) * PY, 0];
  const spos = i => { const p = pos(i); return [p[0], p[1] - (P ? 0.22 : 0.15), 0]; };
  function grid() {
    const cards = D.map((d, i) => {
      const p = pos(i);
      return new M.VGroup(
        rect(CW, CH, p, oc(d)),
        txt(`${d.name} ${d.m}`, P ? 19 : 15, oc(d), [p[0] - 0.14, p[1] + (P ? 0.28 : 0.18), 0], false, CW - 0.54)
      );
    });
    const slots = D.map((d, i) => rect(CW - (P ? 0.16 : 0.22), SH, spos(i), C.muted, C.bg, 0.75, 1.2));
    const dates = D.map((d, i) => d.cx ? txt(d.date, P ? 21 : 15, PINK, spos(i), true, CW - 0.26, P) : null);
    const empties = D.map((d, i) => txt('empty', P ? 20 : 15, C.muted, spos(i), false, CW - 0.26));
    return { cards, slots, dates, empties };
  }
  const check = (i, good) => {
    const p = pos(i);
    return txt(good ? '✓' : '✗', P ? 22 : 19, good ? C.green : PINK, [p[0] + CW / 2 - 0.20, p[1] + (P ? 0.28 : 0.18), 0]);
  };
  const outline = (i, color) => rect(CW + 0.1, CH + 0.1, pos(i), color, color, 0, 3);

  // 0-1 the twenty cards
  let G = grid();
  await until(S(0));
  await play(
    new M.LaggedStart(G.cards.map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 1.5 }),
    ...fbox(['20 renewal cards', ['4 cancelled · 16 stayed', C.muted]]),
    ...say('A NEW RULE: EVERY RENEWAL RIGHT?', C.amber)
  );
  pic = [...G.cards];
  await until(S(1));
  await play(...say('WHO GETS A DISCOUNT ON RENEWAL DAY?', C.amber));

  // 2-3 a new space
  await until(S(2));
  await play(new M.LaggedStart(G.slots.map(s => new M.FadeIn(s)), { lagRatio: 0.05, runTime: 1.4 }), ...say('ADD A NEW SPACE TO EACH CARD'));
  pic.push(...G.slots);
  await until(S(3));
  await play(...say('THE NEW SPACE: CANCEL DATE', PINK), ...fbox([['cancel date', PINK], 'the day the customer cancelled']));

  // 4-7 four dates (explicit beat per sentence)
  const showDate = (i, label) => {
    pic.push(G.dates[i]);
    return [new M.FadeIn(G.dates[i]), new M.Flash(G.dates[i], { color: PINK, flashRadius: 0.45 }), ...fbox([['cancel date', PINK], label], PINK)];
  };
  await until(S(4));
  await play(...showDate(13, 'Farah Feb → 5 Feb'));
  await until(S(5));
  await play(...showDate(8, 'Bea Mar → 12 Mar'));
  await until(S(6));
  await play(...showDate(12, 'Chen Apr → 20 Apr'));
  await until(S(7));
  await play(...showDate(19, 'Eli Jun → 25 Jun'));

  // 8 sixteen empty
  await until(S(8));
  await play(
    new M.LaggedStart(ST_IDX.map(i => new M.FadeIn(G.empties[i])), { lagRatio: 0.06, runTime: 1.4 }),
    ...fbox(['16 spaces stay empty']),
    ...say('THE OTHER 16 SPACES: EMPTY', C.muted)
  );
  pic.push(...ST_IDX.map(i => G.empties[i]));

  // 9-14 the rule on today's cards
  await until(S(9));
  await play(...say('TRY THE RULE ON TODAY’S CARDS', C.amber), ...fbox([['RULE', C.amber], 'date  → guess CANCEL', 'empty → guess STAY'], C.amber));
  await until(S(10));
  await play(...marks(...CX_IDX.map(i => outline(i, PINK))), ...fbox([['date  → guess CANCEL', PINK], ['empty → guess STAY', C.muted]], C.amber));
  await until(S(11));
  await play(...marks(...ST_IDX.map(i => outline(i, C.cyan))), ...fbox([['date  → guess CANCEL', C.muted], ['empty → guess STAY', C.cyan]], C.amber));
  const cxChecks = CX_IDX.map(i => check(i, true));
  const stChecks = ST_IDX.map(i => check(i, true));
  await until(S(12));
  await play(...marks(...cxChecks), ...fbox([['4 pink cards: 4 right', PINK]], PINK));
  await until(S(13));
  await play(...marks(...cxChecks, ...stChecks), ...fbox([['4 pink cards: 4 right', PINK], ['16 cyan cards: 16 right', C.cyan]]));
  await until(S(14));
  await play(...fbox(['4 + 16 = 20 right', ['accuracy = 20 ÷ 20 = 100%', C.green]], C.green), ...say('20 OUT OF 20 = 100%', C.green));

  // 15-23 Bea's card on a line of dates
  const TL = P ? { x0: -3.3, w: 6.6, y: -3.30 } : { x0: -5.4, w: 10.8, y: -0.95 };
  const dx = day => TL.x0 + day / 59 * TL.w;            // day 0 = 1 Feb, 28 = 1 Mar, 39 = 12 Mar, 58 = 31 Mar
  const tick = (day, s, color = C.muted) => new M.VGroup(
    line([dx(day), TL.y - 0.08, 0], [dx(day), TL.y + 0.08, 0], color),
    txt(s, P ? 16 : 15, color, [dx(day), TL.y - (P ? 0.34 : 0.28), 0])
  );
  const axis = line([TL.x0, TL.y, 0], [TL.x0 + TL.w, TL.y, 0], C.muted, 3);
  const CP = P ? [0, 0.45, 0] : [-3.85, 0.70, 0];
  const BW = P ? 4.6 : 3.2, BH = P ? 1.75 : 1.48;
  const SLOTY = CP[1] - (P ? 0.48 : 0.40);
  const beaCard = new M.VGroup(
    rect(BW, BH, CP, PINK),
    txt('Bea · renewal 1 Mar', P ? 21 : 18, PINK, [CP[0], CP[1] + (P ? 0.52 : 0.44), 0]),
    txt('2 hours · 1 help', P ? 18 : 15, C.ink, [CP[0], CP[1] + 0.06, 0], true),
    rect(P ? 4.1 : 2.85, P ? 0.48 : 0.38, [CP[0], SLOTY, 0], C.muted, C.bg, 0.75, 1.2)
  );
  const beaDate = txt('cancel date: 12 Mar', P ? 18 : 15, PINK, [CP[0], SLOTY, 0], true);
  const beaEmpty = txt('cancel date: empty', P ? 18 : 15, C.muted, [CP[0], SLOTY, 0], true);
  await until(S(15));
  await play(...picture(axis, tick(0, '1 Feb'), tick(28, '1 Mar'), tick(59, '1 Apr'), beaCard, beaDate), ...fbox(null), ...say('BEA’S CARD ON A LINE OF DATES'));

  const rx = dx(28);
  const renewLine = dash([rx, TL.y - 0.14, 0], [rx, P ? TL.y + 1.38 : 0.24, 0], C.amber);
  const renewTag = tag('RENEWAL DAY', C.amber, [rx, TL.y - (P ? 0.85 : 0.68), 0], P ? 16 : 15);
  const known = txt('← KNOWN', P ? 16 : 15, C.cyan, P ? [rx - 1.45, TL.y + 1.05, 0] : [rx - 1.00, -0.05, 0]);
  const future = txt('FUTURE →', P ? 16 : 15, C.muted, P ? [rx + 1.55, TL.y + 1.05, 0] : [rx + 1.00, -0.05, 0]);
  await until(S(16));
  await play(...fin(renewLine, renewTag, known, future), ...say('RENEWAL DAY: 1 MARCH', C.amber));
  pic.push(renewLine, renewTag, known, future);

  const cdot = new M.Dot({ point: [dx(39), TL.y, 0], radius: 0.12, color: PINK });
  const ctick = txt('12 Mar', P ? 16 : 15, PINK, [dx(39), TL.y - (P ? 0.34 : 0.28), 0]);
  const ctag = tag('CANCEL DATE', PINK, [dx(39) + (P ? 0.55 : 0), TL.y + (P ? 0.48 : 0.42), 0], 15);
  await until(S(17));
  await play(...fin(cdot, ctick, ctag), new M.Flash(cdot, { color: PINK }), ...say('CANCEL DATE: RIGHT OF RENEWAL DAY', PINK));
  pic.push(cdot, ctick, ctag);

  // a person standing on 1 March (well clear of ← KNOWN on both laptop and phone)
  const PP = [rx, P ? TL.y + 1.62 : 0.42, 0];
  const head = new M.Circle({ radius: P ? 0.12 : 0.11, color: C.amber });
  head.setFill(C.amber, 1);
  head.moveTo([PP[0], PP[1] + (P ? 0.23 : 0.20), 0]);
  const body = new M.Arc({ radius: P ? 0.22 : 0.20, startAngle: 0, angle: Math.PI, color: C.amber });
  body.setFill(C.amber, 0.9);
  body.moveTo([PP[0], PP[1] - 0.05, 0]);
  const look = dash(
    P ? [PP[0], PP[1] + 0.40, 0] : [PP[0] - 0.24, PP[1] + 0.20, 0],
    P ? [PP[0], CP[1] - BH / 2 - 0.04, 0] : [CP[0] + BW / 2 + 0.06, PP[1] + 0.20, 0],
    C.amber
  );
  await until(S(18));
  await play(...fin(head, body, look), ...say('STAND ON 1 MARCH AND LOOK', C.amber));
  pic.push(head, body, look);

  await until(S(19));
  await play(new M.FadeOut(beaDate), new M.FadeIn(beaEmpty), ...fbox(['on 1 March:', ['cancel date = empty', C.muted]]), ...say('ON 1 MARCH THE SPACE IS EMPTY', C.muted));
  pic = pic.filter(o => o !== beaDate);
  pic.push(beaEmpty);

  // 20 a score before the game
  const SBP = P ? [0, -5.40, 0] : [3.85, 0.70, 0];
  const board = new M.VGroup(
    rect(P ? 4.4 : 3.2, P ? 1.48 : 1.40, SBP, C.violet),
    txt('GAME SCORE', P ? 17 : 15, C.violet, [SBP[0], SBP[1] + 0.45, 0]),
    txt('?  :  ?', P ? 32 : 30, C.ink, [SBP[0], SBP[1], 0], true),
    txt('game not played yet', P ? 16 : 15, C.muted, [SBP[0], SBP[1] - 0.45, 0])
  );
  await until(S(20));
  await play(...marks(board), ...say('LIKE A SCORE BEFORE THE GAME IS PLAYED', C.violet));

  // 21-23 the target
  await until(S(21));
  await play(...marks(), ...fbox([['TARGET', C.amber], 'the answer we want to guess'], C.amber), ...say('TARGET = THE ANSWER TO GUESS', C.amber));
  const BY = P ? TL.y - 1.45 : 1.08;
  const band = bar(dx(58) - rx, P ? 0.12 : 0.10, [(rx + dx(58)) / 2, BY, 0], C.amber, 0.75);
  const bandLab = txt('30 days after renewal', P ? 17 : 15, C.amber, [(rx + dx(58)) / 2, BY + (P ? -0.42 : 0.28), 0]);
  await until(S(22));
  await play(...marks(band, bandLab), ...fbox([['TARGET', C.amber], 'cancel within 30 days?', ['1 Mar → 31 Mar', C.muted]], C.amber));
  const leakArrow = arrow(
    P ? [dx(39) + 0.55, TL.y + 0.78, 0] : [dx(39) - 0.30, TL.y + 0.67, 0],
    P ? [1.55, CP[1] - BH / 2 - 0.05, 0] : [CP[0] + BW / 2 + 0.08, SLOTY, 0],
    PINK
  );
  await until(S(23));
  await play(
    ...fout(known, future),
    ...marks(band, bandLab, leakArrow),
    ...fbox(['the date is written AFTER the guess', ['it gives the answer away', PINK]], PINK),
    ...say('THE DATE GIVES THE ANSWER AWAY', PINK)
  );
  pic = pic.filter(o => o !== known && o !== future);

  // 24-25 back to the old cards: leakage
  G = grid();
  await until(S(24));
  await play(
    ...picture(...G.cards, ...G.slots, ...CX_IDX.map(i => G.dates[i]), ...ST_IDX.map(i => G.empties[i])),
    ...fbox(['clues: hours · help · cancel date', ['cancel date = a fact from AFTER renewal', PINK]], PINK),
    ...say('A LATER FACT SITS AMONG THE CLUES', PINK)
  );
  await until(S(25));
  await play(...marks(...CX_IDX.map(i => outline(i, PINK))), ...fbox([['TARGET LEAKAGE', PINK], 'the answer leaks into the clues'], PINK), ...say('THIS IS TARGET LEAKAGE', PINK));

  // 26-30 each card on its own renewal day
  await until(S(26));
  await play(
    ...marks(),
    ...fout(...CX_IDX.map(i => G.dates[i])),
    ...fin(...CX_IDX.map(i => G.empties[i])),
    ...fbox(['each card on its own renewal day']),
    ...say('BACK TO EACH RENEWAL DAY', C.amber)
  );
  pic = pic.filter(o => !G.dates.includes(o));
  pic.push(...CX_IDX.map(i => G.empties[i]));
  await until(S(27));
  await play(new M.LaggedStart(G.empties.map(e => new M.Indicate(e, { color: C.amber })), { lagRatio: 0.05, runTime: 1.8 }), ...say('EVERY CANCEL DATE SPACE: EMPTY', C.muted));
  await until(S(28));
  await play(...marks(...D.map((_, i) => outline(i, C.cyan))), ...fbox(['empty → guess STAY', ['for all 20 cards', C.cyan]]), ...say('THE RULE SAYS STAY FOR EVERY CARD'));
  const realChecks = D.map((d, i) => check(i, !d.cx));
  await until(S(29));
  await play(...marks(...realChecks), ...fbox(['16 right out of 20', ['16 ÷ 20 = 80%', C.amber]], C.amber), ...say('16 OUT OF 20 = 80%', C.amber));
  await until(S(30));
  await play(...marks(...realChecks, ...CX_IDX.map(i => outline(i, PINK))), ...fbox([['cancels found: 0 of 4', PINK]], PINK), ...say('IT FINDS NONE OF THE 4 CANCELS', PINK));

  // 31-33 compare the two scores
  const BX = P ? -3.3 : -4.6, BL = P ? 5.2 : 7.6;
  const y1 = P ? 0.55 : 0.65, y2 = P ? -1.75 : -0.55, bh = P ? 0.72 : 0.48;
  const bar1 = bar(BL, bh, [BX + BL / 2, y1, 0], C.green);
  const bar2 = bar(BL * 0.8, bh, [BX + BL * 0.4, y2, 0], C.amber);
  const lab1 = leftTxt('with later dates: 20 of 20 right', P ? 20 : 18, C.ink, BX, y1 + (P ? 0.72 : 0.48), false, P ? FW - 1.0 : 0);
  const lab2 = leftTxt('on renewal day: 16 of 20 right', P ? 20 : 18, C.ink, BX, y2 + (P ? 0.72 : 0.48), false, P ? FW - 1.0 : 0);
  const v1 = txt('100%', P ? 24 : 22, C.green, [BX + BL + (P ? 0.85 : 0.75), y1, 0], true, 0, true);
  const v2 = txt('80%', P ? 24 : 22, C.amber, [BX + BL * 0.8 + (P ? 0.75 : 0.65), y2, 0], true, 0, true);
  const ay = P ? -2.65 : -1.08;
  const bAxis = line([BX, ay, 0], [BX + BL, ay, 0], C.muted, 2);
  const bTicks = [0, 50, 100].map(pct => {
    const x = BX + (pct / 100) * BL;
    return new M.VGroup(
      line([x, ay - 0.08, 0], [x, ay + 0.08, 0], C.muted, 2),
      txt(`${pct}%`, P ? 16 : 15, C.muted, [x, ay - (P ? 0.33 : 0.26), 0], true)
    );
  });
  const bAxisName = txt('accuracy', P ? 16 : 15, C.muted, P ? [BX + BL / 2, ay - 0.75, 0] : [BX + BL + 1.05, ay - 0.26, 0]);
  await until(S(31));
  await play(
    ...picture(bar1, bar2, lab1, lab2, v1, v2, bAxis, ...bTicks, bAxisName),
    ...fbox(['100% with later dates', ['80% without them', C.amber]]),
    ...say('COMPARE THE TWO SCORES')
  );
  await until(S(32));
  await play(...fbox(['for each clue ask:', ['will the app have it when it acts?', C.green]], C.green), ...say('CHECK FOR LEAKAGE', C.green));
  await until(S(33));
  await play(
    new M.Indicate(v1, { color: PINK }),
    ...marks(tag('TOO GOOD TO BE TRUE?', PINK, P ? [0, -4.15, 0] : [0, -1.72, 0], P ? 18 : 16)),
    ...say('TRAP: A PERFECT SCORE', PINK)
  );

  // 34-35 when does the app learn each clue?
  const rowsY = P ? [0.20, -1.40, -3.00] : [0.58, -0.26, -1.10];
  const rw = P ? 6.8 : 8.6, rh = P ? 1.24 : 0.66;
  const head2 = txt('When does the app first learn it?', P ? 21 : 20, C.amber, [0, P ? 1.40 : 1.38, 0], false, FW - 0.8);
  const clueRow = (name, timing, color, y) => {
    const box = rect(rw, rh, [0, y, 0], color, C.card, 0.95, 2);
    if (P) {
      return {
        card: new M.VGroup(box, txt(name, 21, C.ink, [0, y + 0.27, 0], false, rw - 0.6, true)),
        label: txt(timing, 19, color, [0, y - 0.27, 0], true, rw - 0.6, true),
      };
    }
    return {
      card: box,
      label: txt(`${name}  →  ${timing}`, 19, color, [0, y, 0], true, rw - 0.5),
    };
  };
  const r1 = clueRow('hours played', 'before renewal ✓', C.green, rowsY[0]);
  const r2 = clueRow('help requests', 'before renewal ✓', C.green, rowsY[1]);
  const r3 = clueRow('cancel date', 'after renewal ✗', PINK, rowsY[2]);
  await until(S(34));
  await play(
    ...picture(head2, r1.card, r1.label, r2.card, r2.label, r3.card, r3.label),
    ...fbox(['look at the moment the app must act']),
    ...say('WHEN IS EACH FACT FIRST KNOWN?', C.amber)
  );
  await until(S(35));
  await play(
    new M.Indicate(r3.label, { color: PINK }),
    ...marks(rect(rw + 0.14, rh + 0.14, [0, rowsY[2], 0], PINK, PINK, 0, 3.5)),
    ...fbox([['perfect score?', PINK], 'check for a clue from the future'], PINK),
    ...say('PERFECT SCORE? CHECK FOR LEAKAGE', PINK)
  );
}
