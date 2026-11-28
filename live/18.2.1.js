// 18.2.1 Latent-variable generators: from hidden numbers to new shapes.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.9, 0] : [CX, 1.85, 0];
  let BOXP = P ? [0, -3.5, 0] : [4.6, 0.6, 0];
  const LS = P ? 18 : 16;   // small labels (phone: 18)
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const fade = o => new M.FadeIn(o, { runTime: 0.4 });
  const out = o => new M.FadeOut(o, { runTime: 0.4 });
  const mark = (o, c = C.amber) => new M.Indicate(o, { color: c, runTime: 0.6 });
  const txt = (s, size, color, x, y, mono = false) => T(s, size, color, mono).moveTo([x, y, 0]);
  const fmt = v => v < 0 ? '−' + Math.abs(v) : String(v);
  const cascade = (a, rt = 0.9) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  const flow = (N, l, col = C.amber) => new M.LaggedStart(N.edges[l].flat().map(e => new M.Indicate(e, { color: col, runTime: 0.5 })), { lagRatio: 0.15, runTime: 0.9 });

  // formula box
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.39, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.2 : 3.6;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // pottery silhouette: measurements m = [bottom, middle, rim] at heights 0, 2, 4
  function potLines(m, bx, by, u, color, width = 3) {
    const R = m.map((v, k) => [bx + v * u, by + 2 * k * u, 0]);
    const Lp = m.map((v, k) => [bx - v * u, by + 2 * k * u, 0]);
    const ln = (a, b) => new M.Line({ start: a, end: b, color, strokeWidth: width });
    return [ln(Lp[0], R[0]), ln(R[0], R[1]), ln(R[1], R[2]), ln(Lp[2], R[2]), ln(Lp[0], Lp[1]), ln(Lp[1], Lp[2])];
  }
  const pot = (m, bx, by, u, color = C.cyan, width = 3) => ({ lines: potLines(m, bx, by, u, color, width), m, bx, by, u });
  function morph(p, m, bx = p.bx, by = p.by, u = p.u, color = C.amber, width = 3) {
    const tl = potLines(m, bx, by, u, color, width);
    Object.assign(p, { m, bx, by, u });
    return p.lines.map((l, i) => new M.Transform(l, tl[i], { runTime: 0.8 }));
  }

  // slider for the hidden number, from -1 to 1
  function slider(cx, cy, w, v0, caption, capPos) {
    const x = v => cx + v * w / 2;
    const s = { x, cy, v: v0 };
    s.line = new M.Line({ start: [x(-1), cy, 0], end: [x(1), cy, 0], color: C.violet, strokeWidth: 3 });
    s.ticks = [-1, 0, 1].flatMap(v => [new M.Line({ start: [x(v), cy - 0.09, 0], end: [x(v), cy + 0.09, 0], color: C.muted, strokeWidth: 2 }),
      txt(fmt(v), LS, C.muted, x(v), cy - 0.36, true)]);
    s.capPos = capPos;
    s.cap = txt(caption, LS, C.violet, capPos[0], capPos[1]);
    s.knob = new M.Dot({ point: [x(v0), cy, 0], radius: 0.13, color: C.violet });
    s.lab = txt(fmt(v0), 18, C.violet, x(v0), cy + 0.38, true);
    s.all = () => [s.line, ...s.ticks, s.cap, s.knob, s.lab].filter(Boolean);
    return s;
  }
  function knobTo(s, v) {
    const d = new M.Dot({ point: [s.x(v), s.cy, 0], radius: 0.13, color: C.violet });
    const lab = txt(fmt(v), 18, C.violet, s.x(v), s.cy + 0.38, true);
    const a = [new M.Transform(s.knob, d, { runTime: 0.7 }), fade(lab)];
    if (s.lab) a.push(out(s.lab));
    s.lab = lab; s.v = v; return a;
  }
  function capTo(s, caption) {
    const c = txt(caption, LS, C.violet, s.capPos[0], s.capPos[1]);
    const a = [out(s.cap), fade(c)]; s.cap = c; return a;
  }

  // ---- 0-3 the studio's four shapes
  const DATA = [['B1', 'bowl', [1, 3, 4]], ['B2', 'bowl', [2, 3, 5]], ['V1', 'vase', [1, 3, 2]], ['V2', 'vase', [2, 4, 1]]];
  const GU = P ? 0.38 : 0.32;
  const gpos = k => P ? [-0.6, 1.75 - k * 2.3] : [(k - 1.5) * 3.2, -1.4];
  const gal = DATA.map(([, , m], k) => pot(m, gpos(k)[0], gpos(k)[1], GU, C.cyan));
  const gnames = DATA.map(([n, f], k) => P ? txt(`${n} ${f}`, 18, C.muted, 2.85, gpos(k)[1] + 0.75)
    : txt(`${n} ${f}`, 15, C.muted, gpos(k)[0], gpos(k)[1] - 0.35));
  const rimHi = DATA.map(([, , m], k) => {
    const [x, y] = gpos(k);
    return new M.Line({ start: [x - m[2] * GU, y + 4 * GU, 0], end: [x + m[2] * GU, y + 4 * GU, 0], color: C.amber, strokeWidth: 7 });
  });

  await until(S(0));
  await play(cascade(gal.map(p => new M.LaggedStart(p.lines.map(l => new M.Create(l)), { lagRatio: 0.1 })), 2.0),
    ...say('A SMALL POTTERY STUDIO'));

  await until(S(1));
  await play(cascade(gnames.map(fade), 1.2), ...say('4 SHAPES: 2 BOWLS, 2 VASES'));

  await until(S(2));
  await play(fade(rimHi[0]), fade(rimHi[1]), ...say('BOWLS: WIDE OPENING', C.amber));
  await until(S(2) + 2.1);
  await play(fade(rimHi[2]), fade(rimHi[3]), ...say('VASES: NARROW OPENING', C.amber));

  await until(S(3));
  await play(...rimHi.map(out), ...say('NEW SHAPES FROM WHAT THEY SHARE?', C.amber));

  await until(S(4));
  await play(...say('FIRST: DESCRIBE EACH SHAPE WITH NUMBERS'));

  // ---- 5-11 measure bowl B1
  const AX = P ? 0.2 : CX, AY = P ? -1.3 : -2.5, AU = P ? 0.64 : 0.55;
  const ghost = gal[0];
  const yk = k => AY + 2 * k * AU;
  const centre = new M.DashedLine({ start: [AX, AY - 0.3, 0], end: [AX, AY + 4 * AU + 0.4, 0], color: C.muted });
  // phone: the collection stays as a small row at the bottom while we measure
  const RP = k => [(k - 1.5) * 1.9, -5.7];
  const row = P ? DATA.map(([, , m], k) => pot(m, RP(k)[0], RP(k)[1], 0.17, C.cyan, 2)) : [];
  const rowN = P ? DATA.map(([n], k) => txt(n, 17, C.muted, RP(k)[0], RP(k)[1] - 0.3)) : [];
  const rowCap = P ? txt('the collection', 18, C.muted, 0, -4.55) : null;
  await until(S(5));
  await play(out(new M.VGroup(...gal.slice(1).flatMap(p => p.lines), ...gnames)),
    ...morph(ghost, [1, 3, 4], AX, AY, AU, C.muted, 2), new M.Create(centre),
    ...row.flatMap(p => p.lines.map(fade)), ...rowN.map(fade), ...(rowCap ? [fade(rowCap)] : []), ...say('BOWL B1  ·  CENTRE LINE'));

  let meas = [1, 3, 4];
  const mLine = (k, v) => new M.Line({ start: [AX, yk(k), 0], end: [AX + v * AU, yk(k), 0], color: C.ink, strokeWidth: 2 });
  const mDot = (k, v) => new M.Dot({ point: [AX + v * AU, yk(k), 0], radius: 0.07, color: C.ink });
  const mNum = (k, v, c = C.ink) => txt(fmt(v), P ? 20 : 20, c, AX + v * AU + 0.32, yk(k), true);
  const mLines = meas.map((v, k) => mLine(k, v)), mDots = meas.map((v, k) => mDot(k, v));
  const nameX = AX - 4 * AU - (P ? 0.7 : 0.9);
  let names = ['bottom', 'middle', 'top'].map((s, k) => txt(s, LS, C.muted, nameX, yk(k)));

  await until(S(6));
  await play(new M.Create(mLines[1]), fade(mDots[1]), ...say('DISTANCE: CENTRE LINE → RIGHT EDGE'));

  await until(S(7));
  await play(new M.Create(mLines[0]), new M.Create(mLines[2]), fade(mDots[0]), fade(mDots[2]),
    cascade(names.map(fade), 0.8), ...say('3 MEASUREMENTS: BOTTOM, MIDDLE, TOP'));

  await until(S(8));
  const rimName = txt('rim', LS, C.amber, nameX, yk(2));
  await play(out(names[2]), fade(rimName), ...say('TOP EDGE = RIM', C.amber));
  names[2] = rimName;

  let nums = meas.map((v, k) => mNum(k, v));
  await until(S(9));
  await play(cascade(nums.map(fade), 0.8), ...fbox(['bottom = 1', 'middle = 3', ['rim    = 4', C.cyan]]), ...say('BOWL B1:  1,  3,  4'));

  const BIG = pot([1, 3, 4], AX, AY, AU, C.cyan, 3);
  await until(S(10));
  await play(new M.Create(BIG.lines[1]), new M.Create(BIG.lines[2]), ...say('CONNECT THE 3 POINTS'));

  await until(S(11));
  await play(new M.Create(BIG.lines[4]), new M.Create(BIG.lines[5]), new M.Create(BIG.lines[0]), new M.Create(BIG.lines[3]),
    ...say('SAME LINES ON THE LEFT'));

  // ---- 12-15 vase V1 next to the bowl's outline
  function rimShape(v, color) {
    const a = morph(BIG, [1, 3, v], AX, AY, AU, color, 3);
    a.push(new M.Transform(mLines[2], mLine(2, v), { runTime: 0.8 }), new M.Transform(mDots[2], mDot(2, v), { runTime: 0.8 }));
    return a;
  }
  function rimNum(v, c = C.ink) {
    const n = mNum(2, v, c); const a = [out(nums[2]), fade(n)]; nums[2] = n; return a;
  }
  await until(S(12));
  await play(...rimShape(2, C.cyan), ...(P ? [mark(rowN[2], C.cyan)] : []), ...say('VASE V1  (GREY: BOWL B1)'));

  await until(S(13));
  await play(...rimNum(2), ...fbox(['bottom = 1', 'middle = 3', ['rim    = 2', C.cyan]]), ...say('VASE V1:  1,  3,  2'));

  await until(S(14));
  await play(mark(nums[0], C.green), mark(nums[1], C.green), ...say('BOTTOM, MIDDLE: SAME AS THE BOWL', C.green));

  await until(S(15));
  await play(mark(nums[2]), ...say('ONLY THE RIM IS DIFFERENT', C.amber));

  // ---- 16-25 a control for the rim
  const SA = P ? slider(0, -5.4, 5.0, 0, 'slider', [0, -6.15]) : slider(4.6, -2.0, 3.0, 0, 'slider', [4.6, -2.7]);
  await until(S(16));
  await play(...(P ? [out(new M.VGroup(...row.flatMap(p => p.lines), ...rowN, rowCap))] : []),
    ...SA.all().map(fade), ...say('A SLIDER: RIM WIDER OR NARROWER', C.violet));

  await until(S(17));
  await play(mark(SA.knob, C.violet), ...rimShape(3, C.amber), ...rimNum(3, C.amber),
    ...fbox([['number = 0', C.violet], ['rim    = 3', C.amber]], C.violet), ...say('NUMBER 0  →  RIM 3', C.violet));

  await until(S(18));
  await play(...knobTo(SA, 1), ...rimShape(4, C.amber), ...rimNum(4, C.amber),
    ...fbox([['number = 1', C.violet], ['rim    = 4', C.amber]], C.violet), ...say('NUMBER 1  →  RIM 4', C.violet));

  await until(S(19));
  await play(...knobTo(SA, -1), ...rimShape(2, C.amber), ...rimNum(2, C.amber),
    ...fbox([['number = −1', C.violet], ['rim    = 2', C.amber]], C.violet), ...say('NUMBER −1  →  RIM 2', C.violet));

  await until(S(20));
  await play(mark(nums[0], C.green), mark(nums[1], C.green), ...say('BOTTOM AND MIDDLE NEVER CHANGE', C.green));

  await until(S(21));
  await play(mark(SA.knob, C.violet), ...say('ONE NUMBER CONTROLS THE SHAPE', C.violet));

  await until(S(22));
  await play(mark(mLines[2], C.pink), ...say('NOT A MEASUREMENT OF THE POTTERY', C.pink));

  await until(S(23));
  await play(...capTo(SA, 'hidden number'), ...say('A HIDDEN FEATURE THAT SETS THE SHAPE', C.violet));

  await until(S(24));
  await play(...capTo(SA, 'latent variable'), ...fbox(['hidden number', ['= latent variable', C.violet]], C.violet), ...say('LATENT VARIABLE', C.violet));

  await until(S(25));
  await play(...say('LATENT  =  HIDDEN', C.violet));

  // ---- 26-34 the generator network
  await until(S(26));
  await play(out(new M.VGroup(...BIG.lines, ...ghost.lines, centre, ...mLines, ...mDots, ...nums, ...names, ...SA.all())),
    ...fbox([]), ...say('A SMALL NETWORK: LATENT VARIABLE → 3 MEASUREMENTS'));
  if (P) BOXP = [0, -4.05, 0];
  const NC = P ? [-0.2, 1.75, 0] : [-1.8, -0.7, 0];
  const NR = P ? 0.34 : 0.3;
  const N = net({ layers: [1, 1, 3], center: NC, width: P ? 4.2 : 4.0, height: P ? 2.5 : 2.0, r: NR });
  const outNames = ['bottom', 'middle', 'rim'].map((s, i) => {
    const p = N.pos(2, i); const t = T(s, LS, C.amber); return t.moveTo([p[0] + NR + 0.15 + t.getWidth() / 2, p[1], 0]);
  });
  const inName = (() => { const p = N.pos(0, 0); const t = T('latent', LS, C.violet); return t.moveTo([p[0] - NR - 0.15 - t.getWidth() / 2, p[1], 0]); })();
  await play(cascade(N.nodes.flat().map(fade), 0.8), cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 })), 0.8));

  await until(S(27));
  await play(cascade(N.nodes.flat().map(n => mark(n, C.cyan)), 1.4), ...say('EACH CIRCLE = A NEURON'));

  const SB = P ? slider(0, -5.6, 5.0, 0, 'latent variable', [0, -6.35]) : slider(-1.8, -2.45, 3.0, 0, 'latent variable', [-4.6, -2.45]);
  await until(S(28));
  await play(...SB.all().map(fade), fade(inName), ...N.value(0, 0, '0', C.violet), ...say('FIRST NEURON: THE LATENT VARIABLE', C.violet));

  await until(S(29));
  await play(...N.weight(0, 0, 0, 1), flow(N, 0, C.violet), ...N.value(1, 0, '0', C.violet), ...say('MIDDLE NEURON: PASSES IT ON, UNCHANGED'));

  await until(S(30));
  await play(flow(N, 1), cascade(outNames.map(fade), 0.6), ...say('3 NEURONS ON THE RIGHT: 3 MEASUREMENTS', C.amber));

  await until(S(31));
  await play(...N.weight(1, 0, 0, 0), ...N.value(2, 0, '1', C.amber), ...say('BOTTOM: ALWAYS 1', C.amber));

  await until(S(32));
  await play(...N.weight(1, 0, 1, 0), ...N.value(2, 1, '3', C.amber), ...say('MIDDLE: ALWAYS 3', C.amber));

  const BX = P ? 0 : 4.6, BY = P ? -2.75 : -2.7, BU = P ? 0.4 : 0.3;
  const GEN = pot([1, 3, 3], BX, BY, BU, C.amber, 3);
  await until(S(33));
  await play(...N.weight(1, 0, 2, 1), ...N.value(2, 2, '3', C.amber), ...GEN.lines.map(l => new M.Create(l)),
    ...fbox([['rim = 3 + latent', C.amber], '    = 3 + 0 = 3']), ...say('RIM: 3 + THE LATENT VARIABLE', C.amber));

  const genLab = P ? txt('GENERATOR', 20, C.amber, 0, 0.0, true) : txt('GENERATOR', 18, C.amber, NC[0], 0.85, true);
  await until(S(34));
  await play(fade(genLab), ...say('LATENT VARIABLES → NEW SHAPES: A GENERATOR', C.amber));

  // ---- 35-44 sampling
  await until(S(35));
  await play(mark(SB.line, C.violet), ...say('PICK A LATENT VALUE AT RANDOM: −1 TO 1', C.violet));

  const w4 = (SB.x(1) - SB.x(-1)) / 4;
  const parts = [0, 1, 2, 3].map(i => {
    const r = new M.Rectangle({ width: w4 - 0.05, height: 0.24, color: C.violet, strokeWidth: 1 });
    r.setFill(C.violet, i % 2 ? 0.45 : 0.2); r.moveTo([SB.x(-1) + w4 * (i + 0.5), SB.cy, 0]);
    return new M.VGroup(r, txt('¼', 17, C.violet, SB.x(-1) + w4 * (i + 0.5), SB.cy + 0.4, true));
  });
  await until(S(36));
  await play(out(SB.lab), cascade(parts.map(fade), 1.0), ...say('EQUAL PARTS  =  EQUAL PROBABILITIES', C.violet));
  SB.lab = null;

  await until(S(37));
  await play(out(new M.VGroup(...parts)), ...say('PICKING AT RANDOM = SAMPLING', C.violet));

  await until(S(38));
  await play(...knobTo(SB, -1), ...N.value(0, 0, '−1', C.violet),
    ...say('FIRST PICK:  −1', C.violet));
  await play(flow(N, 0, C.violet), ...N.value(1, 0, '−1', C.violet));

  await until(S(39));
  await play(flow(N, 1), ...N.value(2, 2, '2', C.amber), ...morph(GEN, [1, 3, 2]),
    ...fbox([['rim = 3 + (−1)', C.amber], '    = 2']), ...say('3 + (−1)  =  2', C.amber));

  await until(S(40));
  await play(...knobTo(SB, 1), ...N.value(0, 0, '1', C.violet), ...N.value(1, 0, '1', C.violet), ...say('NEXT PICK:  1', C.violet));
  await play(flow(N, 1), ...N.value(2, 2, '4', C.amber), ...morph(GEN, [1, 3, 4]), ...fbox([['rim = 3 + 1', C.amber], '    = 4']));

  await until(S(41));
  await play(...knobTo(SB, 0.5), ...N.value(0, 0, '0.5', C.violet), ...say('NOW PICK:  0.5', C.violet));
  await play(flow(N, 0, C.violet), ...N.value(1, 0, '0.5', C.violet));

  await until(S(42));
  await play(flow(N, 1), ...N.value(2, 2, '3.5', C.amber), ...fbox([['rim = 3 + 0.5', C.amber], '    = 3.5']), ...say('3 + 0.5  =  3.5', C.amber));

  await until(S(43));
  await play(...morph(GEN, [1, 3, 3.5]), ...fbox(['new pottery:', ['1,  3,  3.5', C.amber]], C.amber), ...say('NEW SHAPE:  1,  3,  3.5', C.amber));

  const TU = P ? 0.17 : 0.1;
  const tpos = k => P ? [(k - 1.5) * 1.9, -4.4] : [4.6 + (k - 1.5) * 1.1, 0.25];
  const tiny = DATA.map(([, , m], k) => pot(m, tpos(k)[0], tpos(k)[1], TU, C.cyan, 2));
  const tnames = DATA.map(([n], k) => txt(n, P ? 17 : 14, C.muted, tpos(k)[0], tpos(k)[1] - (P ? 0.3 : 0.2)));
  await until(S(44));
  await play(...fbox([]), ...tiny.flatMap(p => p.lines.map(fade)), ...tnames.map(fade), ...say('NONE OF THE 4 ORIGINALS IS  1, 3, 3.5', C.amber));

  // ---- 45-48 the formula
  await until(S(45));
  await play(out(new M.VGroup(...tiny.flatMap(p => p.lines), ...tnames)), ...say('ONE SHORT CALCULATION: A FORMULA'));

  await until(S(46));
  await play(...capTo(SB, 'z'), ...fbox([['z = the latent variable', C.violet]], C.violet), ...say('LETTER z = THE LATENT VARIABLE', C.violet));

  await until(S(47));
  await play(...fbox([['z = the latent variable', C.violet], ['rim = 3 + z', C.amber]], C.amber), ...say('RIM  =  3  +  z', C.amber));

  const zs = [-0.8, -0.3, 0.2, 0.7, 0.95];
  const zDots = zs.map(z => new M.Dot({ point: [SB.x(z), SB.cy, 0], radius: 0.08, color: C.violet }));
  const MU = P ? 0.17 : 0.11, MSP = P ? 1.5 : 0.95;
  const many = zs.map((z, k) => pot([1, 3, 3 + z], BX + (k - 2) * MSP, BY + 0.3, MU, C.amber, 2));
  await until(S(48));
  await play(...GEN.lines.map(out), cascade(zDots.map(fade), 1.5),
    cascade(many.map(p => new M.LaggedStart(p.lines.map(fade), { lagRatio: 0.05 })), 1.8),
    ...say('DIFFERENT z  →  DIFFERENT RIM WIDTHS', C.amber));

  // ---- 49-54 what generators are for, and their limit
  await until(S(49));
  await play(flow(N, 0, C.violet), flow(N, 1), ...say('BIGGER GENERATORS: MANY FEATURES TOGETHER'));

  await until(S(50));
  await play(...say('NEW EXAMPLES LIKE THE COLLECTION', C.green));

  await until(S(51));
  await play(out(new M.VGroup(...zDots, ...many.flatMap(p => p.lines))), ...GEN.lines.map(fade), mark(N.nodes[2][2], C.pink), ...say('BUT: ONLY THE RIM CAN CHANGE', C.pink));

  await until(S(52));
  await play(mark(N.nodes[2][0], C.pink), mark(N.nodes[2][1], C.pink), ...say('BOTTOM 1, MIDDLE 3: ALWAYS', C.pink));

  await until(S(53));
  await play(...say('ONLY THE VARIATION THE NETWORK ALLOWS', C.pink));

  await until(S(54));
  await play(...fbox([['latent z → generator', C.violet], ['→ new example', C.amber]], C.green),
    ...say('GENERATOR: LATENT VARIABLES → NEW EXAMPLES', C.green));
}
