// lesson 7.2.6
// The F distribution: how much can a ratio of two spreads swing by chance?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // PHONE STAGE: on the phone the picture is enlarged and moved down into the
  // middle of the frame; the pill sits under the title and the formula card at
  // the bottom. Each new picture object is mapped once, when it first appears
  // (FadeIn / Create / Transform target). Cards are marked so they are skipped.
  const M0 = L.M;
  const SK = 1.14, SY0 = 1.8, SY1 = 3.3;
  const hasStaged = m => !!m && (m.__st || (m.submobjects || []).some(hasStaged));
  const markStaged = m => { m.__st = true; (m.submobjects || []).forEach(markStaged); };
  function stage(m) {
    if (!P || !m || m.__st) return m;
    if (hasStaged(m)) { (m.submobjects || []).forEach(stage); m.__st = true; return m; }
    m.scale(SK, { aboutPoint: [0, SY0, 0] });
    const c = m.getCenter();
    m.moveTo([c[0], c[1] + SY1 - SY0, c[2]]);
    markStaged(m);
    return m;
  }
  const M = !P ? M0 : {
    ...M0,
    FadeIn: class extends M0.FadeIn { constructor(m, o) { super(stage(m), o); } },
    Create: class extends M0.Create { constructor(m, o) { super(stage(m), o); } },
    Transform: class extends M0.Transform { constructor(a, b, o) { super(a, stage(b), o); } }
  };

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Batch A: 15, 17, 17, 19 (mean 17, sq dist 4,0,0,4, var 8/3 ≈ 2.67)
  // Batch C: 20, 22, 24, 26 (mean 23, sq dist 9,1,1,9, var 20/3 ≈ 6.67)
  // F = variance C / variance A = 2.5, df = (3, 3)
  // Upper-tail probability ≈ 0.24; upper 5% cutoff ≈ 9.28.
  // ------------------------------------------------------------

  const A = [15, 17, 17, 19];
  const B = [18, 20, 20, 22];
  const BATCH_C = [20, 22, 24, 26];

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const sum = values => values.reduce((s, v) => s + v, 0);
  const mean = values => sum(values) / values.length;

  function squaredDistances(values) {
    const m = mean(values);
    return values.map(v => (v - m) ** 2);
  }

  function variance(values) {
    return sum(squaredDistances(values)) / (values.length - 1);
  }

  const MA = mean(A);
  const MC = mean(BATCH_C);

  const DEVA = A.map(v => v - MA);
  const DEVC = BATCH_C.map(v => v - MC);

  const SQA = squaredDistances(A);
  const SQC = squaredDistances(BATCH_C);

  const SSA = sum(SQA);
  const SSC = sum(SQC);

  const DFA = A.length - 1;
  const DFC = BATCH_C.length - 1;

  const VA = SSA / DFA;
  const VC = SSC / DFC;

  const FSTAT = VC / VA;

  const DF_TOP = DFC;
  const DF_BOTTOM = DFA;

  const CRIT = 9.276628;
  const PVALUE = 0.24;

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P
    ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P
    ? [0, -6.55, 0] : [4.3, -0.3, 0];  // phone: bottom edge of the card
  const W = P ? FW - 1.4 : 6.8;

  const say = (s, color = BLUE) => showA(s, color, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = BLUE) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;
    const maxw = P ? FW - 1.2 : 4.3;
    const factor = Math.min(1, maxw / wd, P ? 1.56 / ht : 1);

    const pos = [
      BOXP[0],
      P ? BOXP[1] + ht * factor / 2 : BOXP[1],
      0
    ];

    const r = new M.RoundedRectangle({
      width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2
    });
    r.setFill(C.card, 0.95);
    r.moveTo(pos);

    const left = pos[0] - wd / 2 + 0.35;
    const top = pos[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });

    const g = new M.VGroup(r, ...texts);
    if (factor < 1) {
      g.scale(factor);
      g.moveTo(pos);
    }

    markStaged(g);
    const animations = [new M.FadeIn(g)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));
    boxNow = g;
    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];
    const animations = [new M.FadeOut(boxNow)];
    boxNow = null;
    return animations;
  }

  // ------------------------------------------------------------
  // VISUAL HELPERS
  // ------------------------------------------------------------

  const pt = (x, y) => [x, y, 0];

  function txt(s, x, y, color = C.ink, size = 20, mono = false, maxw = W, bold = false) {
    const t = T(s, size, color, mono, bold);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(pt(x, y));
    return t;
  }

  function tag(s, x, y, color = BLUE, size = 17, maxw = W) {
    const t = pill(s, color, size);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(pt(x, y));
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({ start: pt(x1, y1), end: pt(x2, y2), color });
  }

  function rect(x, y, width, height, color = BLUE, opacity = 0.8, strokeWidth = 1) {
    const r = new M.Rectangle({ width, height, color, strokeWidth });
    r.setFill(color, opacity);
    r.moveTo(pt(x, y));
    return r;
  }

  function outline(x, y, width, height, color = BLUE, opacity = 0) {
    const r = new M.RoundedRectangle({
      width, height, cornerRadius: 0.14, color, strokeWidth: 2
    });
    r.setFill(color, opacity);
    r.moveTo(pt(x, y));
    return r;
  }

  function dot(x, y, color = BLUE, radius = 0.13) {
    const halo = new M.Dot({ point: pt(x, y), radius: radius * 2.1, color });
    halo.setFill(color, 0.16);
    const d = new M.Dot({ point: pt(x, y), radius, color });
    d.setFill(color, 1);
    return new M.VGroup(halo, d);
  }

  function bracket(x1, x2, y, color = GOLD, cap = 0.12) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),
      line(x1, y - cap, x1, y + cap, color, 2),
      line(x2, y - cap, x2, y + cap, color, 2)
    );
  }

  function arrow(x1, y1, x2, y2, color = GOLD, head = 0.15, sw = 2.5) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(x2, y2, x2 - head * Math.cos(a - Math.PI / 5), y2 - head * Math.sin(a - Math.PI / 5), color, sw),
      line(x2, y2, x2 - head * Math.cos(a + Math.PI / 5), y2 - head * Math.sin(a + Math.PI / 5), color, sw)
    );
  }

  function sampledCurve(xmap, ymap, lo, hi, color = BLUE, strokeWidth = 3, samples = 120) {
    const parts = [];
    for (let k = 0; k < samples; k++) {
      const a = lo + (hi - lo) * k / samples;
      const b = lo + (hi - lo) * (k + 1) / samples;
      parts.push(line(xmap(a), ymap(a), xmap(b), ymap(b), color, strokeWidth));
    }
    return new M.VGroup(...parts);
  }

  const signed = v => (v < 0 ? `−${Math.abs(v)}` : v > 0 ? `+${v}` : '0');

  let picture = [];

  function add(...objects) {
    picture.push(...objects);
    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    const active = objects.filter(o => picture.includes(o));
    picture = picture.filter(o => !active.includes(o));
    return active.map(o => new M.FadeOut(o));
  }

  function replace(...objects) {
    const animations = picture.map(o => new M.FadeOut(o));
    picture = objects.slice();
    return [...animations, ...objects.map(o => new M.FadeIn(o))];
  }

  // ------------------------------------------------------------
  // BATTERY BARS
  // ------------------------------------------------------------

  const BAR_BASE = P ? -3.55 : -2.18;
  const BAR_SCALE = P ? 0.145 : 0.106;
  const BAR_W = P ? 0.53 : 0.55;
  const BAR_SP = P ? 0.68 : 0.69;
  const BAR_AX = CX - 1.73;
  const BAR_CX = CX + 1.73;

  function batteryBar(x, value, color) {
    const height = value * BAR_SCALE;
    return new M.VGroup(
      rect(x, BAR_BASE + height / 2, BAR_W + 0.09, height + 0.04, color, 0.13, 0),
      rect(x, BAR_BASE + height / 2, BAR_W, height, color, 0.84),
      txt(String(value), x, BAR_BASE + height + 0.28, color, P ? 18 : 17, true, BAR_SP)
    );
  }

  function batteryBars(values, center, color) {
    return values.map((v, k) => batteryBar(center + (k - 1.5) * BAR_SP, v, color));
  }

  function batteryBarAxes() {
    return new M.VGroup(
      line(CX - 3.18, BAR_BASE, CX + 3.18, BAR_BASE, C.muted, 2.5),
      txt('BATCH A', BAR_AX, BAR_BASE - 0.33, BLUE, 17),
      txt('BATCH C', BAR_CX, BAR_BASE - 0.33, PINK, 17),
      txt('battery life in hours', CX, BAR_BASE - 0.71, C.muted, 15)
    );
  }

  // ------------------------------------------------------------
  // 0: BATCH C LOOKED MORE SPREAD OUT THAN A
  // ------------------------------------------------------------

  const introBarsA = batteryBars(A, BAR_AX, BLUE);
  const introBarsC = batteryBars(BATCH_C, BAR_CX, PINK);
  const introAxes = batteryBarAxes();
  const introQuestion = tag('IS THE EXTRA SPREAD REAL?', P ? CX : CX - 1.3, P ? 1.20 : 1.22, VIOLET, 17);

  await until(S(0));
  await play(
    ...add(introAxes, ...introBarsA, ...introBarsC, introQuestion),
    ...(P ? fbox([['batch C looked', PINK], ['more spread out', PINK], 'than batch A']) : []),
    ...say('DO THE TWO BATCHES REALLY SPREAD DIFFERENTLY?', VIOLET)
  );

  // ------------------------------------------------------------
  // SHARED HOURS NUMBER LINE
  // ------------------------------------------------------------

  const HMIN = 14;
  const HMAX = 27;
  const HW = P ? 6.50 : 6.60;
  const HY = P ? -2.55 : -1.30;
  const hx = v => CX - HW / 2 + (v - HMIN) / (HMAX - HMIN) * HW;

  function hoursAxis() {
    const parts = [line(hx(HMIN), HY, hx(HMAX), HY, C.muted, 3)];
    for (let v = HMIN; v <= HMAX; v++) {
      const major = v % 2 === 0;
      parts.push(line(hx(v), HY - 0.07, hx(v), HY + 0.07, C.muted, major ? 1.6 : 0.8));
      if (major) {
        parts.push(txt(String(v), hx(v), HY - 0.30, C.muted, 16, true, 0.48));
      }
    }
    parts.push(txt('battery life in hours', CX, HY - 0.77, C.muted, 16));
    return new M.VGroup(...parts);
  }

  function hourDots(values, color) {
    return values.map((v, k) => {
      const repeats = values.slice(0, k).filter(n => n === v).length;
      return dot(hx(v), HY + 0.35 + repeats * 0.43, color, P ? 0.125 : 0.115);
    });
  }

  function hoursMean(v, color, label) {
    return new M.VGroup(
      dashed(hx(v), HY + 0.08, hx(v), HY + 1.08, color),
      tag(label, hx(v), HY - 1.23, color, P ? 18 : 16, 2.60)
    );
  }

  // ------------------------------------------------------------
  // 1: BATCH A — FOUR FAMILIAR READINGS
  // ------------------------------------------------------------

  const axis = hoursAxis();
  const dotsA = hourDots(A, BLUE);
  const labelA = tag('BATCH A', hx(MA), HY + 1.49, BLUE, 17);
  const valuesA = txt('15, 17, 17, 19', hx(MA), HY + 1.97, BLUE, 18, true, 2.90);

  await until(S(1));
  const oldPicture = picture.map(o => new M.FadeOut(o));
  picture = [axis, labelA, valuesA, ...dotsA];

  await play(
    ...oldPicture,
    new M.FadeIn(axis),
    new M.FadeIn(labelA),
    new M.FadeIn(valuesA),
    new M.LaggedStart(dotsA.map(d => new M.FadeIn(d)), { lagRatio: 0.22, runTime: 1.7 }),
    ...fbox([['batch A', BLUE], '15, 17, 17, 19 hours'], BLUE),
    ...say('BATCH A: 15, 17, 17, 19', BLUE)
  );

  // ------------------------------------------------------------
  // 2: BATCH C — FOUR MORE READINGS
  // ------------------------------------------------------------

  const dotsC = hourDots(BATCH_C, PINK);
  const labelC = tag('BATCH C', hx(MC), HY + 1.49, PINK, 17);
  const valuesC = txt('20, 22, 24, 26', hx(MC), HY + 1.97, PINK, 18, true, 2.95);

  await until(S(2));
  picture.push(labelC, valuesC, ...dotsC);

  await play(
    new M.FadeIn(labelC),
    new M.FadeIn(valuesC),
    new M.LaggedStart(dotsC.map(d => new M.FadeIn(d)), { lagRatio: 0.22, runTime: 1.6 }),
    ...fbox([['A: 15, 17, 17, 19', BLUE], ['C: 20, 22, 24, 26', PINK]]),
    ...say('BATCH C: 20, 22, 24, 26', PINK)
  );

  // ------------------------------------------------------------
  // 3: BLUE DOTS HUDDLE CLOSE, PINK DOTS STRETCH WIDER
  // ------------------------------------------------------------

  const rangeY = HY + 1.12;
  const rangeA = bracket(hx(15), hx(19), rangeY, BLUE);
  const rangeC = bracket(hx(20), hx(26), rangeY, PINK);
  const rangeLabelA = txt('4 h range', (hx(15) + hx(19)) / 2, rangeY + 0.33, BLUE, 17, true, 2.00);
  const rangeLabelC = txt('6 h range', (hx(20) + hx(26)) / 2, rangeY + 0.33, PINK, 17, true, 2.45);
  const meanA = hoursMean(MA, BLUE, 'MEAN 17');
  const meanC = hoursMean(MC, PINK, 'MEAN 23');

  await until(S(3));
  await play(
    ...remove(labelA, labelC, valuesA, valuesC),
    ...add(rangeA, rangeC, rangeLabelA, rangeLabelC, meanA, meanC),
    ...fbox([['A: narrower spread', BLUE], ['C: wider spread', PINK], 'same hours scale']),
    ...say('THE PINK DOTS STRETCH WIDER', PINK)
  );

  // ------------------------------------------------------------
  // SQUARED-DISTANCE TILES
  // ------------------------------------------------------------

  const TILE_SP = P ? 1.28 : 1.30;
  const TILE_A_Y = P ? 0.50 : 0.56;
  const TILE_C_Y = P ? -2.45 : -1.58;
  const tileX = k => CX + (k - 1.5) * TILE_SP;

  function squaredTile(deviation, k, y, color) {
    const x = tileX(k);
    const n = deviation ** 2;
    const parts = [
      outline(x, y, 1.14, 1.18, color, 0.06),
      txt(`(${signed(deviation)})²`, x, y + 0.40, C.muted, 15, true, 1.04),
      txt(String(n), x, y - 0.40, color, 20, true)
    ];

    if (n > 0) {
      const side = Math.abs(deviation);
      const unit = 0.12;
      const pitch = 0.145;
      for (let j = 0; j < n; j++) {
        const row = Math.floor(j / side);
        const col = j % side;
        parts.push(
          rect(
            x + (col - (side - 1) / 2) * pitch,
            y + ((side - 1) / 2 - row) * pitch,
            unit, unit, color, 0.88
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function squaredDistanceRow(deviations, y, color, title, equation) {
    return [
      txt(title, CX, y + 0.82, color, 17),
      ...deviations.map((v, k) => squaredTile(v, k, y, color)),
      txt(equation, CX, y - 0.82, color, 18, true)
    ];
  }

  // ------------------------------------------------------------
  // VARIANCE BAR HELPERS
  // ------------------------------------------------------------

  const VAR_SCALE = P ? 0.80 : 0.83;
  const VAR_LEFT = CX - 2.80;
  const VAR_AY = P ? 0.06 : 0.48;
  const VAR_CY = P ? -2.75 : -1.42;

  function varianceBar(value, y, color, title, valueText, start = VAR_LEFT) {
    const width = value * VAR_SCALE;
    return new M.VGroup(
      txt(title, CX, y + 0.59, color, 18),
      rect(start + width / 2, y, width + 0.07, 0.49, color, 0.13, 0),
      rect(start + width / 2, y, width, 0.37, color, 0.85),
      txt(valueText, CX, y - 0.47, color, 20, true)
    );
  }

  function varianceComparison() {
    return [
      varianceBar(VA, VAR_AY, BLUE, 'BATCH A VARIANCE', '2.67 hours²'),
      varianceBar(VC, VAR_CY, PINK, 'BATCH C VARIANCE', '6.67 hours²')
    ];
  }

  // ------------------------------------------------------------
  // 4: RECALL THE TWO VARIANCES
  // ------------------------------------------------------------

  const squaredA = squaredDistanceRow(DEVA, TILE_A_Y, BLUE, 'A: DISTANCES FROM MEAN 17', '4 + 0 + 0 + 4 = 8');
  const squaredC = squaredDistanceRow(DEVC, TILE_C_Y, PINK, 'C: DISTANCES FROM MEAN 23', '9 + 1 + 1 + 9 = 20');

  await until(S(4));
  await play(
    ...replace(...squaredA, ...squaredC),
    ...fbox(['squared distances', ['A total = 8', BLUE], ['C total = 20', PINK]]),
    ...say('VARIANCE: SQUARE THE DISTANCES, THEN SHARE')
  );

  await until(S(4) + 4.8);
  await play(
    ...replace(...varianceComparison()),
    ...fbox(['variance = total ÷ df', ['A: 8 ÷ 3 ≈ 2.67', BLUE], ['C: 20 ÷ 3 ≈ 6.67', PINK]]),
    ...say('DIVIDE EACH TOTAL BY 4 − 1 = 3')
  );

  // ------------------------------------------------------------
  // 5: COMPARE TWO SPREADS BY DIVISION
  // ------------------------------------------------------------

  const DIV_TOP = P ? 0.12 : 0.65;
  const DIV_BOTTOM = P ? -2.30 : -1.29;
  const DIV_W = 5.72;

  function centeredVarianceBar(value, y, color, title) {
    const width = value * VAR_SCALE;
    return new M.VGroup(
      txt(title, CX, y + 0.56, color, 18),
      rect(CX, y, width, 0.43, color, 0.85),
      txt(`${value.toFixed(2)} hours²`, CX, y - 0.45, color, 19, true)
    );
  }

  function divisionPicture() {
    return [
      centeredVarianceBar(VC, DIV_TOP, PINK, 'C VARIANCE'),
      line(CX - DIV_W / 2, (DIV_TOP + DIV_BOTTOM) / 2, CX + DIV_W / 2, (DIV_TOP + DIV_BOTTOM) / 2, VIOLET, 3),
      centeredVarianceBar(VA, DIV_BOTTOM, BLUE, 'A VARIANCE')
    ];
  }

  await until(S(5));
  await play(
    ...replace(...divisionPicture()),
    ...fbox([['C variance', PINK], '÷', ['A variance', BLUE]], VIOLET),
    ...say('COMPARE SPREADS BY DIVIDING', VIOLET)
  );

  // ------------------------------------------------------------
  // 6: 6.67 ÷ 2.67 = 2.5
  // ------------------------------------------------------------

  const ratioY = P ? -3.68 : -2.40;
  const ratioResult = tag('RATIO = 2.5', CX, ratioY, VIOLET, 22);

  await until(S(6));
  await play(
    ...add(ratioResult),
    ...fbox(['ratio = (20/3) ÷ (8/3)', '      = 20 ÷ 8', ['      = 2.5', VIOLET]], VIOLET),
    ...say('6.67 DIVIDED BY 2.67 ≈ 2.5', VIOLET)
  );

  // ------------------------------------------------------------
  // 7: C CONTAINS TWO AND A HALF A-VARIANCE UNITS
  // ------------------------------------------------------------

  const UNIT_SCALE = P ? 0.82 : 0.84;
  const UNIT_W = VA * UNIT_SCALE;
  const C_TOTAL_W = VC * UNIT_SCALE;
  const UNIT_LEFT = CX - C_TOTAL_W / 2;
  const UNIT_A_Y = P ? 0.35 : 0.60;
  const UNIT_C_Y = P ? -2.40 : -1.08;

  function ratioBlocksPicture() {
    const parts = [
      txt('ONE A VARIANCE', CX, UNIT_A_Y + 0.60, BLUE, 18),
      rect(UNIT_LEFT + UNIT_W / 2, UNIT_A_Y, UNIT_W, 0.56, BLUE, 0.86),
      txt('1 unit', UNIT_LEFT + UNIT_W / 2, UNIT_A_Y, C.bg, 18, true, UNIT_W - 0.12, true),
      txt('C VARIANCE', CX, UNIT_C_Y + 0.66, PINK, 18)
    ];

    const units = [1, 1, 0.5];
    let offset = 0;

    units.forEach(amount => {
      const width = amount * UNIT_W;
      const x = UNIT_LEFT + offset + width / 2;
      parts.push(
        rect(x, UNIT_C_Y, width - 0.035, 0.56, PINK, amount === 1 ? 0.84 : 0.32),
        txt(amount === 1 ? '1' : '½', x, UNIT_C_Y, amount === 1 ? C.bg : C.ink, 21, true, width - 0.10, true)
      );
      offset += width;
    });

    parts.push(
      bracket(UNIT_LEFT, UNIT_LEFT + C_TOTAL_W, UNIT_C_Y - 0.45, VIOLET, 0.09),
      txt('1 + 1 + 0.5 = 2.5', CX, UNIT_C_Y - 0.79, VIOLET, 21, true)
    );

    return parts;
  }

  await until(S(7));
  await play(
    ...replace(...ratioBlocksPicture()),
    ...fbox([['C variance', PINK], 'is 2.5 times', ['A variance', BLUE]]),
    ...say('C HAS TWO AND A HALF TIMES A’S VARIANCE', VIOLET)
  );

  // ------------------------------------------------------------
  // 8: IF THE TRUE SPREADS ARE EQUAL, ONE IS THE REFERENCE
  // ------------------------------------------------------------

  const RATIO_MIN = 0;
  const RATIO_MAX = 4;
  const RATIO_W = P ? 6.1 : 6.2;
  const RATIO_Y = P ? -2.75 : -0.91;
  const rx = v => CX - RATIO_W / 2 + v / RATIO_MAX * RATIO_W;

  function ratioAxis() {
    const parts = [line(rx(RATIO_MIN), RATIO_Y, rx(RATIO_MAX), RATIO_Y, C.muted, 3)];
    for (let v = 0; v <= 4; v++) {
      parts.push(
        line(rx(v), RATIO_Y - 0.08, rx(v), RATIO_Y + 0.08, C.muted, 1.6),
        txt(String(v), rx(v), RATIO_Y - 0.30, C.muted, 18, true)
      );
    }
    parts.push(txt('variance ratio', CX, RATIO_Y - 0.75, C.muted, 16));
    return new M.VGroup(...parts);
  }

  const equalRatioMarker = new M.VGroup(
    dashed(rx(1), RATIO_Y, rx(1), RATIO_Y + 1.18, GREEN),
    dot(rx(1), RATIO_Y, GREEN, 0.13),
    tag('EQUAL = 1', rx(1), RATIO_Y + 1.49, GREEN, 17, 2.10)
  );

  const observedRatioMarker = new M.VGroup(
    dashed(rx(FSTAT), RATIO_Y, rx(FSTAT), RATIO_Y + 1.18, VIOLET),
    dot(rx(FSTAT), RATIO_Y, VIOLET, 0.14),
    tag('OURS = 2.5', rx(FSTAT), RATIO_Y + 1.49, VIOLET, 17, 2.10)
  );

  const distanceQuestion = new M.VGroup(
    bracket(rx(1), rx(FSTAT), RATIO_Y + 0.65, GOLD),
    txt('unusual?', (rx(1) + rx(FSTAT)) / 2, RATIO_Y + 0.97, GOLD, 18)
  );

  await until(S(8));
  await play(
    ...replace(ratioAxis(), equalRatioMarker, observedRatioMarker, distanceQuestion),
    ...fbox(['equal true variances', ['reference ratio = 1', GREEN], 'is 2.5 far from 1?'], VIOLET),
    ...say('IS TWO AND A HALF FAR FROM ONE?', GOLD)
  );

  // ------------------------------------------------------------
  // REFERENCE PROBABILITY DENSITIES
  // ------------------------------------------------------------

  function chiPDF(x) {
    if (x <= 0) return 0;
    return Math.sqrt(x) * Math.exp(-x / 2) / Math.sqrt(2 * Math.PI);
  }

  function fPDF(x) {
    if (x <= 0) return 0;
    return (8 / Math.PI) * Math.sqrt(x) / Math.pow(1 + x, 3);
  }

  // ------------------------------------------------------------
  // 9: RECALL LAST LESSON'S CHI-SQUARE CURVE
  // ------------------------------------------------------------

  const CHI_PREVIEW_Y = P ? -3.45 : -1.90;
  const CHI_PREVIEW_W = P ? 6.05 : 6.15;
  const chiX = v => CX - CHI_PREVIEW_W / 2 + v / 15 * CHI_PREVIEW_W;
  const chiY = v => CHI_PREVIEW_Y + chiPDF(v) * (P ? 10.6 : 7.4);

  function chiPreviewAxis() {
    const parts = [line(chiX(0), CHI_PREVIEW_Y, chiX(15), CHI_PREVIEW_Y, C.muted, 2.5)];
    for (let v = 0; v <= 15; v += 3) {
      parts.push(
        line(chiX(v), CHI_PREVIEW_Y - 0.07, chiX(v), CHI_PREVIEW_Y + 0.07, C.muted),
        txt(String(v), chiX(v), CHI_PREVIEW_Y - 0.28, C.muted, 15, true)
      );
    }
    parts.push(txt('chi-square value', CX, CHI_PREVIEW_Y - 0.72, C.muted, 16));
    return new M.VGroup(...parts);
  }

  const previousChiCurve = sampledCurve(chiX, chiY, 0, 15, BLUE, 3.2, 100);
  const previousChiTitle = tag('χ²: THREE DEGREES OF FREEDOM', CX, P ? 1.08 : 1.1, BLUE, 17);
  const previousChiEquation = txt('1² + (−2)² + 0.5² = 5.25', CX, P ? 0.25 : 0.46, VIOLET, 19, true);

  const previousChiPoint = new M.VGroup(
    dashed(chiX(5.25), CHI_PREVIEW_Y, chiX(5.25), chiY(5.25) + 0.30, GOLD),
    dot(chiX(5.25), CHI_PREVIEW_Y, GOLD, 0.11),
    txt('5.25', chiX(5.25), chiY(5.25) + 0.55, GOLD, 18, true)
  );

  await until(S(9));
  await play(
    ...replace(chiPreviewAxis(), previousChiCurve, previousChiTitle, previousChiEquation, previousChiPoint),
    ...fbox(['recall chi-square', 'add squared scores', ['three pieces → 3 df', BLUE]]),
    ...say('LAST LESSON: A TOTAL OF SQUARED DISTANCES')
  );

  // ------------------------------------------------------------
  // 10: EACH VARIANCE IS A TOTAL SHARED OVER ITS df
  // ------------------------------------------------------------

  const SHARE_A_Y = P ? 0.17 : 0.55;
  const SHARE_C_Y = P ? -2.70 : -1.50;
  const SHARE_SP = 1.02;

  function sharedTotalRow(total, y, color, batch, equation) {
    const parts = [
      txt(batch, CX - 2.42, y + 0.52, color, 17, false, 1.55),
      txt(`${total} squared hours`, CX, y + 0.83, color, 17, true)
    ];

    const value = total / 3;
    const maxHeight = 0.99;
    const unitHeight = maxHeight / (SSC / 3);
    const base = y - 0.30;

    for (let k = 0; k < 3; k++) {
      const x = CX + (k - 1) * SHARE_SP;
      const h = value * unitHeight;
      parts.push(
        outline(x, base + maxHeight / 2, 0.70, maxHeight, color, 0.025),
        rect(x, base + h / 2, 0.61, h, color, 0.82),
        txt(`df ${k + 1}`, x, base - 0.24, C.muted, 15, true)
      );
    }

    parts.push(txt(equation, CX, y - 0.93, color, 19, true));
    return new M.VGroup(...parts);
  }

  const shareA = sharedTotalRow(SSA, SHARE_A_Y, BLUE, 'A', '8 ÷ 3 ≈ 2.67');
  const shareC = sharedTotalRow(SSC, SHARE_C_Y, PINK, 'C', '20 ÷ 3 ≈ 6.67');

  await until(S(10));
  await play(
    ...replace(shareA, shareC),
    ...fbox(['variance = σ² × Q/df', 'Q: chi-square total', ['df = 4 − 1 = 3 each', VIOLET]], VIOLET),
    ...say('EACH VARIANCE SHARES ITS TOTAL OVER THREE df')
  );

  // ------------------------------------------------------------
  // 11: DIVIDE TWO CHI-SQUARE TOTALS, EACH ADJUSTED FOR df
  // ------------------------------------------------------------

  const FRACTION_TOP = P ? 0.52 : 0.88;
  const FRACTION_BOTTOM = P ? -2.08 : -1.23;

  function chiTotalCard(y, color, name, expression) {
    return new M.VGroup(
      outline(CX, y, 5.55, 1.38, color, 0.065),
      txt(name, CX, y + 0.42, color, 17),
      txt(expression, CX, y - 0.11, color, 24, true, 5.20)
    );
  }

  const chiNumerator = chiTotalCard(FRACTION_TOP, PINK, 'TOP: CHI-SQUARE TOTAL PER df', 'QC ÷ 3');
  const chiDenominator = chiTotalCard(FRACTION_BOTTOM, BLUE, 'BOTTOM: CHI-SQUARE TOTAL PER df', 'QA ÷ 3');
  const chiDivisionLine = line(
    CX - 2.82, (FRACTION_TOP + FRACTION_BOTTOM) / 2,
    CX + 2.82, (FRACTION_TOP + FRACTION_BOTTOM) / 2,
    VIOLET, 3
  );
  const twoDFCounts = tag('3 df ABOVE, 3 df BELOW', CX, P ? -3.51 : -2.35, VIOLET, 17);

  await until(S(11));
  await play(
    ...replace(chiNumerator, chiDivisionLine, chiDenominator, twoDFCounts),
    ...fbox(['divide adjusted totals', ['top: QC ÷ 3', PINK], ['bottom: QA ÷ 3', BLUE]], VIOLET),
    ...say('TWO CHI-SQUARE TOTALS, EACH DIVIDED BY df', VIOLET)
  );

  // ------------------------------------------------------------
  // 12: UNDER EQUAL TRUE SPREADS, THE TRUE VARIANCE CANCELS
  // ------------------------------------------------------------

  const CANCEL_TOP = P ? 0.31 : 0.52;
  const CANCEL_BOTTOM = P ? -1.78 : -1.2;
  const FACTOR_X = CX - 1.40;
  const TOTAL_X = CX + 1.18;

  function factorRow(y, color, label, qText) {
    return [
      txt(label, CX, y + 0.69, color, 17),
      outline(FACTOR_X, y, 2.19, 0.69, GREEN, 0.085),
      txt('same σ²', FACTOR_X, y, GREEN, 21, true),
      txt('×', CX - 0.02, y, C.muted, 23),
      outline(TOTAL_X, y, 2.19, 0.69, color, 0.085),
      txt(qText, TOTAL_X, y, color, 21, true)
    ];
  }

  const factorTop = factorRow(CANCEL_TOP, PINK, 'C VARIANCE UNDER THE NULL', 'QC ÷ 3');
  const factorBottom = factorRow(CANCEL_BOTTOM, BLUE, 'A VARIANCE UNDER THE NULL', 'QA ÷ 3');
  const cancelDivisionLine = line(
    CX - 2.72, (CANCEL_TOP + CANCEL_BOTTOM) / 2,
    CX + 2.72, (CANCEL_TOP + CANCEL_BOTTOM) / 2,
    VIOLET, 3
  );
  const commonFactorNote = txt('same unknown true variance in both', CX, P ? -2.78 : -2.00, GREEN, 17);

  await until(S(12));
  await play(
    ...replace(...factorTop, cancelDivisionLine, ...factorBottom, commonFactorNote),
    ...fbox(['equal true variances', ['same σ² in both', GREEN], 'divide C by A'], GREEN),
    ...say('IMAGINE TWO BATCHES WITH EQUAL TRUE SPREADS', GREEN)
  );

  const cancelSlashTop = line(FACTOR_X - 0.85, CANCEL_TOP - 0.32, FACTOR_X + 0.85, CANCEL_TOP + 0.32, GOLD, 4);
  const cancelSlashBottom = line(FACTOR_X - 0.85, CANCEL_BOTTOM - 0.32, FACTOR_X + 0.85, CANCEL_BOTTOM + 0.32, GOLD, 4);
  const cancelsTag = tag('COMMON FACTOR CANCELS', CX, P ? -3.52 : -2.43, GREEN, 17);

  await until(S(12) + 4.4);
  await play(
    ...add(cancelSlashTop, cancelSlashBottom, cancelsTag),
    ...fbox(['same σ² ÷ same σ² = 1', 'true spread cancels', ['(QC/3) ÷ (QA/3)', VIOLET]], VIOLET),
    ...say('THE COMMON TRUE VARIANCE CANCELS', GREEN)
  );

  // ------------------------------------------------------------
  // DETERMINISTIC SIMULATION
  // ------------------------------------------------------------

  let rngState = 721006;

  function random() {
    rngState = (Math.imul(1664525, rngState) + 1013904223) >>> 0;
    return (rngState + 0.5) / 4294967296;
  }

  function randomNormal() {
    const u1 = Math.max(1e-12, random());
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function normalBattery() {
    return 20 + 2 * randomNormal();
  }

  function simulateTrial(n = 4) {
    const a = Array.from({ length: n }, normalBattery);
    const c = Array.from({ length: n }, normalBattery);
    const va = variance(a);
    const vc = variance(c);
    return { a, c, va, vc, ratio: vc / Math.max(1e-12, va) };
  }

  const SIM_N = 6000;
  const trials = Array.from({ length: SIM_N }, () => simulateTrial(4));

  // ------------------------------------------------------------
  // 13: COMPUTER REPEATS THE TEST THOUSANDS OF TIMES
  // ------------------------------------------------------------

  const SIM_A_Y = P ? 0.26 : 0.75;
  const SIM_C_Y = P ? -1.83 : -0.82;
  const SIM_RESULT_Y = P ? -3.72 : -2.28;

  function simulationRow(values, sampleVariance, y, color, label) {
    const parts = [txt(label, CX, y + 0.56, color, 17)];
    values.forEach((v, k) => {
      const x = CX + (k - 1.5) * 1.28;
      parts.push(
        outline(x, y, 1.12, 0.62, color, 0.075),
        txt(v.toFixed(1), x, y, color, 18, true, 1.04)
      );
    });
    parts.push(txt(`variance ≈ ${sampleVariance.toFixed(2)}`, CX, y - 0.56, color, 18, true));
    return new M.VGroup(...parts);
  }

  function simulationFrame(trial, index) {
    return [
      simulationRow(trial.a, trial.va, SIM_A_Y, BLUE, `SIMULATED A — TEST ${index}`),
      simulationRow(trial.c, trial.vc, SIM_C_Y, PINK, `SIMULATED C — TEST ${index}`),
      tag(`C ÷ A ≈ ${trial.ratio.toFixed(2)}`, CX, SIM_RESULT_Y, VIOLET, 21)
    ];
  }

  await until(S(13));
  await play(
    ...replace(...simulationFrame(trials[0], 1)),
    ...fbox(['4 random batteries: A', '4 random batteries: C', ['same true spread', GREEN]], GREEN),
    ...say('LET THE COMPUTER REPEAT THE TEST')
  );

  await until(S(13) + 2.0);
  await play(
    ...replace(...simulationFrame(trials[1], 2)),
    ...fbox(['find both variances', ['divide C by A', VIOLET]], VIOLET)
  );

  await until(S(13) + 4.0);
  await play(
    ...replace(...simulationFrame(trials[2], 3)),
    ...fbox(['repeat 6,000 times', ['keep each ratio', VIOLET]], VIOLET)
  );

  // ------------------------------------------------------------
  // F DISTRIBUTION GRAPH
  // ------------------------------------------------------------

  const FMIN = 0;
  const FMAX = 15;
  const GRAPH_W = P ? 6.20 : 6.25;
  const GRAPH_LEFT = CX - GRAPH_W / 2 + 0.10;
  const GRAPH_Y = P ? -3.65 : -1.90;
  const DENSITY_SCALE = P ? 6.2 : 4.0;

  const fx = v => GRAPH_LEFT + v / FMAX * GRAPH_W;
  const fy = v => GRAPH_Y + fPDF(v) * DENSITY_SCALE;

  function fAxis() {
    const parts = [
      line(fx(-0.70), GRAPH_Y, fx(FMAX), GRAPH_Y, C.muted, 2.5),
      line(fx(0), GRAPH_Y, fx(0), GRAPH_Y + (P ? 4.35 : 3.0), C.muted, 1.6)
    ];

    const ticks = [0, 1, 3, 5, 7, 9, 11, 13, 15];
    ticks.forEach(v => {
      parts.push(
        line(fx(v), GRAPH_Y - 0.07, fx(v), GRAPH_Y + 0.07, C.muted, 1.4),
        txt(String(v), fx(v), GRAPH_Y - 0.29, C.muted, 15, true, 0.47)
      );
    });

    parts.push(txt('variance ratio', CX, GRAPH_Y - 0.74, C.muted, 16));
    return new M.VGroup(...parts);
  }

  const BIN_W = 0.5;
  const BIN_N = Math.round(FMAX / BIN_W);

  function histogramCounts(n) {
    const counts = Array(BIN_N).fill(0);
    let overflow = 0;
    for (let k = 0; k < n; k++) {
      const index = Math.floor(trials[k].ratio / BIN_W);
      if (index >= 0 && index < BIN_N) counts[index]++;
      else if (index >= BIN_N) overflow++;
    }
    return { counts, overflow };
  }

  function histogramBar(k, count, n) {
    const density = count / (n * BIN_W);
    const height = Math.max(0.002, density * DENSITY_SCALE);
    return rect(
      fx((k + 0.5) * BIN_W),
      GRAPH_Y + height / 2,
      Math.max(0.020, fx(BIN_W) - fx(0) - 0.014),
      height,
      VIOLET,
      count > 0 ? 0.61 : 0,
      count > 0 ? 0.7 : 0
    );
  }

  function histogramCounter(n) {
    return tag(`${n.toLocaleString('en-US')} SIMULATED RATIOS`, CX + 0.35, P ? 1.34 : 1.27, VIOLET, 16);
  }

  const histogramAxis = fAxis();
  const INITIAL_N = 80;
  const initialCounts = histogramCounts(INITIAL_N);
  const histogramBars = initialCounts.counts.map((count, k) => histogramBar(k, count, INITIAL_N));
  let counterNow = histogramCounter(INITIAL_N);

  function growHistogram(n, duration = 0.85) {
    const data = histogramCounts(n);
    const targets = data.counts.map((count, k) => histogramBar(k, count, n));
    const nextCounter = histogramCounter(n);

    const animations = [
      ...remove(counterNow),
      ...histogramBars.map((bar, k) => new M.Transform(bar, targets[k], { runTime: duration })),
      ...add(nextCounter)
    ];

    counterNow = nextCounter;
    return animations;
  }

  // ------------------------------------------------------------
  // 14: EACH RATIO DROPS INTO A HISTOGRAM
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...replace(histogramAxis, ...histogramBars, counterNow),
    ...fbox(['one ratio per test', ['count ratios in bins', VIOLET]], VIOLET),
    ...say('EACH RATIO ADDS TO THE HISTOGRAM', VIOLET)
  );

  // ------------------------------------------------------------
  // 15: NO RATIO CAN BE NEGATIVE
  // ------------------------------------------------------------

  const zeroBoundary = dashed(fx(0), GRAPH_Y, fx(0), GRAPH_Y + (P ? 4.35 : 3.0), GOLD);
  const zeroLabel = txt('STARTS AT ZERO', CX + 1.07, GRAPH_Y + (P ? 3.82 : 2.63), GOLD, 17);
  const zeroArrow = arrow(CX + 0.10, GRAPH_Y + (P ? 3.53 : 2.37), fx(0) + 0.04, GRAPH_Y + (P ? 2.95 : 1.90), GOLD, 0.13);
  const negativeCross = new M.VGroup(
    line(fx(-0.70), GRAPH_Y + 0.22, fx(-0.16), GRAPH_Y + 0.47, GOLD, 2.4),
    line(fx(-0.70), GRAPH_Y + 0.47, fx(-0.16), GRAPH_Y + 0.22, GOLD, 2.4)
  );

  await until(S(15));
  await play(
    ...growHistogram(750, 0.9),
    ...add(zeroBoundary, zeroLabel, zeroArrow, negativeCross),
    ...fbox(['variances are ≥ 0', ['variance ratio ≥ 0', GOLD]], GOLD),
    ...say('NO RATIOS BELOW ZERO', GOLD)
  );

  await until(S(15) + 2.4);
  await play(...growHistogram(2500, 0.9));

  // ------------------------------------------------------------
  // 16: MANY RATIOS NEAR ONE, LONG RIGHT TAIL
  // ------------------------------------------------------------

  const mainFCurve = sampledCurve(fx, fy, FMIN, FMAX, BLUE, 3.2, 150);
  const oneLine = dashed(fx(1), GRAPH_Y, fx(1), fy(1) + 0.26, GREEN);
  const oneTag = tag('REFERENCE = 1', fx(1) + 0.69, fy(1) + 0.54, GREEN, 15, 2.15);
  const tailArrow = arrow(fx(4.5), GRAPH_Y + 0.66, fx(14.1), GRAPH_Y + 0.66, GOLD, 0.14);
  const tailLabel = txt('LONG RIGHT TAIL', fx(9.3), GRAPH_Y + 0.97, GOLD, 17);
  const finalHist = histogramCounts(SIM_N);
  const overflowText = txt(`${finalHist.overflow} simulated ratios above 15`, CX, GRAPH_Y - 1.14, C.muted, 16);

  await until(S(16));
  await play(
    ...growHistogram(SIM_N, 0.9),
    ...remove(zeroBoundary, zeroLabel, zeroArrow, negativeCross),
    ...add(mainFCurve, oneLine, oneTag, tailArrow, tailLabel, overflowText),
    ...fbox(['many ratios near 1', 'some are very large', ['long right tail', GOLD]], GOLD),
    ...say('A LONG TAIL STRETCHES TO THE RIGHT', GOLD)
  );

  // ------------------------------------------------------------
  // 17: RATIOS OF TWO, THREE, EVEN FIVE OCCUR BY CHANCE
  // ------------------------------------------------------------

  function nearestTrial(target) {
    let best = trials[0];
    for (const trial of trials) {
      if (Math.abs(trial.ratio - target) < Math.abs(best.ratio - target)) best = trial;
    }
    return best;
  }

  const exampleTrials = [nearestTrial(2), nearestTrial(3), nearestTrial(5)];

  function exampleRatioMarker(trial, color, lift, xOffset = 0) {
    const value = trial.ratio;
    const x = fx(value);
    return new M.VGroup(
      dot(x, GRAPH_Y, color, 0.105),
      dashed(x, GRAPH_Y + 0.10, x, GRAPH_Y + lift - 0.17, color),
      tag(value.toFixed(1), x + xOffset, GRAPH_Y + lift, color, P ? 18 : 17, 1.15)
    );
  }

  const exampleTwo = exampleRatioMarker(exampleTrials[0], GOLD, P ? 2.45 : 1.90, 0.25);
  const exampleThree = exampleRatioMarker(exampleTrials[1], GOLD, P ? 1.33 : 0.95, 0.24);
  const exampleFive = exampleRatioMarker(exampleTrials[2], GOLD, P ? 2.03 : 1.58, 0.34);
  const luckyCaption = tag('EQUAL TRUE VARIANCES', fx(10.1), GRAPH_Y + (P ? 2.75 : 1.99), GREEN, 16, 3.35);

  await until(S(17));
  await play(
    ...remove(tailArrow, tailLabel, oneLine, oneTag),
    ...add(exampleTwo, exampleThree, exampleFive, luckyCaption),
    ...fbox(['ratios of 2, 3, even 5', 'happen by chance', ['equal true spreads', GREEN]], GREEN),
    ...say('LARGE RATIOS CAN HAPPEN JUST BY LUCK', GOLD)
  );

  // ------------------------------------------------------------
  // 18: NAME THE F DISTRIBUTION
  // ------------------------------------------------------------

  const fName = tag('THE F DISTRIBUTION', CX + 0.36, P ? 1.34 : 1.15, VIOLET, 21);
  const fisherNote = txt('F honours the statistician Fisher', fx(9.5), GRAPH_Y + (P ? 2.12 : 1.52), C.muted, 17, false, 3.80);

  await until(S(18));
  await play(
    ...remove(...histogramBars, counterNow, overflowText, exampleTwo, exampleThree, exampleFive, luckyCaption),
    ...add(fName, fisherNote),
    ...fbox([['F distribution', VIOLET], 'curve of spread ratios', 'F honours Fisher'], VIOLET),
    ...say('THIS SHAPE IS THE F DISTRIBUTION', VIOLET)
  );

  // ------------------------------------------------------------
  // 19: TWO DEGREES-OF-FREEDOM COUNTS
  // ------------------------------------------------------------

  const dfCardX = fx(9.4);
  const dfCardY = GRAPH_Y + (P ? 2.35 : 1.55);

  const dfCard = new M.VGroup(
    outline(dfCardX, dfCardY, 3.45, 1.57, VIOLET, 0.065),
    txt('TOP: C', dfCardX - 0.72, dfCardY + 0.39, PINK, 16),
    txt('4 − 1 = 3', dfCardX + 0.57, dfCardY + 0.39, PINK, 17, true, 1.75),
    line(dfCardX - 1.43, dfCardY, dfCardX + 1.43, dfCardY, C.muted, 1.3),
    txt('BOTTOM: A', dfCardX - 0.72, dfCardY - 0.39, BLUE, 16, false, 1.55),
    txt('4 − 1 = 3', dfCardX + 0.57, dfCardY - 0.39, BLUE, 17, true, 1.75)
  );

  const fDFTag = tag('F(3, 3)', dfCardX, dfCardY - 1.13, VIOLET, 21);

  await until(S(19));
  await play(
    ...remove(fisherNote),
    ...add(dfCard, fDFTag),
    ...fbox([['numerator df = 3', PINK], ['denominator df = 3', BLUE], ['F(3, 3)', VIOLET]], VIOLET),
    ...say('TWO COUNTS: THREE ABOVE AND THREE BELOW', VIOLET)
  );

  // ------------------------------------------------------------
  // UPPER-TAIL SHADING
  // ------------------------------------------------------------

  function tailArea(cutoff, color = VIOLET, opacity = 0.64, samples = 100) {
    const parts = [];
    const dx = (FMAX - cutoff) / samples;
    for (let k = 0; k < samples; k++) {
      const a = cutoff + dx * k;
      const b = a + dx;
      const mid = (a + b) / 2;
      const height = Math.max(0.001, fPDF(mid) * DENSITY_SCALE);
      parts.push(
        rect(fx(mid), GRAPH_Y + height / 2, fx(b) - fx(a) + 0.001, height, color, opacity, 0)
      );
    }
    return new M.VGroup(...parts);
  }

  function fBoundary(value, color, height) {
    return dashed(fx(value), GRAPH_Y, fx(value), GRAPH_Y + height, color);
  }

  // ------------------------------------------------------------
  // 20: WHERE DOES OUR RATIO OF 2.5 FALL?
  // ------------------------------------------------------------

  const observedHeight = P ? 1.74 : 1.27;
  const observedBoundary = fBoundary(FSTAT, GOLD, observedHeight);
  const observedDot = dot(fx(FSTAT), GRAPH_Y, GOLD, 0.12);
  const observedLabel = tag('F = 2.5', fx(FSTAT) + 0.22, GRAPH_Y + observedHeight + 0.29, GOLD, 19, 1.77);

  await until(S(20));
  await play(
    ...remove(dfCard, fDFTag),
    ...add(observedBoundary, observedDot, observedLabel),
    ...fbox(['our observed ratio', ['F = 2.5', GOLD], 'where does it fall?'], GOLD),
    ...say('FIND OUR 2.5 ON THE CURVE', GOLD)
  );

  // ------------------------------------------------------------
  // 21: RATIOS THIS BIG OR BIGGER HAPPEN ABOUT 24% OF THE TIME
  // ------------------------------------------------------------

  const observedShade = tailArea(FSTAT, VIOLET, 0.77);
  const pTag = tag('p ≈ 24%', fx(9.7), GRAPH_Y + (P ? 1.80 : 1.33), VIOLET, 23);
  const pCaption = txt('this large or larger', fx(9.7), GRAPH_Y + (P ? 1.30 : 0.89), VIOLET, 16);
  const pArrow = arrow(fx(8.3), GRAPH_Y + (P ? 1.01 : 0.70), fx(4.8), fy(4.8) - 0.025, VIOLET, 0.13);
  const tailContinues = arrow(fx(14.35), GRAPH_Y + 0.10, fx(15), GRAPH_Y + 0.10, VIOLET, 0.10);

  await until(S(21));
  await play(
    ...add(observedShade, pTag, pCaption, pArrow, tailContinues),
    ...fbox(['F = 2.5; df = 3 and 3', 'P(F ≥ 2.5)', ['≈ 0.24 = 24%', VIOLET]], VIOLET),
    ...say('ABOUT 24% ARE THIS BIG OR BIGGER', VIOLET)
  );

  // ------------------------------------------------------------
  // 22: THE UPPER FIVE-PERCENT CUTOFF IS ABOUT 9.3
  // ------------------------------------------------------------

  const criticalShade = tailArea(CRIT, GOLD, 0.83);
  const criticalHeight = P ? 1.20 : 0.91;
  const criticalBoundary = fBoundary(CRIT, GOLD, criticalHeight);
  const criticalDot = dot(fx(CRIT), GRAPH_Y, GOLD, 0.105);
  const criticalLabel = tag('9.28', fx(CRIT), GRAPH_Y + criticalHeight + 0.27, GOLD, 19, 1.53);
  const criticalPercent = tag('5% TAIL', fx(12.8), GRAPH_Y + (P ? 2.36 : 1.78), GOLD, 18, 1.95);
  const criticalArrow = arrow(fx(12.8), GRAPH_Y + (P ? 2.03 : 1.48), fx(11.4), fy(11.4) + 0.035, GOLD, 0.13);
  const criticalTailContinues = arrow(fx(14.35), GRAPH_Y + 0.10, fx(15), GRAPH_Y + 0.10, GOLD, 0.10);

  await until(S(22));
  await play(
    ...remove(observedShade, pTag, pCaption, pArrow, tailContinues),
    ...add(criticalShade, criticalBoundary, criticalDot, criticalLabel, criticalPercent, criticalArrow, criticalTailContinues),
    ...fbox(['upper 5% cutoff', ['F ≈ 9.28', GOLD], '2.5 is well below 9.28'], GOLD),
    ...say('ONLY 5% GO BEYOND ABOUT 9.3', GOLD)
  );

  // ------------------------------------------------------------
  // 23: 2.5 IS QUITE ORDINARY FOR GROUPS OF FOUR
  // ------------------------------------------------------------

  const ordinaryTag = tag('NOT UNUSUAL', fx(9.6), GRAPH_Y + (P ? 3.24 : 2.40), GREEN, 20);
  const evidenceGap = bracket(fx(FSTAT), fx(CRIT), GRAPH_Y + (P ? 0.85 : 0.62), GREEN, 0.08);

  await until(S(23));
  await play(
    ...add(ordinaryTag, evidenceGap),
    new M.Indicate(observedDot, { color: GREEN }),
    ...fbox(['2.5 < 9.28', 'p ≈ 24%  (> 5%)', ['no proof they differ', GREEN]], GREEN),
    ...say('NO CONVINCING EVIDENCE THAT THE SPREADS DIFFER', GREEN)
  );

  // ------------------------------------------------------------
  // 24: THE FORMULA — F = ONE VARIANCE / ANOTHER
  // ------------------------------------------------------------

  const formulaRatio = tag('F = 2.5', CX, ratioY, VIOLET, 22);

  await until(S(24));
  await play(
    ...replace(...divisionPicture(), formulaRatio),
    ...fbox(['F = var C ÷ var A', '  = (20/3) ÷ (8/3)', ['  = 2.5', VIOLET]], VIOLET),
    ...say('F = ONE VARIANCE DIVIDED BY ANOTHER', VIOLET)
  );

  // ------------------------------------------------------------
  // 25: MORE EXACTLY, EACH TOTAL IS ADJUSTED FOR df
  // ------------------------------------------------------------

  const EXACT_TOP = P ? 0.39 : 0.81;
  const EXACT_BOTTOM = P ? -1.83 : -1.16;

  function exactFractionRow(y, color, total, df, label) {
    return new M.VGroup(
      txt(label, CX, y + 0.66, color, 17),
      outline(CX - 1.35, y, 2.15, 0.77, color, 0.08),
      txt(total, CX - 1.35, y, color, 21, true),
      txt('÷', CX, y, GOLD, 25),
      outline(CX + 1.35, y, 2.15, 0.77, VIOLET, 0.07),
      txt(df, CX + 1.35, y, VIOLET, 20, true)
    );
  }

  const exactTop = exactFractionRow(EXACT_TOP, PINK, 'QC', 'dfC = 3', 'TOP CHI-SQUARE TOTAL');
  const exactBottom = exactFractionRow(EXACT_BOTTOM, BLUE, 'QA', 'dfA = 3', 'BOTTOM CHI-SQUARE TOTAL');
  const exactDivision = line(
    CX - 2.75, (EXACT_TOP + EXACT_BOTTOM) / 2,
    CX + 2.75, (EXACT_TOP + EXACT_BOTTOM) / 2,
    VIOLET, 3
  );
  const exactTitle = tag('INDEPENDENT CHI-SQUARE PIECES', CX, P ? -3.26 : -2.33, VIOLET, 17);

  await until(S(25));
  await play(
    ...replace(exactTop, exactDivision, exactBottom, exactTitle),
    ...fbox(['F = (Q1/df1)÷(Q2/df2)', 'two independent Qs', ['each divided by its df', VIOLET]], VIOLET),
    ...say('ADJUST EACH CHI-SQUARE TOTAL FOR ITS df', VIOLET)
  );

  await until(S(25) + 3.7);
  await play(
    ...fbox(['equal true spreads:', 'variance ratio', ['follows F(df1, df2)', GREEN]], GREEN),
    new M.Indicate(exactDivision, { color: VIOLET })
  );

  // ------------------------------------------------------------
  // 26: IN WORDS — A RATIO OF TWO FAIRLY MEASURED SPREADS
  // ------------------------------------------------------------

  await until(S(26));
  await play(
    ...replace(...ratioBlocksPicture()),
    ...fbox([['one estimated spread', PINK], 'divided by', ['another spread', BLUE]]),
    ...say('A RATIO OF TWO SPREADS, ADJUSTED FOR SIZE', VIOLET)
  );

  // ------------------------------------------------------------
  // 27: WHAT IS THE F DISTRIBUTION FOR?
  // ------------------------------------------------------------

  function simpleFPicture(cutoff = FSTAT, shaded = true) {
    const parts = [fAxis()];
    if (shaded) parts.push(tailArea(cutoff, VIOLET, 0.66));
    parts.push(
      sampledCurve(fx, fy, FMIN, FMAX, BLUE, 3.2, 150),
      fBoundary(cutoff, GOLD, P ? 1.65 : 1.20),
      dot(fx(cutoff), GRAPH_Y, GOLD, 0.11),
      tag(`F = ${cutoff.toFixed(1)}`, fx(cutoff) + 0.27, GRAPH_Y + (P ? 1.94 : 1.49), GOLD, 18, 1.90),
      tag('F(3, 3)', CX + 0.35, P ? 1.35 : 1.28, VIOLET, 19)
    );
    return parts;
  }

  const useCaption = txt('HOW UNUSUAL IS THIS RATIO?', fx(10.1), GRAPH_Y + (P ? 2.1 : 1.60), GREEN, 17, false, 3.25);

  await until(S(27));
  await play(
    ...replace(...simpleFPicture(), useCaption),
    ...fbox(['reference curve for', 'a ratio of two spreads', ['under equal spreads', VIOLET]], VIOLET),
    ...say('ASK CHANCE ABOUT A RATIO OF SPREADS')
  );

  // ------------------------------------------------------------
  // 28: PREVIEW ANALYSIS OF VARIANCE
  // ------------------------------------------------------------

  const ANOVA_XMIN = 14;
  const ANOVA_XMAX = 27;
  const ANOVA_W = P ? 5.95 : 6.00;
  const ax = v => CX - ANOVA_W / 2 + (v - ANOVA_XMIN) / (ANOVA_XMAX - ANOVA_XMIN) * ANOVA_W;

  const ANOVA_AY = P ? 0.60 : 1.02;
  const ANOVA_BY = P ? -0.86 : -0.05;
  const ANOVA_CY = P ? -2.32 : -1.12;

  function anovaBatchRow(values, y, color, name) {
    const m = mean(values);
    const parts = [
      line(ax(ANOVA_XMIN), y - 0.22, ax(ANOVA_XMAX), y - 0.22, C.muted, 1.3),
      txt(name, CX - 3.05, y + 0.42, color, 17, true, 0.45)
    ];

    values.forEach((v, k) => {
      const repeat = values.slice(0, k).filter(n => n === v).length;
      parts.push(dot(ax(v), y + repeat * 0.29, color, 0.10));
    });

    parts.push(
      dashed(ax(m), y - 0.22, ax(m), y + 0.53, color),
      txt(`mean ${m}`, ax(m), y - 0.47, color, 15, true, 1.45)
    );

    return new M.VGroup(...parts);
  }

  const anovaA = anovaBatchRow(A, ANOVA_AY, BLUE, 'A');
  const anovaB = anovaBatchRow(B, ANOVA_BY, GOLD, 'B');
  const anovaC = anovaBatchRow(BATCH_C, ANOVA_CY, PINK, 'C');
  const anovaAxisLabel = txt('battery life in hours', CX, ANOVA_CY - (P ? 0.90 : 0.78), C.muted, 15);
  const anovaPreviewTitle = tag('NEXT: ANOVA', CX, P ? -3.85 : -2.38, VIOLET, 20);
  const anovaGrandLine = dashed(ax(20), ANOVA_CY - 0.20, ax(20), ANOVA_AY + 0.58, C.muted);

  await until(S(28));
  await play(
    ...replace(anovaGrandLine, anovaA, anovaB, anovaC, anovaAxisLabel, anovaPreviewTitle),
    ...fbox(['analysis of variance', 'compare many means', ['via a ratio of spreads', VIOLET]], VIOLET),
    ...say('NEXT: COMPARE MANY MEANS WITH ANOVA', VIOLET)
  );

  // ------------------------------------------------------------
  // 29: THE TRAP — SMALL GROUPS GIVE SHAKY SPREAD ESTIMATES
  // ------------------------------------------------------------

  function nearestShakyTrial(target) {
    const candidates = trials.filter(t => {
      if (t.va < 0.8 || t.vc < 0.8) return false;
      const shownRatio = Number(t.vc.toFixed(2)) / Number(t.va.toFixed(2));
      return Math.abs(shownRatio - Number(t.ratio.toFixed(1))) < 0.06;
    });

    const pool = candidates.length ? candidates : trials;
    let best = pool[0];
    for (const trial of pool) {
      if (Math.abs(trial.ratio - target) < Math.abs(best.ratio - target)) best = trial;
    }
    return best;
  }

  const shakyTrials = [
    nearestShakyTrial(0.7),
    nearestShakyTrial(2.5),
    nearestShakyTrial(5.0)
  ];

  const SHAKY_SCALE = 5.0 / Math.max(...shakyTrials.flatMap(t => [t.va, t.vc]));
  const SHAKY_LEFT = CX - 2.50;
  const SHAKY_A_Y = P ? 0.34 : 0.51;
  const SHAKY_C_Y = P ? -1.65 : -1.01;

  function shakyRect(value, y, color) {
    const width = Math.max(0.08, value * SHAKY_SCALE);
    return rect(SHAKY_LEFT + width / 2, y, width, 0.41, color, 0.84);
  }

  function shakyValText(value, y, color) {
    return txt(`variance ≈ ${value.toFixed(2)}`, CX, y - 0.45, color, 18, true);
  }

  const shakyTitleA = txt('SIMULATED A: FOUR BATTERIES', CX, SHAKY_A_Y + 0.55, BLUE, 17);
  const shakyTitleC = txt('SIMULATED C: FOUR BATTERIES', CX, SHAKY_C_Y + 0.55, PINK, 17);
  const shakyRectA = shakyRect(shakyTrials[0].va, SHAKY_A_Y, BLUE);
  const shakyRectC = shakyRect(shakyTrials[0].vc, SHAKY_C_Y, PINK);
  let shakyValA = shakyValText(shakyTrials[0].va, SHAKY_A_Y, BLUE);
  let shakyValC = shakyValText(shakyTrials[0].vc, SHAKY_C_Y, PINK);
  const shakyRatioY = P ? -3.38 : -2.28;

  function shakyRatioTag(trial) {
    return tag(`C ÷ A ≈ ${trial.ratio.toFixed(1)}`, CX, shakyRatioY, VIOLET, 20);
  }

  let shakyRatioLabel = shakyRatioTag(shakyTrials[0]);

  function shakyUpdate(trial) {
    const nextValA = shakyValText(trial.va, SHAKY_A_Y, BLUE);
    const nextValC = shakyValText(trial.vc, SHAKY_C_Y, PINK);
    const nextLabel = shakyRatioTag(trial);

    const animations = [
      new M.Transform(shakyRectA, shakyRect(trial.va, SHAKY_A_Y, BLUE), { runTime: 0.85 }),
      new M.Transform(shakyRectC, shakyRect(trial.vc, SHAKY_C_Y, PINK), { runTime: 0.85 }),
      ...remove(shakyValA, shakyValC, shakyRatioLabel),
      ...add(nextValA, nextValC, nextLabel)
    ];

    shakyValA = nextValA;
    shakyValC = nextValC;
    shakyRatioLabel = nextLabel;
    return animations;
  }

  await until(S(29));
  await play(
    ...replace(shakyTitleA, shakyRectA, shakyValA, shakyTitleC, shakyRectC, shakyValC, shakyRatioLabel),
    ...fbox(['only 4 per group', 'equal true variances', ['ratios swing widely', GOLD]], GOLD),
    ...say('TRAP: SMALL GROUPS GIVE SHAKY ESTIMATES', GOLD)
  );

  await until(S(29) + 1.7);
  await play(...shakyUpdate(shakyTrials[1]));

  await until(S(29) + 3.1);
  await play(...shakyUpdate(shakyTrials[2]));

  // ------------------------------------------------------------
  // 30: A RATIO OF 2.5 CAN EASILY BE CHANCE
  // ------------------------------------------------------------

  const simulatedExtreme = trials.filter(trial => trial.ratio >= FSTAT).length;
  const simulatedPercent = 100 * simulatedExtreme / SIM_N;

  const chancePercentage = tag('THEORY: ≈ 24%', fx(10.0), GRAPH_Y + (P ? 2.22 : 1.63), VIOLET, 20, 3.10);
  const simulatedPercentage = txt(`simulation: ${simulatedPercent.toFixed(1)}%`, fx(10.0), GRAPH_Y + (P ? 1.63 : 1.08), GREEN, 17, true, 3.20);
  const simulationAgreement = txt('equal true spreads in both', fx(9.8), GRAPH_Y + 0.56, C.muted, 15, false, 3.80);

  await until(S(30));
  await play(
    ...replace(...simpleFPicture(), chancePercentage, simulatedPercentage, simulationAgreement),
    ...fbox(['ratio = 2.5', ['24% this big or bigger', VIOLET], 'easily by chance'], VIOLET),
    ...say('TWO AND A HALF CAN EASILY BE CHANCE', GOLD)
  );

  // ------------------------------------------------------------
  // 31: CHECK INDEPENDENCE AND NORMALITY
  // ------------------------------------------------------------

  const CHECK_TOP = P ? 0.45 : 0.65;
  const CHECK_BOTTOM = P ? -2.55 : -1.30;

  function independenceCard(y) {
    const parts = [
      outline(CX, y, 6.12, 1.74, GREEN, 0.045),
      txt('INDEPENDENT GROUPS', CX + 0.65, y + 0.40, GREEN, 18, false, 4.35),
      txt('different batteries', CX + 0.65, y - 0.03, C.ink, 16, false, 4.10),
      txt('no paired or shared batteries', CX + 0.65, y - 0.44, C.muted, 15, false, 4.30)
    ];

    const iconX = CX - 2.22;
    for (let k = 0; k < 4; k++) {
      const xx = iconX + (k % 2 - 0.5) * 0.34;
      const yy = y + (k < 2 ? 0.33 : -0.33);
      parts.push(dot(xx, yy, k < 2 ? BLUE : PINK, 0.085));
    }

    return new M.VGroup(...parts);
  }

  function normalityCard(y) {
    const iconX = CX - 2.22;
    const xx = z => iconX + z * 0.25;
    const yy = z => y - 0.45 + Math.exp(-z * z / 2) * 0.92;

    return new M.VGroup(
      outline(CX, y, 6.12, 1.74, GREEN, 0.045),
      line(xx(-2.4), y - 0.45, xx(2.4), y - 0.45, C.muted, 1.3),
      sampledCurve(xx, yy, -2.4, 2.4, BLUE, 2.3, 45),
      txt('BELL-SHAPED POPULATIONS', CX + 0.65, y + 0.40, GREEN, 17, false, 4.35),
      txt('exact F curve assumes normality', CX + 0.65, y - 0.04, C.ink, 15, false, 4.30),
      txt('4 readings cannot prove this', CX + 0.65, y - 0.43, C.muted, 15, false, 4.30)
    );
  }

  const independenceCheck = independenceCard(CHECK_TOP);
  const normalityCheck = normalityCard(CHECK_BOTTOM);

  await until(S(31));
  await play(
    ...replace(independenceCheck, normalityCheck),
    ...fbox([['independent groups', GREEN], ['roughly bell-shaped', GREEN], 'small groups: careful'], GREEN),
    ...say('CHECK INDEPENDENCE AND BELL-SHAPED POPULATIONS', GREEN)
  );

  // ------------------------------------------------------------
  // 32: ONE-SENTENCE SUMMARY
  // ------------------------------------------------------------

  const FINAL_LEFT = CX - 2.94;
  const FINAL_RIGHT = CX + 2.94;
  const FINAL_Y = P ? -4.06 : -2.13;
  const FINAL_SCALE = P ? 3.95 : 2.55;

  const finalX = v => FINAL_LEFT + v / FMAX * (FINAL_RIGHT - FINAL_LEFT);
  const finalY = v => FINAL_Y + fPDF(v) * FINAL_SCALE;

  const finalAxisParts = [line(finalX(0), FINAL_Y, finalX(FMAX), FINAL_Y, C.muted, 2.4)];

  [0, 1, 3, 5, 7, 9, 11, 13, 15].forEach(v => {
    finalAxisParts.push(
      line(finalX(v), FINAL_Y - 0.06, finalX(v), FINAL_Y + 0.06, C.muted, 1.3),
      txt(String(v), finalX(v), FINAL_Y - 0.27, C.muted, 15, true, 0.45)
    );
  });

  const finalAxis = new M.VGroup(...finalAxisParts);
  const finalCurve = sampledCurve(finalX, finalY, 0, FMAX, BLUE, 3.2, 125);

  const finalTailParts = [];
  const finalTailSamples = 80;
  const finalTailStep = (FMAX - FSTAT) / finalTailSamples;

  for (let k = 0; k < finalTailSamples; k++) {
    const a = FSTAT + k * finalTailStep;
    const b = a + finalTailStep;
    const mid = (a + b) / 2;
    const height = Math.max(0.001, fPDF(mid) * FINAL_SCALE);
    finalTailParts.push(
      rect(finalX(mid), FINAL_Y + height / 2, finalX(b) - finalX(a) + 0.001, height, VIOLET, 0.73, 0)
    );
  }

  const finalTail = new M.VGroup(...finalTailParts);

  const finalObserved = new M.VGroup(
    dashed(finalX(FSTAT), FINAL_Y, finalX(FSTAT), FINAL_Y + (P ? 1.23 : 0.82), GOLD),
    dot(finalX(FSTAT), FINAL_Y, GOLD, 0.10),
    tag('2.5', finalX(FSTAT) + 0.24, FINAL_Y + (P ? 1.53 : 1.10), GOLD, P ? 18 : 16, 1.12)
  );

  const finalTop = P ? 1.16 : 0.96;
  const finalEquationY = P ? 0.18 : 0.12;

  function finalVarianceTile(x, color, name, value) {
    return new M.VGroup(
      outline(x, finalTop, 2.43, 0.86, color, 0.075),
      txt(name, x, finalTop + 0.22, color, 15),
      txt(value, x, finalTop - 0.17, color, 21, true)
    );
  }

  const finalC = finalVarianceTile(CX - 1.57, PINK, 'C VARIANCE', '6.67');
  const finalA = finalVarianceTile(CX + 1.57, BLUE, 'A VARIANCE', '2.67');
  const finalDivide = txt('÷', CX, finalTop, VIOLET, 25);
  const finalEquation = txt('F = (20/3) ÷ (8/3) = 2.5', CX, finalEquationY, VIOLET, 21, true);
  const finalDF = tag('F(3, 3)', finalX(10.7), FINAL_Y + (P ? 2.14 : 1.23), VIOLET, 18);
  const finalP = tag('p ≈ 24%', finalX(10.7), FINAL_Y + (P ? 1.35 : 0.58), GREEN, 18);
  const finalCaption = txt('RATIO OF VARIANCES UNDER EQUAL TRUE SPREADS', CX, FINAL_Y - 0.71, C.muted, 15);

  await until(S(32));
  await play(
    ...replace(
      finalAxis,
      finalTail,
      finalCurve,
      finalObserved,
      finalC,
      finalA,
      finalDivide,
      finalEquation,
      finalDF,
      finalP,
      finalCaption
    ),
    ...fbox(['F = ratio of 2 spreads', ['df = 3 and 3', VIOLET], ['our F = 2.5; p ≈ 24%', GREEN]], VIOLET),
    ...say('HOW VARIANCE RATIOS SWING BY CHANCE', VIOLET)
  );

  await until(E(32));
}
