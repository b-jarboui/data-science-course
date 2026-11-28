// 16.3.5 Concept drift. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.4, 0] : [4.3, -0.3, 0];
  const LX = P ? -3.2 : -5.7;
  const RED = '#f87171', TW = P ? 0.9 : 0.88, TF = P ? 15 : 15;
  const enter = o => new M.FadeIn(o, { runTime: 0.4 });
  const leave = o => new M.FadeOut(o, { runTime: 0.3 });
  const emph = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.6 });

  function label(text, x, y, maxW, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo([x, y, 0]); return t;
  }
  function leftLabel(text, x, y, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true); t.moveTo([x + t.getWidth() / 2, y, 0]); return t;
  }
  function rect(x, y, w, h, color, fill, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.13, color, strokeWidth: sw });
    if (fill) r.setFill(fill, 0.95); r.moveTo([x, y, 0]); return r;
  }
  let pillNow = null;
  function say(text, color = C.cyan) {
    const p = pill(text, color, P ? 18 : 19);
    const maxW = P ? FW - 0.8 : 7.25;
    if (p.getWidth() > maxW) p.scale(maxW / p.getWidth());
    p.moveTo(PILL);
    const a = pillNow ? [leave(pillNow)] : []; pillNow = p; a.push(enter(p)); return a;
  }
  let boxNow = null;
  function setBox(g) { const a = [enter(g)]; if (boxNow) a.push(leave(boxNow)); boxNow = g; return a; }
  function clearBox() { const a = boxNow ? [leave(boxNow)] : []; boxNow = null; return a; }
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    return setBox(g);
  }
  function card(name, route, x, y, w = 3.2) {
    const rc = route === 'North' ? C.cyan : C.pink;
    const box = rect(x, y, w, 0.62, C.line, C.card);
    const icon = rect(x - w / 2 + 0.34, y, 0.32, 0.3, rc, C.card, 1.5);
    const tape = new M.Line({ start: [x - w / 2 + 0.34, y + 0.14, 0], end: [x - w / 2 + 0.34, y + 0.02, 0], color: rc, strokeWidth: 2 });
    const nm = leftLabel(name, x - w / 2 + 0.6, y, C.ink, P ? 17 : 19);
    const tagT = T(route, TF, rc, true, true);
    const tag = new M.VGroup(rect(x + w / 2 - TW / 2 - 0.1, y, TW, 0.34, rc, C.bg, 1.5), tagT);
    tagT.moveTo([x + w / 2 - TW / 2 - 0.1, y, 0]);
    return new M.VGroup(box, icon, tape, nm, tag);
  }

  // 0-2 a useful model, changing roads
  const RY = P ? 0.0 : -0.5, rx0 = LX + 0.2, rx1 = LX + (P ? 6.2 : 6.4);
  const model = new M.VGroup(rect(P ? 0 : CX, P ? 1.1 : 0.7, P ? 3.2 : 4.4, P ? 1.1 : 1.4, C.violet, C.card), label('MODEL', P ? 0 : CX, P ? 1.1 : 0.7, null, C.violet, P ? 28 : 32, true));
  await until(S(0)); await play(enter(model), ...say('A MODEL THAT PREDICTS LATE DELIVERY', C.violet));
  const road = new M.VGroup(new M.Line({ start: [rx0, RY, 0], end: [rx1, RY, 0], color: C.muted, strokeWidth: 10 }),
    new M.DashedLine({ start: [rx0, RY, 0], end: [rx1, RY, 0], color: C.ink }),
    label('road', rx0 + 0.4, RY - 0.4, null, C.muted, 16));
  await until(S(1)); await play(enter(road), ...say('ROADS AND CONDITIONS CAN CHANGE', C.amber));
  await until(S(2)); await play(...say('SAME INFORMATION → DIFFERENT CHANCE?', C.amber));

  // 3-12 Monday's four North parcels
  const CW = P ? 2.55 : 2.3, XA = P ? -2.45 : CX - 2.2, XB = P ? 1.3 : CX + 1.5;
  const rowY = i => (P ? 1.0 : 0.6) - i * (P ? 1.0 : 0.7);
  const HY = P ? 1.62 : 1.2;
  const bX = x => x + CW / 2 + 0.32;
  const mon = ['Nell', 'Oak', 'Pine', 'Reed'].map((n, i) => card(n, 'North', XA, rowY(i), CW));
  const later = [1, 2, 3, 4].map(i => card(`#${i}`, 'North', XB, rowY(i - 1), CW));
  const headA = label('Monday · dry', XA, HY, CW, C.cyan, 18, true);
  const headB = label('Later dry day', XB, HY, CW, C.violet, 18, true);
  await until(S(3)); await play(leave(model), leave(road), enter(headA), ...say('MONDAY’S 4 NORTH PARCELS', C.cyan));
  await until(S(4)); await play(new M.LaggedStart(mon.map(enter), { lagRatio: 0.2, runTime: 1.0 }), ...say('NELL, OAK, PINE, REED'));
  await until(S(5)); await play(...fbox(['Dry day', ['similar loading', C.muted], ['conditions', C.muted]], C.cyan), ...say('DRY DAY, SIMILAR LOADING'));
  await until(S(6)); await play(...clearBox(), ...say('NOW THE DELIVERY RESULTS'));
  const res = (late, x, y) => label(late ? 'LATE' : 'ON TIME', x, y, TW - 0.08, late ? RED : C.green, TF, true);
  const monRes = [true, false, false, false];
  const stampX = XA + CW / 2 - TW / 2 - 0.1;
  const monStamp = monRes.map((l, i) => { const t = res(l, stampX, rowY(i)); return new M.VGroup(rect(stampX, rowY(i), TW, 0.34, l ? RED : C.green, C.bg, 1.5), t); });
  const sayRes = ['NELL ARRIVES LATE', 'OAK: ON TIME', 'PINE: ON TIME', 'REED: ON TIME'];
  for (let i = 0; i < 4; i++) {
    await until(S(7 + i));
    await play(leave(mon[i].submobjects[4]), enter(monStamp[i]), ...say(sayRes[i], monRes[i] ? RED : C.green));
  }
  const blk = (x, y, c) => { const b = new M.Rectangle({ width: 0.4, height: 0.4, color: c, strokeWidth: 1.5 }); b.setFill(c, 0.85); b.moveTo([x, y, 0]); return b; };
  const monB = monRes.map((l, i) => blk(bX(XA), rowY(i), l ? RED : C.green));
  await until(S(11)); await play(new M.LaggedStart(monB.map(enter), { lagRatio: 0.2, runTime: 1.0 }), ...say('RED = LATE · GREEN = ON TIME'));
  const sumA = label('1 of 4 late', XA, rowY(3) - 0.62, null, RED, 19, true);
  await until(S(12)); await play(enter(sumA), ...say('1 OF 4 ARRIVES LATE', RED));

  // 13-25 a later dry day
  await until(S(13)); await play(enter(headB), ...say('ANOTHER DRY DAY', C.violet));
  await until(S(14)); await play(new M.LaggedStart(later.map(enter), { lagRatio: 0.2, runTime: 1.0 }), ...say('4 MORE NORTH PARCELS', C.cyan));
  await until(S(15)); await play(...fbox(['Loading conditions', ['same as Monday', C.green]], C.green));
  await until(S(16)); await play(...fbox(['Loading conditions', ['same as Monday', C.green], 'Dispatch rules', ['same as Monday', C.green]], C.green));
  await until(S(17)); await play(...say('TO THE MODEL: THEY LOOK SIMILAR', C.violet));
  const latRes = [true, true, true, false];
  const latB = latRes.map((l, i) => blk(bX(XB), rowY(i), l ? RED : C.green));
  await until(S(18)); await play(...clearBox(), ...say('REVEAL THE RESULTS'));
  const latSay = ['FIRST: LATE', 'SECOND: LATE', 'THIRD: LATE', 'ONLY THE FOURTH: ON TIME'];
  for (let i = 0; i < 4; i++) {
    await until(S(19 + i));
    await play(enter(latB[i]), emph(later[i], latRes[i] ? RED : C.green), ...say(latSay[i], latRes[i] ? RED : C.green));
  }
  const sumB = label('3 of 4 late', XB, rowY(3) - 0.62, null, RED, 19, true);
  await until(S(23)); await play(new M.LaggedStart([...monB, ...latB].map(b => emph(b, C.amber)), { lagRatio: 0.08, runTime: 1.0 }), ...say('COMPARE THE TWO COLUMNS', C.amber));
  await until(S(24)); await play(emph(monB[0], RED), emph(sumA, RED), ...say('MONDAY: 1 LATE', RED));
  await until(S(25)); await play(enter(sumB), ...say('LATER DAY: 3 LATE', RED));

  // 26-31 what changed: road works
  await until(S(26)); await play(...say('WHAT HAS CHANGED?', C.amber));
  const [bx, by] = BOXP, W = P ? FW - 1.2 : 4.0, H = P ? 2.3 : 2.6;
  const ry = by - 0.1, r0 = bx - W / 2 + 0.35, r1 = bx + W / 2 - 0.35;
  const frame = rect(bx, by, W, H, C.amber, C.card);
  const road2 = new M.Line({ start: [r0, ry, 0], end: [r1, ry, 0], color: C.muted, strokeWidth: 8 });
  const works = new M.Rectangle({ width: 0.7, height: 0.5, color: C.amber, strokeWidth: 2 }); works.setFill(C.amber, 0.8); works.moveTo([bx, ry, 0]);
  const wT = label('road repairs', bx, ry - 0.55, null, C.amber, 17, true);
  const ttl = label('North route', bx, by + H / 2 - 0.3, null, C.cyan, 18, true);
  const repairs = new M.VGroup(frame, road2, works, wT, ttl);
  await until(S(27)); await play(...setBox(repairs), ...say('ROAD REPAIRS ON THE NORTH ROUTE', C.amber));
  const det = new M.VGroup(
    new M.DashedLine({ start: [bx - 1.1, ry, 0], end: [bx - 0.8, ry + 0.7, 0], color: C.pink }),
    new M.DashedLine({ start: [bx - 0.8, ry + 0.7, 0], end: [bx + 0.8, ry + 0.7, 0], color: C.pink }),
    new M.DashedLine({ start: [bx + 0.8, ry + 0.7, 0], end: [bx + 1.1, ry, 0], color: C.pink }),
    label('longer path', bx, ry + 0.95, null, C.pink, 16, true));
  await until(S(28)); await play(new M.Create(det), ...say('DRIVERS TAKE A LONGER PATH', C.pink));
  await until(S(29)); await play(leave(det), ...fbox(['Model inputs:', ['planned route ✓', C.muted], ['loading wait ✓', C.muted], ['road repairs ✗ (not sent)', C.pink]], C.pink));
  await until(S(30)); await play(emph(sumB, RED), ...say('SIMILAR PARCELS: HIGHER CHANCE OF LATE', RED));
  await until(S(31)); await play(...fbox(['Concept drift', ['the link between inputs', C.muted], ['and results changes', C.muted]], C.amber), ...say('CONCEPT DRIFT', C.amber));

  // 32-42 measure the change
  await until(S(32)); await play(...say('MEASURE THE DIFFERENCE', C.amber));
  const pct = (x, i, c) => label('25%', bX(x) + 0.6, rowY(i), null, c, P ? 16 : 17, true);
  const pA = [0, 1, 2, 3].map(i => pct(XA, i, C.muted)), pB = [0, 1, 2, 3].map(i => pct(XB, i, C.muted));
  await until(S(33)); await play(...pA.map(enter), ...pB.map(enter), ...fbox(['1 block = 1 of 4', ['= 25%', C.amber]], C.amber));
  const sumA2 = label('25% late', XA, rowY(3) - 0.62, null, RED, 19, true);
  await until(S(34)); await play(leave(sumA), enter(sumA2), emph(monB[0], RED), ...say('MONDAY: 1 RED BLOCK = 25% LATE', RED));
  await until(S(35)); await play(new M.LaggedStart(latB.slice(0, 3).map(b => emph(b, RED)), { lagRatio: 0.25, runTime: 0.9 }), ...say('LATER DAY: 3 RED BLOCKS', RED));
  await until(S(36)); await play(...fbox(['25 + 25 = 50'], RED));
  const sumB2 = label('75% late', XB, rowY(3) - 0.62, null, RED, 19, true);
  await until(S(37)); await play(leave(sumB), enter(sumB2), ...fbox(['25 + 25 + 25 = 75%'], RED), ...say('75% LATE', RED));
  await until(S(38)); await play(...fbox(['75 − 25 = 50'], C.amber));
  await until(S(39)); await play(...fbox(['late share: 25% → 75%', ['+50 percentage points', C.amber]], C.amber), ...say('UP 50 PERCENTAGE POINTS', C.amber));
  await until(S(40)); await play(...say('TWO SHORT FORMULAS'));
  await until(S(41)); await play(...fbox(['late % =', ' late ÷ total × 100', [' Monday: 1 ÷ 4 × 100 = 25', C.muted], [' later:  3 ÷ 4 × 100 = 75', C.muted]], RED));
  await until(S(42)); await play(...fbox(['change in points =', ' new % − old %', [' = 75 − 25', C.muted], [' = 50 percentage points', C.amber]], C.amber));

  // 43-49 meaning and caution
  await until(S(43)); await play(...fbox(['Concept drift check', ['learned links may no', C.muted], ['longer fit today', C.muted]], C.green), ...say('NOTICE WHEN THE MODEL IS OUT OF DATE', C.green));
  await until(S(44)); await play(...fbox(['Covariate shift:', ['the inputs change', C.muted], 'Concept drift:', ['results change for', C.muted], ['similar inputs', C.muted]], C.violet));
  await until(S(45)); await play(...say('4 PARCELS PER GROUP: VERY LITTLE INFORMATION', C.amber));
  await until(S(46)); await play(...fbox(['Small groups', ['can differ by chance', C.muted], ['even when nothing changed', C.muted]], C.amber));
  await until(S(47)); await play(...fbox(['Next step', ['check more similar parcels', C.muted], ['does the change last?', C.amber]], C.amber), ...say('CHECK MORE SIMILAR PARCELS', C.amber));
  await until(S(48)); await play(...fbox(['If it lasts', ['train the model with', C.muted], ['more recent examples', C.muted]], C.green), ...say('IF IT LASTS: RETRAIN WITH RECENT EXAMPLES', C.green));
  await until(S(49)); await play(...clearBox(), emph(sumA2, RED), emph(sumB2, RED), ...say('SAME INPUTS, NEW CHANCE OF THE RESULT', C.amber));
}
