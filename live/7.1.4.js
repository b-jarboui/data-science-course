// 7.1.4 One- and two-sided tests (live lesson). Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared data (chapters/7.1.md): z = +2 (502 g, standard error 1 g). Two-sided 5 in 100: 2.5 in each tail,
// cut-offs ±1.96. One-sided: all 5 in one tail, cut-off 1.645 (about 1.64). Right tail beyond +2 = 0.0228,
// area below +2 = 0.977, two-sided p = 0.0455. Picking the side after looking: false alarms 5 -> 10 in 100.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.62, 0] : [4.3, -0.3, 0];
  const BASE = P ? -3.4 : -1.85, H = P ? 2.65 : 2.18, ZW = P ? 7.0 : 7.1, ZLO = -4.5, ZHI = 4.5;
  const zx = z => CX - ZW / 2 + (z - ZLO) / (ZHI - ZLO) * ZW;
  const dens = z => Math.exp(-z * z / 2), cy = z => BASE + H * dens(z);
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const signed = v => v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
  const INSP = C.amber, CONS = C.pink;

  // primitives
  function txt(s, size, color, x, y, mono = false, maxw = FW - 1) {
    const t = T(s, size, color, mono);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo([x, y, 0]); return t;
  }
  const line = (x1, y1, x2, y2, color = C.muted, sw = 2) => new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: sw });
  const dashed = (x1, y1, x2, y2, color = C.muted) => new M.DashedLine({ start: [x1, y1, 0], end: [x2, y2, 0], color });
  function arrow(x1, y1, x2, y2, color = C.cyan, sw = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1), hl = 0.17, d = Math.PI / 6;
    return new M.VGroup(line(x1, y1, x2, y2, color, sw),
      line(x2, y2, x2 - hl * Math.cos(a - d), y2 - hl * Math.sin(a - d), color, sw),
      line(x2, y2, x2 - hl * Math.cos(a + d), y2 - hl * Math.sin(a + d), color, sw));
  }
  function glowDot(x, y, color = C.cyan, r = 0.1) {
    const halo = new M.Dot({ point: [x, y, 0], radius: r * 2.1, color }); halo.setFill(color, 0.15);
    const d = new M.Dot({ point: [x, y, 0], radius: r, color }); d.setFill(color, 1);
    return new M.VGroup(halo, d);
  }
  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size), maxw = P ? FW - 1 : 7.0;
    if (p.getWidth() > maxw) p.scale(maxw / p.getWidth());
    p.moveTo([x, y, 0]); return p;
  }

  // layers: each key holds one on-screen group
  const layers = new Map();
  const put = (k, o) => { const a = []; if (layers.has(k)) a.push(new M.FadeOut(layers.get(k))); layers.set(k, o); a.push(new M.FadeIn(o)); return a; };
  const drop = (...ks) => ks.filter(k => layers.has(k)).map(k => { const o = layers.get(k); layers.delete(k); return new M.FadeOut(o); });
  const keep = (...ks) => drop(...[...layers.keys()].filter(k => !ks.includes(k)));
  const ind = (k, c = C.amber) => layers.has(k) ? [new M.Indicate(layers.get(k), { color: c })] : [];

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
    const k = Math.min(1, (P ? FW - 1.2 : 4.0) / wd, (P ? 1.85 : 3.5) / ht);
    if (k < 1) { g.scale(k); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // the hill of z for a perfect machine
  function area(lo, hi, color, op) {
    const parts = [], n = Math.max(12, Math.ceil((hi - lo) * 18)), st = (hi - lo) / n;
    for (let i = 0; i < n; i++) {
      const mid = lo + st * (i + 0.5), hh = Math.max(0.002, H * dens(mid));
      const r = new M.Rectangle({ width: st * ZW / (ZHI - ZLO) * 1.005, height: hh, color, strokeWidth: 0 });
      r.setFill(color, op); r.moveTo([zx(mid), BASE + hh / 2, 0]); parts.push(r);
    }
    return new M.VGroup(...parts);
  }
  function hill() {
    const parts = [area(ZLO, ZHI, C.cyan, 0.13)];
    for (let i = 0; i < 120; i++) {
      const a = ZLO + (ZHI - ZLO) * i / 120, b = ZLO + (ZHI - ZLO) * (i + 1) / 120;
      parts.push(line(zx(a), cy(a), zx(b), cy(b), C.cyan, 2.8));
    }
    parts.push(line(zx(ZLO), BASE, zx(ZHI), BASE, C.muted, 2.5));
    for (let v = -4; v <= 4; v++) parts.push(line(zx(v), BASE - 0.075, zx(v), BASE + 0.075, C.muted), txt(signed(v), P ? 16 : 18, C.muted, zx(v), BASE - 0.3, true));
    parts.push(txt('z: standard errors from 500 g', 17, C.muted, CX, BASE - 0.74, false, ZW),
      line(zx(0), BASE, zx(0), BASE + H + 0.08, C.amber, 3));
    return new M.VGroup(...parts);
  }
  const shade = (lo, hi, color = C.amber, op = 0.8) => area(Math.max(lo, ZLO), Math.min(hi, ZHI), color, op);
  const tailTag = (side, s, color) => tag(s, color, zx(side * 3.45), BASE + 0.62, 18);
  const cut = (z, color, label, f = 0.55, dx = 0) => new M.VGroup(dashed(zx(z), BASE, zx(z), BASE + H * f, color),
    txt(label, P ? 20 : 18, color, zx(z) + dx, BASE + H * f + (dx ? 0.1 : 0.24), true));
  const marker = z => new M.VGroup(line(zx(z), BASE, zx(z), BASE + H * 0.72, C.green, 3), glowDot(zx(z), cy(z), C.green, 0.1),
    tag(`OUR z = ${signed(z)}`, C.green, zx(z), BASE + H * 0.72 + 0.28, 17));
  function watch(sides) {
    const y = BASE + H * 0.75, parts = [];
    for (const s of sides) parts.push(arrow(zx(s * 1.1), y, zx(s * 3.6), y, C.cyan, 3), txt(s > 0 ? 'HIGH' : 'LOW', 18, C.cyan, zx(s * 2.6), y + 0.27, true));
    return new M.VGroup(...parts);
  }

  // the false-alarm budget: 5 blocks of 1 in 100, each cut in two halves
  const BUDY = BASE + H + 0.75, BX = CX + 0.2;
  function budget() {
    const halves = [];
    for (let i = 0; i < 10; i++) {
      const b = new M.Rectangle({ width: 0.2, height: 0.4, color: C.amber, strokeWidth: 1 });
      b.setFill(C.amber, 0.85); b.moveTo([BX + Math.floor(i / 2) * 0.46 + (i % 2) * 0.21, BUDY, 0]); halves.push(b);
    }
    return { halves, label: txt('BUDGET: 5 IN 100', 18, C.amber, CX - 1.5, BUDY, true, 2.6) };
  }
  function half(x, y) { const b = new M.Rectangle({ width: 0.2, height: 0.4, color: C.amber, strokeWidth: 1 }); b.setFill(C.amber, 0.85); b.moveTo([x, y, 0]); return b; }

  // people and the machine
  const PY = P ? -1.7 : -0.9, PX = P ? 2.3 : 2.7;
  function person(x, color, who) {
    const head = new M.Circle({ radius: 0.18, color }); head.setFill(color, 1); head.moveTo([x, PY + 0.44, 0]);
    const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, PY, 0]);
    return new M.VGroup(head, body, txt(who, 17, color, x, PY - 0.5, true, P ? 2.6 : 3.0));
  }
  function question(x, who, q, color) {
    const r = new M.RoundedRectangle({ width: 2.3, height: 0.56, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, PY + 1.25, 0]);
    return new M.VGroup(r, txt(q, 18, color, x, PY + 1.25, true, 2.0));
  }
  function machine() {
    const body = new M.RoundedRectangle({ width: 0.62, height: 1.1, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
    body.setFill(C.card, 0.9); body.moveTo([CX, PY + 0.2, 0]);
    const juice = new M.RoundedRectangle({ width: 0.5, height: 0.78, cornerRadius: 0.08, color: C.cyan, strokeWidth: 1 });
    juice.setFill(C.cyan, 0.6); juice.moveTo([CX, PY + 0.1, 0]);
    const cap = new M.Rectangle({ width: 0.34, height: 0.16, color: C.cyan, strokeWidth: 1 });
    cap.setFill(C.cyan, 0.95); cap.moveTo([CX, PY + 0.85, 0]);
    return new M.VGroup(body, juice, cap, txt('label: 500 g', 17, C.amber, CX, PY + 1.25, true, 1.6));
  }
  function scaleBox() {
    const r = new M.RoundedRectangle({ width: 1.5, height: 0.5, cornerRadius: 0.1, color: C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, PY - 0.85, 0]);
    return new M.VGroup(r, txt('? g', 19, C.amber, CX, PY - 0.85, true));
  }

  // 0-1 the old alternative: up or down
  const gx = g => CX - ZW / 2 + (g - 497) / 6 * ZW, RY = P ? -2.4 : -1.2;
  function ruler() {
    const parts = [line(gx(497), RY, gx(503), RY, C.muted, 2.5)];
    for (let g = 497; g <= 503; g++) parts.push(line(gx(g), RY - 0.07, gx(g), RY + 0.07, C.muted), txt(String(g), P ? 16 : 18, C.muted, gx(g), RY - 0.3, true));
    parts.push(txt('batch mean (grams)', 17, C.muted, CX, RY - 0.72), line(gx(500), RY, gx(500), RY + 1.5, C.amber, 3), tag('500 g', C.amber, gx(500), RY + 1.78, 17));
    return new M.VGroup(...parts);
  }
  const dirArrow = (s, color) => new M.VGroup(arrow(gx(500) + s * 0.12, RY + 0.75, gx(500 + s * 2.6), RY + 0.75, color, 4),
    txt(s > 0 ? 'UP' : 'DOWN', 19, color, gx(500 + s * 1.5), RY + 1.05, true));

  await until(S(0)); await play(...put('ruler', ruler()), ...put('down', dirArrow(-1, C.violet)), ...put('up', dirArrow(1, C.violet)),
    ...fbox(['alternative so far:', ['drifted UP or DOWN', C.violet]], C.violet), ...say('SO FAR: UP OR DOWN', C.violet));
  await until(S(1)); await play(new M.Transform(layers.get('down'), dirArrow(-1, C.muted)), ...ind('up', C.amber), ...say('SOMETIMES ONLY ONE DIRECTION MATTERS', C.amber));

  // 2-5 two people, one machine
  await until(S(2)); await play(...keep(), ...put('machine', machine()), ...put('insp', person(CX - PX, INSP, 'INSPECTOR')), ...put('cons', person(CX + PX, CONS, 'CONSUMER OFFICE')),
    ...say('TWO PEOPLE, ONE MACHINE'));
  await until(S(3)); await play(...put('inspQ', question(CX - PX, 'INSPECTOR', '↑ TOO MUCH?', INSP)),
    ...fbox(['inspector: overfilling', 'wastes juice and money', ['asks only: too much?', INSP]], INSP), ...say('INSPECTOR: FILLING TOO MUCH?', INSP));
  await until(S(4)); await play(...put('consQ', question(CX + PX, 'CONSUMER OFFICE', '↓ TOO LITTLE?', CONS)),
    ...fbox(['consumer office: underfilling', 'cheats shoppers', ['asks only: too little?', CONS]], CONS), ...say('CONSUMER OFFICE: TOO LITTLE?', CONS));
  await until(S(5)); await play(...put('scale', scaleBox()), ...ind('inspQ', INSP), ...ind('consQ', CONS), ...say('QUESTIONS WRITTEN BEFORE WEIGHING', C.green));

  // 6-8 the hill and the false-alarm budget
  await until(S(6)); await play(...keep(), ...put('hill', hill()),
    ...fbox(['perfect machine:', 'z lands near 0', ['far out = rare', C.violet]]), ...say('THE HILL OF z FOR A PERFECT MACHINE'));
  await until(S(7)); await play(...fbox(['significance level', ['5 in 100 = 0.05', C.amber]], C.amber), ...say('SIGNIFICANCE LEVEL: 5 IN 100', C.amber));
  let B = budget();
  await until(S(8)); await play(new M.LaggedStart(B.halves.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.2 }), new M.FadeIn(B.label),
    ...fbox(['false-alarm budget', ['5 in 100', C.amber], 'where do we spend it?'], C.amber), ...say('A FIXED BUDGET FOR FALSE ALARMS', C.amber));

  // 9-11 two-sided: split the budget
  await until(S(9)); await play(...put('arr', watch([-1, 1])), ...say('TWO-SIDED: WATCH BOTH DIRECTIONS'));
  await until(S(10));
  await play(...drop('arr'), new M.LaggedStart(B.halves.map((b, i) => new M.Transform(b, i < 5 ? half(zx(-3.45) + (i - 2) * 0.22, BASE + 0.5) : half(zx(3.45) + (i - 7) * 0.22, BASE + 0.5), { pathArc: -0.6 })), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox(['5%', ['= 2.5% left + 2.5% right', C.amber]], C.amber), ...say('SPLIT: 2.5% LEFT, 2.5% RIGHT', C.amber));
  await play(new M.FadeOut(new M.VGroup(...B.halves, B.label)), ...put('sL', shade(ZLO, -1.96)), ...put('sR', shade(1.96, ZHI)),
    ...put('tL', tailTag(-1, '2.5%', C.amber)), ...put('tR', tailTag(1, '2.5%', C.amber)));
  await until(S(11)); await play(...put('cL', cut(-1.96, C.amber, '−1.96')), ...put('cR', cut(1.96, C.amber, '+1.96')),
    ...fbox(['two-sided cut-offs', ['about −1.96 and +1.96', C.amber], 'read from the curve'], C.amber), ...say('CUT-OFFS: ABOUT ±1.96', C.amber));

  // 12-14 one-sided: the whole budget in one tail
  B = budget();
  await until(S(12)); await play(...keep('hill'), ...put('arr', watch([1])), new M.LaggedStart(B.halves.map(b => new M.FadeIn(b)), { lagRatio: 0.06, runTime: 0.8 }), new M.FadeIn(B.label),
    ...say('ONE-SIDED: WATCH ONE DIRECTION'));
  await until(S(13));
  await play(...drop('arr'), new M.LaggedStart(B.halves.map((b, i) => new M.Transform(b, half(zx(3.45) + (i % 5 - 2) * 0.22, BASE + 0.45 + Math.floor(i / 5) * 0.44), { pathArc: -0.6 })), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['one-sided', ['all 5% in one tail', C.amber]], C.amber), ...say('ALL 5% GOES INTO ONE TAIL', C.amber));
  await play(new M.FadeOut(new M.VGroup(...B.halves, B.label)), ...put('sR', shade(1.645, ZHI)), ...put('tR', tailTag(1, '5%', C.amber)));
  await until(S(14)); await play(...put('cOld', cut(1.96, C.muted, '1.96', 0.62, 0.42)), ...put('cR', cut(1.645, C.amber, '+1.64', 0.95, 0.48)),
    ...fbox(['two-sided: 1.96', ['one-sided: about 1.64', C.amber], 'closer to the middle'], C.amber), ...say('CUT-OFF MOVES IN: ABOUT 1.64', C.amber));

  // 15-18 our batch, the inspector's question
  await until(S(15)); await play(...keep('hill'), ...put('mk', marker(2)),
    ...fbox(['502 − 500 = +2 g', 'standard error = 1 g', ['z = +2 (above target)', C.green]], C.green), ...say('OUR BATCH: z = +2', C.green));
  await until(S(16)); await play(...put('sR', shade(2, ZHI, C.violet)), ...say('INSPECTOR “TOO MUCH?”: RIGHT OF +2', INSP));
  await until(S(17)); await play(...put('tR', tailTag(1, '2.3%', C.violet)),
    ...fbox(['inspector, one-sided:', 'p = right tail', ['≈ 0.023 (2.3%)', C.violet]], C.violet), ...say('HER p ≈ 0.023', C.violet));
  await until(S(18)); await play(...ind('tR', C.green), ...fbox(['0.023 < 0.05', ['evidence of overfilling', C.green]], C.green), ...say('EVIDENCE OF OVERFILLING', C.green));

  // 19-21 the consumer office's question
  const lowArrow = () => new M.VGroup(arrow(zx(1.2), BASE + H + 0.3, zx(-3), BASE + H + 0.3, CONS, 3), txt('LOW RESULTS COUNT', 17, CONS, zx(-1), BASE + H + 0.55, true));
  await until(S(19)); await play(...drop('sR', 'tR'), ...put('arr', lowArrow()), ...put('sL', shade(ZLO, 2, C.violet, 0.6)),
    ...say('CONSUMER OFFICE “TOO LITTLE?”: BELOW +2', CONS));
  await until(S(20)); await play(...put('t98', tag('≈ 98%', C.violet, zx(-3.2), BASE + H * 0.5, 18)),
    ...fbox(['consumer office, one-sided:', 'p = area below +2', ['≈ 0.98 (98%)', C.violet]], C.violet), ...say('HIS p ≈ 0.98', C.violet));
  await until(S(21)); await play(...ind('mk', C.green), ...fbox(['0.98 > 0.05', ['no evidence of underfilling', C.muted]], C.muted), ...say('ABOVE TARGET: NO EVIDENCE OF UNDERFILLING', CONS));

  // 22-26 the two-sided p, and the rule that links them
  await until(S(22)); await play(...drop('arr', 't98'), ...put('sL', shade(ZLO, -2, C.violet)), ...put('sR', shade(2, ZHI, C.violet)),
    ...put('tL', tailTag(-1, '2.3%', C.violet)), ...put('tR', tailTag(1, '2.3%', C.violet)),
    ...fbox(['two-sided:', '2.3% + 2.3%', ['≈ 4.6% (p ≈ 0.046)', C.violet]], C.violet), ...say('TWO-SIDED: BOTH TAILS COUNT', C.violet));
  await until(S(23)); await play(...fbox(['too much?    p ≈ 0.023', 'too little?  p ≈ 0.98', ['either way?  p ≈ 0.046', C.violet]], C.violet),
    ...say('SAME DATA, 3 QUESTIONS, 3 p-VALUES', C.amber));
  await until(S(23) + 3.2); await play(...say('THE QUESTION DECIDES WHICH TAIL COUNTS', C.amber));
  await until(S(24)); await play(...ind('tL', C.violet), ...ind('tR', C.violet),
    ...fbox(['two-sided p = left + right', ['one-sided p = chosen tail', C.amber]]), ...say('IN SHORT'));
  const mirror = () => new M.VGroup(arrow(zx(0) - 0.06, BASE + H + 0.3, zx(-2), BASE + H + 0.3, C.amber, 3),
    arrow(zx(0) + 0.06, BASE + H + 0.3, zx(2), BASE + H + 0.3, C.amber, 3), txt('MIRROR IMAGES', 16, C.amber, zx(0), BASE + H + 0.55, true));
  await until(S(25)); await play(...put('arr', mirror()), ...fbox(['two-sided p', ['= 2 × smaller one-sided p', C.violet]], C.violet),
    ...say('SAME SHAPE ON BOTH SIDES', C.amber));
  await until(S(26)); await play(...drop('arr'), ...ind('tR', C.violet), ...fbox(['2 × 2.3%', ['≈ 4.6%', C.violet]], C.violet), ...say('2.3% DOUBLED ≈ 4.6%', C.violet));

  // 27-29 what it is for, and the default
  await until(S(27)); await play(...keep('hill'), ...put('sR', shade(1.96, ZHI)), ...put('band', shade(1.645, 1.96, C.green, 0.9)),
    ...put('cOld', cut(1.96, C.muted, '1.96', 0.62, 0.42)), ...put('cR', cut(1.645, C.green, '+1.64', 0.95, 0.48)),
    ...fbox(['one-sided bar: 1.64', 'two-sided bar: 1.96', ['lower bar: caught sooner', C.green]], C.green), ...say('WHAT FOR: CATCHES YOUR DIRECTION MORE EASILY', C.green));
  const ignored = () => new M.VGroup(arrow(zx(-1.2), BASE + H * 0.75, zx(-3.8), BASE + H * 0.75, C.muted, 3),
    txt('OTHER SIDE IGNORED', 16, C.muted, zx(-2.5), BASE + H * 0.75 + 0.27, true, ZW * 0.4));
  await until(S(28)); await play(...put('arr', ignored()), ...fbox(['only if the other side', 'truly does not matter', ['say so BEFORE the data', C.amber]], C.amber),
    ...say('ONLY IF THE OTHER SIDE TRULY DOESN’T MATTER', C.amber));
  await until(S(29)); await play(...keep('hill'), ...put('sL', shade(ZLO, -1.96)), ...put('sR', shade(1.96, ZHI)),
    ...put('tL', tailTag(-1, '2.5%', C.amber)), ...put('tR', tailTag(1, '2.5%', C.amber)),
    ...put('cL', cut(-1.96, C.amber, '−1.96')), ...put('cR', cut(1.96, C.amber, '+1.96')),
    ...fbox(['the usual default:', ['two-sided', C.green], '2.5% + 2.5%'], C.green), ...say('IN DOUBT: TWO-SIDED (THE DEFAULT)', C.green));

  // 30-34 the trap: pick the side after looking
  await until(S(30)); await play(...keep('hill'), ...put('mk', marker(2)), ...put('arr', arrow(zx(2.4), BASE + H * 0.3, zx(4.1), BASE + H * 0.3, CONS, 3)),
    ...fbox(['look first: z = +2', ['then pick: “too much?”', CONS]], CONS), ...say('TRAP: LOOK FIRST, THEN PICK THE SIDE', CONS));
  await until(S(31)); await play(...drop('arr'), ...put('sR', shade(2, ZHI, C.violet)), ...put('tR', tailTag(1, '2.3%', C.violet)),
    ...fbox(['honest two-sided p ≈ 0.046', ['after peeking: p ≈ 0.023', CONS], 'the p-value is halved'], CONS), ...say('THAT QUIETLY HALVES THE p-VALUE', CONS));
  const drift = z => glowDot(zx(z), BASE + 0.14, C.cyan, 0.1);
  await until(S(32)); await play(...keep('hill'), ...put('dot', drift(1.2)), ...put('sR', shade(1.645, ZHI)), ...put('tR', tailTag(1, '5%', C.amber)),
    ...fbox(['perfect machine', 'z lands right:', ['right tail gets all 5%', C.amber]], C.amber), ...say('PERFECT MACHINE: SIDE PICKED AFTER LOOKING', CONS));
  await until(S(32) + 3.0); await play(new M.Transform(layers.get('dot'), drift(-1.2)), ...put('sL', shade(ZLO, -1.645)), ...put('tL', tailTag(-1, '5%', C.amber)),
    ...fbox(['perfect machine', 'z lands left:', ['left tail gets all 5%', C.amber]], C.amber));
  await until(S(33)); await play(...drop('dot'), ...ind('sL', CONS), ...ind('sR', CONS),
    ...fbox(['alarm zone left: 5%', 'alarm zone right: 5%'], CONS), ...say('ALARMS FROM BOTH TAILS, 5% EACH', CONS));
  await until(S(34)); await play(...fbox(['5% + 5% = 10%', ['real false alarms: 10 in 100', CONS], 'report still says: 5'], CONS),
    ...say('FALSE ALARMS DOUBLE: 5 → 10 IN 100', CONS));

  // 35-37 choose in advance; next; recap
  await until(S(35)); await play(...keep('hill'), ...fbox(['before the data, write:', 'the null, the alternative', ['and the side', C.amber]], C.amber),
    ...say('CHOOSE THE SIDE IN ADVANCE', C.amber));
  await until(S(36)); await play(...put('sL', shade(ZLO, -1.96, C.muted, 0.7)), ...put('sR', shade(1.96, ZHI, C.muted, 0.7)),
    ...say('NEXT: A CLOSER LOOK AT FALSE ALARMS', C.muted));
  await until(S(37)); await play(...keep('hill'), ...put('sR', shade(1.645, ZHI)), ...put('tR', tailTag(1, '5%', C.amber)), ...put('cR', cut(1.645, C.amber, '+1.64', 0.95, 0.48)),
    ...fbox(['one-sided test:', 'all 5% on one side', ['side chosen before the data', C.amber]], C.amber), ...say('ONE SIDE, ALL 5%, CHOSEN FIRST', C.amber));
}
