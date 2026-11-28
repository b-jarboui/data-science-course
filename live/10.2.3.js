// 10.2.3 Product terms: a slope for each neighborhood.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger so they read on a small screen; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // --- layout constants (phone 8 x 14.22, laptop 14.22 x 8) ------------------
  const PILL = P ? [0, 1.74, 0] : [0, 1.94, 0];
  const BOXP = P ? [0, 3.20, 0] : [4.55, -0.45, 0];
  const BOX_MAXW = P ? FW - 0.9 : 4.35;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  const CW = P ? 2.28 : 2.15, CH = P ? 1.18 : 1.12;
  const X40 = P ? -2.25 : -3.35, X50 = P ? 2.25 : 0.65;
  const XMID = (X40 + X50) / 2;
  const Y_CED = P ? -0.80 : 0.08, Y_STA = P ? -3.22 : -1.68;
  const Y_COL = P ? 1.08 : 1.30, Y_STEP = P ? 0.70 : 0.94;
  const Y_GAP = (Y_CED - CH / 2 + Y_STA + CH / 2) / 2;
  const Y_BOT = P ? -4.68 : -2.65;
  const SWX = P ? 0 : XMID;

  // --- helpers ---------------------------------------------------------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.35 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function makeArrow(start, end, color, sw = 3) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const tipL = 0.17, tipW = 0.10;
    const bx = end[0] - ux * tipL, by = end[1] - uy * tipL;
    const w1 = [bx - uy * tipW, by + ux * tipW, 0];
    const w2 = [bx + uy * tipW, by - ux * tipW, 0];
    const shaft = new M.Line({ start, end, color, strokeWidth: sw });
    const tip = new M.VGroup(
      new M.Line({ start: w1, end, color, strokeWidth: sw }),
      new M.Line({ start: w2, end, color, strokeWidth: sw })
    );
    return { shaft, tip };
  }

  function cueMark(kind, p, s = 0.10) {
    if (kind === 'cedar') {
      const c = new M.Circle({ radius: s, color: C.cyan, strokeWidth: 2 });
      c.setFill(C.cyan, 0.9); c.moveTo(p); return c;
    }
    const q = new M.Rectangle({ width: s * 1.9, height: s * 1.9, color: C.amber, strokeWidth: 2 });
    q.setFill(C.amber, 0.9); q.moveTo(p); return q;
  }

  function makeCard(cx, cy, kind, tag) {
    const col = kind === 'cedar' ? C.cyan : C.amber;
    const box = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: col, strokeWidth: 2.5 });
    box.setFill(C.card, 0.94); box.moveTo([cx, cy, 0]);
    const mk = cueMark(kind, [cx - CW / 2 + 0.24, cy + CH / 2 - 0.25, 0], 0.075);
    const lb = T(tag, P ? 18 : 15, C.muted, true);
    lb.moveTo([cx - CW / 2 + 0.42 + lb.getWidth() / 2, cy + CH / 2 - 0.25, 0]);
    return new M.VGroup(box, mk, lb);
  }

  function makeRent(cx, cy, text, col) {
    const t = T(text, P ? 27 : 28, col, true, true);
    t.moveTo([cx, cy - 0.12, 0]);
    return t;
  }

  function makeKnob(x, col) {
    const k = new M.Circle({ radius: 0.18, color: col, strokeWidth: 2 });
    k.setFill(col, 0.95); k.moveTo([x, Y_BOT, 0]);
    return k;
  }

  function makeBulb(x, col, coreOp, haloOp) {
    const halo = new M.Circle({ radius: 0.30, color: col, strokeWidth: 1 });
    halo.setFill(col, haloOp); halo.setStrokeOpacity(haloOp); halo.moveTo([x, Y_BOT, 0]);
    const core = new M.Circle({ radius: 0.16, color: col, strokeWidth: 2 });
    core.setFill(col, coreOp); core.moveTo([x, Y_BOT, 0]);
    return { halo, core };
  }

  // --- 0-1 opening question: +10 m² in Cedar or Station ----------------------
  const topY = P ? -0.25 : 0.35, nbY = P ? -2.35 : -1.15, nbX = P ? 1.85 : 2.6;
  const sqBox = new M.RoundedRectangle({ width: 1.55, height: 1.05, cornerRadius: 0.14, color: C.green, strokeWidth: 2.5 });
  sqBox.setFill(C.green, 0.16); sqBox.moveTo([0, topY, 0]);
  const sqTxt = T('+10 m²', 26, C.green, true, true); sqTxt.moveTo([0, topY, 0]);

  const cedBadgeR = new M.RoundedRectangle({ width: 2.55, height: 0.95, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  cedBadgeR.setFill(C.card, 0.94); cedBadgeR.moveTo([-nbX, nbY, 0]);
  const cedBadgeM = cueMark('cedar', [-nbX - 0.72, nbY, 0], 0.11);
  const cedBadgeT = T('Cedar', 23, C.cyan, false, true); cedBadgeT.moveTo([-nbX + 0.20, nbY, 0]);

  const staBadgeR = new M.RoundedRectangle({ width: 2.55, height: 0.95, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.5 });
  staBadgeR.setFill(C.card, 0.94); staBadgeR.moveTo([nbX, nbY, 0]);
  const staBadgeM = cueMark('station', [nbX - 0.78, nbY, 0], 0.11);
  const staBadgeT = T('Station', 23, C.amber, false, true); staBadgeT.moveTo([nbX + 0.22, nbY, 0]);

  const aLeft = makeArrow([-0.55, topY - 0.58, 0], [-nbX + 0.35, nbY + 0.54, 0], C.cyan, 2.5);
  const aRight = makeArrow([0.55, topY - 0.58, 0], [nbX - 0.35, nbY + 0.54, 0], C.amber, 2.5);
  const introG = new M.VGroup(
    sqBox, sqTxt, cedBadgeR, cedBadgeM, cedBadgeT, staBadgeR, staBadgeM, staBadgeT,
    aLeft.shaft, aLeft.tip, aRight.shaft, aRight.tip
  );

  await until(S(0));
  await play(new M.FadeIn(introG), ...say('+10 m²: CEDAR OR STATION?', C.cyan));

  const qCed = T('+$?', 26, C.cyan, true, true); qCed.moveTo([-nbX, nbY - 0.88, 0]);
  const qSta = T('+$?', 26, C.amber, true, true); qSta.moveTo([nbX, nbY - 0.88, 0]);
  const qEq = T('= ?', 24, C.ink, true, true); qEq.moveTo([0, nbY - 0.88, 0]);
  const introQ = new M.VGroup(qCed, qSta, qEq);

  await until(S(1));
  await play(new M.FadeIn(introQ), ...say('SAME SPACE → SAME EXTRA RENT?', C.amber));

  // --- 2-8 four listing cards in two rows ------------------------------------
  const rowCed = P
    ? new M.VGroup(
        cueMark('cedar', [-1.25, 0.12, 0], 0.10),
        T('Cedar', 20, C.cyan, false, true).moveTo([-0.60, 0.12, 0])
      )
    : new M.VGroup(
        cueMark('cedar', [-6.35, Y_CED + 0.12, 0], 0.11),
        T('Cedar', 21, C.cyan, false, true).moveTo([-5.52, Y_CED + 0.12, 0])
      );
  const rowSta = P
    ? new M.VGroup(
        cueMark('station', [-1.32, -2.22, 0], 0.10),
        T('Station', 20, C.amber, false, true).moveTo([-0.58, -2.22, 0])
      )
    : new M.VGroup(
        cueMark('station', [-6.35, Y_STA + 0.12, 0], 0.11),
        T('Station', 21, C.amber, false, true).moveTo([-5.45, Y_STA + 0.12, 0])
      );

  const cardA = makeCard(X40, Y_CED, 'cedar', 'Card A');
  const cardE = makeCard(X50, Y_CED, 'cedar', 'Card E');
  const cardD = makeCard(X40, Y_STA, 'station', 'Card D');
  const cardH = makeCard(X50, Y_STA, 'station', 'Card H');

  await until(S(2));
  await play(
    new M.FadeOut(introG), new M.FadeOut(introQ),
    new M.FadeIn(rowCed), new M.FadeIn(rowSta),
    new M.LaggedStart([cardA, cardE, cardD, cardH].map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('4 LISTING CARDS IN 2 ROWS', C.cyan)
  );

  const col40 = T('40 m²', 21, C.ink, true, true); col40.moveTo([X40, Y_COL, 0]);
  const col50 = T('50 m²', 21, C.ink, true, true); col50.moveTo([X50, Y_COL, 0]);
  await until(S(3));
  await play(new M.FadeIn(col40), new M.FadeIn(col50), ...say('40 m²  →  50 m²', C.ink));

  const sameTxt = T('All 4 cards: age 10 yr · walk 8 min', P ? 16 : 17, C.muted, true);
  sameTxt.moveTo([SWX, Y_BOT, 0]);
  const sameBg = new M.RoundedRectangle({ width: sameTxt.getWidth() + 0.5, height: 0.46, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
  sameBg.setFill(C.card, 0.9); sameBg.moveTo([SWX, Y_BOT, 0]);
  const sameStrip = new M.VGroup(sameBg, sameTxt);
  await until(S(4));
  await play(new M.FadeIn(sameStrip), ...say('AGE 10 yr · WALK 8 min (ALL 4)', C.muted));

  const rentA = makeRent(X40, Y_CED, '$980', C.cyan);
  await until(S(5));
  await play(new M.FadeIn(rentA), new M.Indicate(cardA, { color: C.cyan }), ...say('CEDAR 40 m²: $980', C.cyan));

  const rentE = makeRent(X50, Y_CED, '$1,060', C.cyan);
  await until(S(6));
  await play(new M.FadeIn(rentE), new M.Indicate(cardE, { color: C.cyan }), ...say('CEDAR 50 m²: $1,060', C.cyan));

  const rentD = makeRent(X40, Y_STA, '$1,020', C.amber);
  await until(S(7));
  await play(new M.FadeIn(rentD), new M.Indicate(cardD, { color: C.amber }), ...say('STATION 40 m²: $1,020', C.amber));

  const rentH = makeRent(X50, Y_STA, '$1,140', C.amber);
  await until(S(8));
  await play(new M.FadeIn(rentH), new M.Indicate(cardH, { color: C.amber }), ...say('STATION 50 m²: $1,140', C.amber));

  // --- 9-13 arrows and the two rises -----------------------------------------
  const axL = X40 + CW / 2 + 0.12, axR = X50 - CW / 2 - 0.12;
  const arrCed = makeArrow([axL, Y_CED, 0], [axR, Y_CED, 0], C.cyan, 3.5);
  const arrSta = makeArrow([axL, Y_STA, 0], [axR, Y_STA, 0], C.amber, 3.5);

  await until(S(9));
  await play(
    new M.Create(arrCed.shaft), new M.FadeIn(arrCed.tip),
    new M.Create(arrSta.shaft), new M.FadeIn(arrSta.tip),
    ...say('ONE ARROW PER ROW', C.ink)
  );

  const lblCed = T('+$80', 22, C.cyan, true, true); lblCed.moveTo([XMID, Y_CED + 0.34, 0]);
  await until(S(10));
  await play(new M.FadeIn(lblCed), new M.Indicate(arrCed.shaft, { color: C.cyan }), ...say('CEDAR RISE: +$80', C.cyan));

  const lblSta = T('+$120', 22, C.amber, true, true); lblSta.moveTo([XMID, Y_STA + 0.34, 0]);
  await until(S(11));
  await play(new M.FadeIn(lblSta), new M.Indicate(arrSta.shaft, { color: C.amber }), ...say('STATION RISE: +$120', C.amber));

  const oldCed = T('earlier: +$100', 15, C.pink, true); oldCed.moveTo([XMID, Y_CED - 0.30, 0]);
  const oldSta = T('earlier: +$100', 15, C.pink, true); oldSta.moveTo([XMID, Y_STA - 0.30, 0]);
  await until(S(12));
  await play(new M.FadeIn(oldCed), new M.FadeIn(oldSta), ...say('EARLIER RULE: +$100 FOR BOTH', C.pink));

  await until(S(13));
  await play(
    new M.FadeOut(oldCed), new M.FadeOut(oldSta), new M.FadeOut(sameStrip),
    new M.Indicate(lblCed, { color: C.green }), new M.Indicate(lblSta, { color: C.green }),
    ...say('GOAL: TWO DIFFERENT RISES', C.green)
  );

  // --- 14-16 inputs: size steps and neighborhood switch ----------------------
  const stepNoteTxt = T('1 size step = +10 m² (from 40 m²)', P ? 16 : 17, C.violet, true);
  stepNoteTxt.moveTo([SWX, Y_BOT, 0]);
  const stepNoteBg = new M.RoundedRectangle({ width: stepNoteTxt.getWidth() + 0.5, height: 0.46, cornerRadius: 0.14, color: C.violet, strokeWidth: 1.5 });
  stepNoteBg.setFill(C.card, 0.9); stepNoteBg.moveTo([SWX, Y_BOT, 0]);
  const stepNote = new M.VGroup(stepNoteBg, stepNoteTxt);

  await until(S(14));
  await play(new M.FadeIn(stepNote), ...say('SIZE STEP = +10 m² FROM 40', C.violet));

  const step0 = T('steps = 0', 17, C.violet, true, true); step0.moveTo([X40, Y_STEP, 0]);
  const step1 = T('steps = 1', 17, C.violet, true, true); step1.moveTo([X50, Y_STEP, 0]);
  await until(S(15));
  await play(new M.FadeIn(step0), new M.FadeIn(step1), ...say('40 m² → 0 STEPS · 50 m² → 1 STEP', C.violet));

  const sw0 = T('switch = 0', 16, C.cyan, true, true);
  sw0.moveTo(P ? [0.88, 0.12, 0] : [-5.68, Y_CED - 0.28, 0]);
  const sw1 = T('switch = 1', 16, C.amber, true, true);
  sw1.moveTo(P ? [0.92, -2.22, 0] : [-5.68, Y_STA - 0.28, 0]);
  await until(S(16));
  await play(new M.FadeOut(stepNote), new M.FadeIn(sw0), new M.FadeIn(sw1), ...say('SWITCH: 0 IN CEDAR, 1 IN STATION', C.amber));

  // --- 17-25 build the rule step by step -------------------------------------
  await until(S(17));
  await play(
    new M.Indicate(cardA, { color: C.cyan }),
    ...fbox(['Start (small Cedar)', ['$980', C.cyan]], C.cyan),
    ...say('START AT $980', C.cyan)
  );

  await until(S(18));
  await play(
    new M.Indicate(arrCed.shaft, { color: C.cyan }), new M.Indicate(lblCed, { color: C.cyan }),
    ...fbox(['Start:  $980', ['+ $80 × steps', C.cyan]], C.cyan),
    ...say('ADD $80 PER SIZE STEP', C.cyan)
  );

  await until(S(19));
  await play(
    new M.Indicate(cardE, { color: C.green }),
    ...fbox(['Large Cedar (steps=1)', '980 + 80 × 1', ['= $1,060  ✓', C.green]], C.green),
    ...say('980 + 80 = $1,060  ✓', C.green)
  );

  const gap40 = makeArrow([X40, Y_CED - CH / 2 - 0.05, 0], [X40, Y_STA + CH / 2 + 0.05, 0], C.amber, 3);
  const gap40Lbl = T('+$40', 18, C.amber, true, true);
  gap40Lbl.moveTo([P ? X40 - 0.70 : X40 + 0.55, Y_GAP, 0]);

  await until(S(20));
  await play(
    new M.Create(gap40.shaft), new M.FadeIn(gap40.tip), new M.FadeIn(gap40Lbl),
    new M.Indicate(sw1, { color: C.amber }),
    ...fbox(['Small Station (sw=1)', '980 + 40 × 1', ['+$40 starting gap', C.amber]], C.amber),
    ...say('SWITCH ON → +$40 STARTING GAP', C.amber)
  );

  await until(S(21));
  await play(
    new M.Indicate(cardD, { color: C.green }),
    ...fbox(['Small Station', '980 + 40', ['= $1,020  ✓', C.green]], C.green),
    ...say('980 + 40 = $1,020  ✓', C.green)
  );

  const tryTag = T('try +$80 → $1,100', 15, C.pink, true); tryTag.moveTo([XMID, Y_STA - 0.34, 0]);
  await until(S(22));
  await play(
    new M.FadeIn(tryTag),
    ...fbox(['Try Cedar rise (+$80)', '1,020 + 80', ['= $1,100', C.pink]], C.pink),
    ...say('TRY +$80 ON STATION', C.pink)
  );

  const shortTag = T('$40 short', 16, C.pink, true, true);
  shortTag.moveTo([X50, Y_STA - CH / 2 - 0.25, 0]);
  await until(S(23));
  await play(
    new M.FadeIn(shortTag), new M.Indicate(cardH, { color: C.pink }),
    ...fbox(['1,020 + 80 = $1,100', ['Card H asks  $1,140', C.amber], ['Short by     $40', C.pink]], C.pink),
    ...say('$1,100 IS $40 SHORT OF $1,140', C.pink)
  );

  await until(S(24));
  await play(
    new M.FadeOut(tryTag), new M.FadeOut(shortTag),
    new M.Indicate(lblSta, { color: C.amber }), new M.Indicate(lblCed, { color: C.cyan }),
    ...fbox(['Station rise: +$120', 'Cedar rise:   +$80', ['Difference:   +$40', C.amber]], C.amber),
    ...say('$120 − $80 = +$40 MORE', C.amber)
  );

  const extraTag = T('+$40 extra', 16, C.amber, true, true); extraTag.moveTo([XMID, Y_STA - 0.34, 0]);
  await until(S(25));
  await play(
    new M.FadeIn(extraTag),
    ...fbox(['Station extra:', ['+$40 per size step', C.amber], '(only in Station)'], C.amber),
    ...say('NEED +$40 EXTRA PER STEP', C.amber)
  );

  // --- 26-32 light switch and steps × switch ---------------------------------
  const swBoxX = SWX - 0.35, swOffX = swBoxX - 0.27, swOnX = swBoxX + 0.27, bulbX = SWX + 0.98;
  const swLbl = T('Station switch', 15, C.muted, true); swLbl.moveTo([SWX - 1.92, Y_BOT, 0]);
  const swHousing = new M.RoundedRectangle({ width: 1.05, height: 0.48, cornerRadius: 0.24, color: C.muted, strokeWidth: 2 });
  swHousing.setFill(C.card, 0.95); swHousing.moveTo([swBoxX, Y_BOT, 0]);
  const swZero = T('0', 14, C.muted, true, true); swZero.moveTo([swOffX, Y_BOT, 0]);
  const swOne = T('1', 14, C.amber, true, true); swOne.moveTo([swOnX, Y_BOT, 0]);
  const swWire = new M.Line({ start: [swBoxX + 0.54, Y_BOT, 0], end: [bulbX - 0.18, Y_BOT, 0], color: C.muted, strokeWidth: 2.5 });
  const swExtra = T('+$40 extra', 16, C.amber, true, true); swExtra.moveTo([SWX + 2.02, Y_BOT, 0]);
  const swFrame = new M.VGroup(swLbl, swHousing, swZero, swOne, swWire, swExtra);

  const knob = makeKnob(swOnX, C.amber);
  const bulb = makeBulb(bulbX, C.muted, 0.2, 0.0);

  await until(S(26));
  await play(
    new M.FadeIn(swFrame), new M.FadeIn(knob), new M.FadeIn(bulb.halo), new M.FadeIn(bulb.core),
    ...say('STATION SWITCH = LIGHT SWITCH', C.amber)
  );

  await until(S(27));
  await play(
    new M.Transform(knob, makeKnob(swOffX, C.muted)),
    ...fbox(['Switch OFF (0):', ['any number × 0 = 0', C.muted], 'extra = $0'], C.muted),
    ...say('OFF (0) CANCELS THE EXTRA', C.muted)
  );

  await until(S(28));
  await play(
    new M.Indicate(cardE, { color: C.cyan }),
    ...fbox(['Large Cedar (Card E)', 'steps = 1, switch = 0', ['1 × 0 = 0  →  +$0', C.cyan]], C.cyan),
    ...say('LARGE CEDAR: 1 × 0 = 0', C.cyan)
  );

  await until(S(29));
  await play(
    new M.Transform(knob, makeKnob(swOnX, C.amber)),
    new M.Indicate(cardD, { color: C.amber }),
    ...fbox(['Small Station (Card D)', 'steps = 0, switch = 1', ['0 × 1 = 0  →  +$0', C.amber]], C.amber),
    ...say('SMALL STATION: 0 × 1 = 0', C.amber)
  );

  const bulbLit = makeBulb(bulbX, C.green, 0.95, 0.35);
  await until(S(30));
  await play(
    new M.Transform(bulb.core, bulbLit.core), new M.Transform(bulb.halo, bulbLit.halo),
    new M.Flash(bulb.core, { color: C.green }),
    new M.Indicate(cardH, { color: C.green }),
    ...fbox(['Large Station (Card H)', 'steps = 1, switch = 1', ['1 × 1 = 1  →  ON!', C.green]], C.green),
    ...say('LARGE STATION: 1 × 1 = 1', C.green)
  );

  await until(S(31));
  await play(
    new M.Indicate(cardH, { color: C.amber }), new M.Indicate(extraTag, { color: C.amber }),
    ...fbox(['Large Station extra:', '40 × (1 × 1)', ['= +$40', C.amber]], C.amber),
    ...say('LARGE STATION GETS +$40', C.amber)
  );

  const riseSum = T('$80 + $40 = $120', 15, C.green, true, true); riseSum.moveTo([XMID, Y_STA - 0.34, 0]);
  await until(S(32));
  await play(
    new M.FadeOut(extraTag), new M.FadeIn(riseSum), new M.Indicate(lblSta, { color: C.green }),
    ...fbox(['Station rise:', '$80 + $40', ['= $120  ✓', C.green]], C.green),
    ...say('STATION RISE: $80 + $40 = $120', C.green)
  );

  // --- 33-35 naming: product, input, product term ----------------------------
  await until(S(33));
  await play(
    new M.FadeOut(swFrame), new M.FadeOut(knob), new M.FadeOut(bulb.halo), new M.FadeOut(bulb.core),
    new M.FadeOut(riseSum),
    ...fbox(['number × number', ['= PRODUCT', C.violet]], C.violet),
    ...say('MULTIPLYING → PRODUCT', C.violet)
  );

  await until(S(34));
  await play(
    new M.Indicate(step0, { color: C.violet }), new M.Indicate(step1, { color: C.violet }),
    new M.Indicate(sw0, { color: C.cyan }), new M.Indicate(sw1, { color: C.amber }),
    ...fbox(['Inputs the rule uses:', ['• size steps (0 or 1)', C.violet], ['• switch     (0 or 1)', C.amber]], C.violet),
    ...say('INPUTS = SIZE STEPS & SWITCH', C.violet)
  );

  await until(S(35));
  await play(
    ...fbox(['PRODUCT TERM:', ['40 × steps × switch', C.green], '(two inputs multiplied)'], C.green),
    ...say('PRODUCT TERM = STEPS × SWITCH', C.green)
  );

  // --- 36-41 read the full rent rule line by line ----------------------------
  const ruleLines = (c1, c2, c3, c4) => [
    ['Rent =', C.muted],
    ['  980', c1],
    ['+ 80 × steps', c2],
    ['+ 40 × switch', c3],
    ['+ 40 × steps × switch', c4]
  ];

  await until(S(36));
  await play(
    ...fbox(ruleLines(C.ink, C.ink, C.ink, C.ink), C.cyan),
    ...say('THE FULL RENT RULE', C.cyan)
  );

  await until(S(37));
  await play(
    new M.Indicate(cardA, { color: C.cyan }),
    ...fbox(ruleLines(C.cyan, C.muted, C.muted, C.muted), C.cyan),
    ...say('BASE: $980', C.cyan)
  );

  await until(S(38));
  await play(
    new M.Indicate(arrCed.shaft, { color: C.cyan }), new M.Indicate(lblCed, { color: C.cyan }),
    ...fbox(ruleLines(C.ink, C.cyan, C.muted, C.muted), C.cyan),
    ...say('+ $80 × SIZE STEPS', C.cyan)
  );

  await until(S(39));
  await play(
    new M.Indicate(gap40.shaft, { color: C.amber }), new M.Indicate(gap40Lbl, { color: C.amber }),
    ...fbox(ruleLines(C.ink, C.ink, C.amber, C.muted), C.amber),
    ...say('+ $40 × STATION SWITCH', C.amber)
  );

  await until(S(40));
  await play(
    new M.Indicate(cardH, { color: C.green }),
    ...fbox(ruleLines(C.ink, C.ink, C.ink, C.green), C.green),
    ...say('+ $40 × STEPS × SWITCH', C.green)
  );

  const checkPos = [[X40, Y_CED], [X50, Y_CED], [X40, Y_STA], [X50, Y_STA]];
  const checks = checkPos.map(([cx, cy]) => {
    const t = T('✓', 19, C.green, true, true);
    t.moveTo([cx + CW / 2 - 0.24, cy + CH / 2 - 0.25, 0]);
    return t;
  });

  await until(S(41));
  await play(
    new M.LaggedStart(checks.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.0 }),
    new M.LaggedStart([cardA, cardE, cardD, cardH].map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox(ruleLines(C.ink, C.cyan, C.amber, C.green), C.green),
    ...say('MATCHES ALL 4 RENTS ✓', C.green)
  );

  // --- 42-46 what it is for, the trap, and recap -----------------------------
  await until(S(42));
  await play(
    ...checks.map(c => new M.FadeOut(c)),
    new M.Indicate(lblCed, { color: C.cyan }), new M.Indicate(lblSta, { color: C.amber }),
    ...say('ONE CHANGE DEPENDS ON ANOTHER', C.violet)
  );

  await until(S(43));
  await play(
    new M.Indicate(gap40.shaft, { color: C.pink }), new M.Indicate(gap40Lbl, { color: C.pink }),
    ...fbox(['TRAP: Watch the gap!', ['At 40 m²: gap = $40', C.amber], '(only at 40 m²)'], C.pink),
    ...say('TRAP: $40 GAP ONLY AT 40 m²', C.pink)
  );

  const gap50 = makeArrow([X50, Y_CED - CH / 2 - 0.05, 0], [X50, Y_STA + CH / 2 + 0.05, 0], C.pink, 3);
  await until(S(44));
  await play(
    new M.Create(gap50.shaft), new M.FadeIn(gap50.tip),
    new M.Indicate(cardE, { color: C.pink }), new M.Indicate(cardH, { color: C.pink }),
    ...fbox(['At 50 m²:', '1,140 − 1,060', ['= ?', C.pink]], C.pink),
    ...say('AT 50 m²: $1,140 − $1,060', C.pink)
  );

  const gap50Lbl = T('+$80', 18, C.pink, true, true);
  gap50Lbl.moveTo([P ? X50 + 0.70 : X50 + 0.55, Y_GAP, 0]);
  await until(S(45));
  await play(
    new M.FadeIn(gap50Lbl), new M.Indicate(gap50Lbl, { color: C.pink }),
    ...fbox(['At 40 m²: gap = $40', ['At 50 m²: gap = $80', C.pink], '1,140 − 1,060 = 80'], C.pink),
    ...say('AT 50 m²: STATION GAP = $80', C.pink)
  );

  await until(S(46));
  await play(
    new M.Indicate(lblCed, { color: C.cyan }), new M.Indicate(lblSta, { color: C.amber }),
    ...fbox(ruleLines(C.ink, C.cyan, C.amber, C.green), C.cyan),
    ...say('A SLOPE FOR EACH NEIGHBORHOOD', C.green)
  );
}
