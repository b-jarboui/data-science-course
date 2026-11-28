// lesson 3.4.1
// Expressions and variables: converting a greenhouse temperature.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Laptop: 14.22 x 8. Phone: 8 x 14.22.
  const PILL = P ? [0, 3.65, 0] : [0, 1.85, 0];
  const CODE_Y = P ? 2.15 : 0.85;
  const BOX_Y = P ? -0.25 : -0.65;
  const WORK_Y = P ? -2.85 : -2.30;
  const VX = P ? 1.75 : 2.65;
  const BOX_W = P ? 2.65 : 3.05;
  const BOX_H = P ? 1.85 : 1.45;
  const CODE_W = P ? FW - 0.85 : 9.6;

  const FP = [-VX, BOX_Y, 0];
  const CP = [VX, BOX_Y, 0];

  const D1 = [20, 22, 25, 30, 24, 21, 26];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const FORMULA = 'temp_c = (temp_f - 32) * 5 / 9';
  const WRONG = 'temp_c = temp_f - 32 * 5 / 9';

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Track visible objects individually. Never regroup visible objects
  // inside a new VGroup to highlight or reposition them.
  const visible = new Map();

  function put(key, obj) {
    const a = [];
    if (visible.has(key)) {
      a.push(new M.FadeOut(visible.get(key)));
    }
    visible.set(key, obj);
    a.push(new M.FadeIn(obj));
    return a;
  }

  function drop(...keys) {
    const a = [];
    for (const key of keys) {
      if (!visible.has(key)) continue;
      a.push(new M.FadeOut(visible.get(key)));
      visible.delete(key);
    }
    return a;
  }

  function clear() {
    return drop(...Array.from(visible.keys()));
  }

  function mark(key, color = C.amber) {
    const obj = visible.get(key);
    if (!obj) return [];
    // Indicate on a lone Text can leave it faded: flash around the text instead.
    if (typeof obj.getText === 'function') return [new M.Flash(obj, { color, flashRadius: 0.55 })];
    return [new M.Indicate(obj, { color })];
  }

  // After a Transform, swap the moved object for a fresh copy of the target (full opacity, no ghost).
  function settle(key, fresh) {
    const old = visible.get(key);
    if (old) sc.remove(old);
    sc.add(fresh);
    visible.set(key, fresh);
  }

  function moveKey(from, to, target, options = {}) {
    const obj = visible.get(from);
    if (!obj) return put(to, target);

    const a = [];

    if (from !== to && visible.has(to)) {
      a.push(new M.FadeOut(visible.get(to)));
    }

    visible.delete(from);
    visible.set(to, obj);

    a.push(new M.Transform(obj, target, options));
    return a;
  }

  function fit(t, maxw) {
    const w = t.getWidth();
    if (w > maxw) t.scale(maxw / w);
    return t;
  }

  function text(s, size, color, p, mono = false, maxw = FW - 1) {
    const t = fit(T(s, size, color, mono), maxw);
    t.moveTo(p);
    return t;
  }

  function rect(w, h, p, color = C.cyan, fill = C.card, opacity = 0.95, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.15,
      color,
      strokeWidth: sw
    });
    r.setFill(fill, opacity);
    r.moveTo(p);
    return r;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function arrow(a, b, color = C.amber) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const h = 0.17;
    const w = 0.10;

    return new M.VGroup(
      line(a, b, color, 3),
      line(
        b,
        [b[0] - h * ux - w * uy, b[1] - h * uy + w * ux, 0],
        color,
        3
      ),
      line(
        b,
        [b[0] - h * ux + w * uy, b[1] - h * uy - w * ux, 0],
        color,
        3
      )
    );
  }

  function tag(s, color, p, size = 17) {
    const t = pill(s, color, size);
    fit(t, FW - 1);
    t.moveTo(p);
    return t;
  }

  function dot(p, radius, color, opacity = 1) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });
    d.setFill(color, opacity);
    return d;
  }

  // ------------------------------------------------------------
  // Picture helpers: greenhouse, sensor and supplier thermometer.
  // ------------------------------------------------------------

  const GP = P ? [0, 0.95, 0] : [-3.1, -0.25, 0];
  const TP = P ? [0, -2.65, 0] : [3.35, -0.25, 0];

  function plant(x, y) {
    const pot = new M.Rectangle({
      width: 0.38,
      height: 0.25,
      color: C.amber,
      strokeWidth: 1
    });
    pot.setFill(C.amber, 0.38);
    pot.moveTo([x, y, 0]);

    const stem = line(
      [x, y + 0.12, 0],
      [x, y + 0.78, 0],
      C.green,
      3
    );

    const left = new M.Circle({
      radius: 0.15,
      color: C.green,
      strokeWidth: 1
    });
    left.setFill(C.green, 0.72);
    left.moveTo([x - 0.15, y + 0.48, 0]);

    const right = new M.Circle({
      radius: 0.15,
      color: C.green,
      strokeWidth: 1
    });
    right.setFill(C.green, 0.72);
    right.moveTo([x + 0.15, y + 0.65, 0]);

    const top = new M.Circle({
      radius: 0.13,
      color: C.green,
      strokeWidth: 1
    });
    top.setFill(C.green, 0.8);
    top.moveTo([x, y + 0.83, 0]);

    return new M.VGroup(pot, stem, left, right, top);
  }

  function greenhouse(p) {
    const x = p[0];
    const y = p[1];
    const w = P ? 4.75 : 4.55;
    const h = 1.80;

    const left = x - w / 2;
    const right = x + w / 2;
    const floorY = y - 1.0;
    const roofY = floorY + h;
    const peakY = roofY + 0.83;

    const glass = new M.Rectangle({
      width: w,
      height: h,
      color: C.green,
      strokeWidth: 2
    });
    glass.setFill(C.green, 0.055);
    glass.moveTo([x, floorY + h / 2, 0]);

    const roof1 = line(
      [left, roofY, 0],
      [x, peakY, 0],
      C.green,
      3
    );

    const roof2 = line(
      [x, peakY, 0],
      [right, roofY, 0],
      C.green,
      3
    );

    const frame1 = line(
      [x - w / 6, floorY, 0],
      [x - w / 6, roofY, 0],
      C.green,
      1
    );

    const frame2 = line(
      [x + w / 6, floorY, 0],
      [x + w / 6, roofY, 0],
      C.green,
      1
    );

    const ground = line(
      [left - 0.2, floorY, 0],
      [right + 0.2, floorY, 0],
      C.green,
      3
    );

    const plants = [-1.45, -0.48, 0.48, 1.45].map(
      dx => plant(x + dx, floorY + 0.22)
    );

    const lab = text(
      'GREENHOUSE',
      19,
      C.green,
      [x, floorY - 0.48, 0]
    );

    return new M.VGroup(
      glass,
      roof1,
      roof2,
      frame1,
      frame2,
      ground,
      ...plants,
      lab
    );
  }

  const SENSOR_P = [GP[0] + 1.42, GP[1] + 0.38, 0];

  function sensor() {
    const x = SENSOR_P[0];
    const y = SENSOR_P[1];

    const halo = new M.Circle({
      radius: 0.39,
      color: C.cyan,
      strokeWidth: 1
    });
    halo.setFill(C.cyan, 0.10);
    halo.moveTo([x, y, 0]);

    const body = rect(
      0.58,
      0.38,
      [x, y, 0],
      C.cyan,
      C.card,
      1,
      2
    );

    const led = dot(
      [x - 0.16, y, 0],
      0.05,
      C.green
    );

    const display = line(
      [x - 0.02, y, 0],
      [x + 0.15, y, 0],
      C.cyan,
      2
    );

    const lab = text(
      'sensor',
      15,
      C.cyan,
      [x, y + 0.50, 0]
    );

    return new M.VGroup(halo, body, led, display, lab);
  }

  function thermometer(p) {
    const x = p[0] - 0.90;
    const y = p[1] + 0.10;

    const tube = rect(
      0.42,
      1.72,
      [x, y + 0.23, 0],
      C.ink,
      C.card,
      1,
      2
    );

    const mercury = new M.Rectangle({
      width: 0.13,
      height: 1.12,
      color: C.amber,
      strokeWidth: 1
    });
    mercury.setFill(C.amber, 1);
    mercury.moveTo([x, y - 0.03, 0]);

    const bulb = new M.Circle({
      radius: 0.28,
      color: C.amber,
      strokeWidth: 2
    });
    bulb.setFill(C.amber, 0.95);
    bulb.moveTo([x, y - 0.75, 0]);

    const ticks = Array.from({ length: 6 }, (_, i) => {
      const ty = y - 0.38 + i * 0.25;
      return line(
        [x + 0.24, ty, 0],
        [x + 0.40, ty, 0],
        C.muted,
        1
      );
    });

    const lab = text(
      "SUPPLIER'S THERMOMETER",
      P ? 18 : 17,
      C.muted,
      [p[0], p[1] - 1.40, 0],
      false,
      5.2
    );

    return new M.VGroup(tube, mercury, bulb, ...ticks, lab);
  }

  function supplierReading(value, unit = '') {
    const p = [TP[0] + 0.75, TP[1] + 0.35, 0];

    const panel = rect(
      2.10,
      1.15,
      p,
      C.amber,
      C.card,
      0.96
    );

    const n = text(
      `${value}${unit}`,
      P ? 39 : 36,
      C.amber,
      p,
      true,
      1.85
    );

    return new M.VGroup(panel, n);
  }

  // ------------------------------------------------------------
  // Hand calculation: one paper strip, three successive steps.
  // ------------------------------------------------------------

  const PAPER_P = P ? [0, -0.30, 0] : [0, -0.40, 0];
  const PAPER_W = P ? 6.35 : 7.8;
  const PAPER_H = P ? 5.15 : 4.25;
  const ROW_H = P ? 1.06 : 0.83;

  const paperRowY = i =>
    PAPER_P[1] + (P ? 1.05 : 0.76) - i * ROW_H;

  function paper() {
    const x = PAPER_P[0];
    const y = PAPER_P[1];

    const sheet = rect(
      PAPER_W,
      PAPER_H,
      PAPER_P,
      C.muted,
      C.card,
      0.98,
      2
    );

    const heading = text(
      'FAHRENHEIT → CELSIUS',
      P ? 24 : 23,
      C.ink,
      [x, y + PAPER_H / 2 - 0.48, 0]
    );

    const separator = line(
      [x - PAPER_W / 2 + 0.35, y + PAPER_H / 2 - 0.85, 0],
      [x + PAPER_W / 2 - 0.35, y + PAPER_H / 2 - 0.85, 0],
      C.muted,
      1
    );

    const guides = [];

    for (let i = 0; i < 3; i++) {
      guides.push(
        text(
          String(i + 1),
          19,
          C.muted,
          [x - PAPER_W / 2 + 0.48, paperRowY(i), 0],
          true
        )
      );

      guides.push(
        line(
          [x - PAPER_W / 2 + 0.85, paperRowY(i) - ROW_H * 0.43, 0],
          [x + PAPER_W / 2 - 0.30, paperRowY(i) - ROW_H * 0.43, 0],
          C.muted,
          1
        )
      );
    }

    return new M.VGroup(sheet, heading, separator, ...guides);
  }

  function paperStep(i, operation, equation, color = C.amber) {
    const y = paperRowY(i);

    const op = text(
      operation,
      P ? 20 : 19,
      C.muted,
      [-PAPER_W * 0.24, y + 0.23, 0],
      false,
      PAPER_W * 0.39
    );

    const eq = text(
      equation,
      P ? 29 : 28,
      color,
      [PAPER_W * 0.13, y - 0.08, 0],
      true,
      PAPER_W * 0.60
    );

    return new M.VGroup(op, eq);
  }

  function paperFocus(i) {
    const r = rect(
      PAPER_W - 0.34,
      ROW_H - 0.06,
      [PAPER_P[0], paperRowY(i), 0],
      C.amber,
      C.card,
      0,
      2
    );

    return r;
  }

  function paperResult() {
    return text(
      '77°F  =  25°C',
      P ? 31 : 29,
      C.green,
      [PAPER_P[0], PAPER_P[1] - PAPER_H / 2 + 0.40, 0],
      true,
      PAPER_W - 0.7
    );
  }

  function miniPaper(p, label, color = C.muted) {
    const r = rect(
      1.85,
      2.25,
      p,
      color,
      C.card,
      0.96
    );

    const lines = [0.45, 0.10, -0.25].map(dy =>
      line(
        [p[0] - 0.58, p[1] + dy, 0],
        [p[0] + 0.58, p[1] + dy, 0],
        color,
        2
      )
    );

    const lab = text(
      label,
      17,
      color,
      [p[0], p[1] - 0.70, 0],
      false,
      1.60
    );

    return new M.VGroup(r, ...lines, lab);
  }

  // ------------------------------------------------------------
  // Notebook helpers.
  // Code is actual Python. Mathematical working uses × and ÷.
  // ------------------------------------------------------------

  function codeTokens(parts, p, maxw, size = P ? 25 : 24) {
    const ts = parts.map(part => {
      const row = Array.isArray(part) ? part : [part, C.ink];
      return T(row[0], size, row[1], true);
    });

    const widths = ts.map(t => t.getWidth());
    const total = widths.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, maxw / Math.max(total, 0.001));

    let left = p[0] - total * scale / 2;
    const bounds = [];

    ts.forEach((t, i) => {
      if (scale < 1) t.scale(scale);

      const w = widths[i] * scale;

      t.moveTo([left + w / 2, p[1], 0]);
      bounds.push([left, left + w]);
      left += w;
    });

    return { ts, bounds };
  }

  function cell(parts, options = {}) {
    const y = options.y === undefined ? CODE_Y : options.y;
    const w = options.w || CODE_W;
    const h = options.h || (P ? 1.15 : 0.90);
    const color = options.color || C.cyan;
    const p = [0, y, 0];

    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98,
      2
    );

    const headerY = y + h / 2 - 0.18;
    const codeY = y - 0.12;

    const prompt = text(
      options.running ? 'In [*]' : 'In [ ]',
      16,
      C.muted,
      [-w / 2 + 0.55, headerY, 0],
      true
    );

    const runButton = text(
      '▶ RUN',
      16,
      options.running ? C.green : C.muted,
      [w / 2 - 0.57, headerY, 0],
      true
    );

    const row = codeTokens(
      parts,
      [0, codeY, 0],
      w - 0.70,
      options.size || (P ? 25 : 24)
    );

    const highlights = [];

    if (options.highlight && row.bounds.length) {
      const [first, last, hc] = options.highlight;

      const left = row.bounds[first][0] - 0.08;
      const right = row.bounds[last][1] + 0.08;

      const outline = rect(
        right - left,
        P ? 0.52 : 0.43,
        [(left + right) / 2, codeY, 0],
        hc || C.amber,
        C.card,
        0,
        2
      );

      highlights.push(outline);
    }

    return new M.VGroup(
      frame,
      prompt,
      runButton,
      ...highlights,
      ...row.ts
    );
  }

  function conversionCode(options = {}) {
    const parts = [
      ['temp_c', C.green],
      [' = ', C.ink],
      ['(', C.ink],
      ['temp_f', C.cyan],
      [' - 32', C.amber],
      [')', C.ink],
      [' * 5 / 9', C.ink]
    ];

    return cell(parts, options);
  }

  function wrongCode(options = {}) {
    const parts = [
      ['temp_c', C.green],
      [' = ', C.ink],
      ['temp_f', C.cyan],
      [' - ', C.ink],
      ['32 * 5 / 9', C.amber]
    ];

    return cell(parts, options);
  }

  function notebookPage() {
    const w = P ? 6.65 : 9.6;
    const h = P ? 5.7 : 4.35;
    const p = P ? [0, -0.25, 0] : [0, -0.45, 0];

    const frame = rect(w, h, p, C.muted, C.card, 0.65);

    const title = text(
      'greenhouse.ipynb',
      21,
      C.ink,
      [0, p[1] + h / 2 - 0.40, 0],
      true,
      w - 0.6
    );

    const top = p[1] + h / 2 - 0.75;

    const separator = line(
      [-w / 2 + 0.28, top, 0],
      [w / 2 - 0.28, top, 0],
      C.muted,
      1
    );

    return new M.VGroup(frame, title, separator);
  }

  const DEMO_Y = P ? 0.70 : 0.08;
  const DEMO_W = P ? 5.95 : 8.65;

  function emptyCell(y) {
    const r = rect(
      DEMO_W,
      P ? 1.10 : 0.80,
      [0, y, 0],
      C.muted,
      C.card,
      0.96,
      1
    );

    const lab = text(
      'In [ ]',
      15,
      C.muted,
      [-DEMO_W / 2 + 0.60, y, 0],
      true
    );

    return new M.VGroup(r, lab);
  }

  function notebookOutput(value) {
    const y = P ? -0.70 : -0.90;

    const lab = text(
      'Out:',
      17,
      C.muted,
      [-DEMO_W / 2 + 0.60, y, 0],
      true
    );

    const val = text(
      String(value),
      31,
      C.green,
      [-DEMO_W / 2 + 1.55, y, 0],
      true
    );

    return new M.VGroup(lab, val);
  }

  // ------------------------------------------------------------
  // Variable helpers: labelled containers and independent values.
  // ------------------------------------------------------------

  function valueP(p) {
    return [p[0], p[1] - BOX_H * 0.15, 0];
  }

  function labelP(p) {
    return [p[0], p[1] + BOX_H * 0.31, 0];
  }

  function variableFrame(p, color = C.cyan) {
    const outer = rect(
      BOX_W + 0.13,
      BOX_H + 0.13,
      p,
      color,
      color,
      0.045,
      1
    );

    const inner = rect(
      BOX_W,
      BOX_H,
      p,
      color,
      C.card,
      0.98,
      2
    );

    const separator = line(
      [p[0] - BOX_W / 2 + 0.18, p[1] + BOX_H * 0.14, 0],
      [p[0] + BOX_W / 2 - 0.18, p[1] + BOX_H * 0.14, 0],
      color,
      1
    );

    return new M.VGroup(outer, inner, separator);
  }

  function variableLabel(name, p, color = C.cyan) {
    return text(
      name,
      P ? 24 : 25,
      color,
      labelP(p),
      true,
      BOX_W - 0.35
    );
  }

  function variableValue(value, p, color = C.ink) {
    return text(
      String(value),
      P ? 46 : 40,
      color,
      valueP(p),
      true,
      BOX_W - 0.45
    );
  }

  function emptyValue(p) {
    return text(
      '· · ·',
      26,
      C.muted,
      valueP(p),
      true
    );
  }

  function looseValue(value, p, color = C.amber) {
    return text(
      String(value),
      P ? 46 : 40,
      color,
      p,
      true,
      2.5
    );
  }

  function variableUnit(s, p, color = C.muted) {
    return text(
      s,
      P ? 18 : 17,
      color,
      [p[0], p[1] - BOX_H / 2 - 0.24, 0],
      false,
      BOX_W + 0.35
    );
  }

  function workCard(lines, color = C.amber) {
    const w = P ? 6.30 : 8.30;
    const h = P ? 1.42 : 0.91;
    const p = [0, WORK_Y, 0];

    const r = rect(w, h, p, color, C.card, 0.98, 2);
    const lh = P ? 0.43 : 0.33;

    const rows = lines.map((item, i) => {
      const row = Array.isArray(item) ? item : [item, color];

      return text(
        row[0],
        lines.length > 1 ? (P ? 21 : 19) : (P ? 27 : 25),
        row[1],
        [0, WORK_Y + ((lines.length - 1) / 2 - i) * lh, 0],
        true,
        w - 0.45
      );
    });

    return new M.VGroup(r, ...rows);
  }

  // Keep the answer separate from its working so it can physically
  // move into temp_c after the expression has been evaluated.
  function equation(lhs, result, color = C.amber) {
    const w = P ? 5.95 : 7.0;
    const h = P ? 1.35 : 0.90;
    const resultX = w * 0.29;

    const frame = rect(
      w,
      h,
      [0, WORK_Y, 0],
      color,
      C.card,
      0.98
    );

    const lab = text(
      lhs,
      P ? 27 : 25,
      C.ink,
      [-w * 0.15, WORK_Y, 0],
      true,
      w * 0.60
    );

    const answer = text(
      String(result),
      P ? 34 : 29,
      color,
      [resultX, WORK_Y, 0],
      true,
      w * 0.24
    );

    return { frame: new M.VGroup(frame, lab), answer };
  }

  function setEquation(lhs, result, color = C.amber) {
    const eq = equation(lhs, result, color);

    return [
      ...put('work', eq.frame),
      ...put('workResult', eq.answer)
    ];
  }

  function paperComparison(value) {
    return workCard([
      ['ON PAPER', C.muted],
      [`${value}°C`, C.green]
    ], C.green);
  }

  // ------------------------------------------------------------
  // Week preview, using the fixed shared chapter data.
  // ------------------------------------------------------------

  function weekBox(i, y) {
    const sp = P ? 0.93 : 1.34;
    const w = P ? 0.80 : 1.13;
    const h = P ? 1.03 : 1.20;
    const x = (i - 3) * sp;

    const halo = rect(
      w + 0.08,
      h + 0.08,
      [x, y, 0],
      C.cyan,
      C.cyan,
      0.06,
      1
    );

    const r = rect(
      w,
      h,
      [x, y, 0],
      C.cyan,
      C.card,
      0.97,
      2
    );

    const day = text(
      DAYS[i],
      P ? 14 : 17,
      C.muted,
      [x, y + h / 2 + 0.29, 0]
    );

    const n = text(
      String(D1[i]),
      P ? 27 : 32,
      C.cyan,
      [x, y, 0],
      true,
      w - 0.10
    );

    const index = text(
      String(i),
      P ? 15 : 18,
      C.muted,
      [x, y - h / 2 - 0.33, 0],
      true
    );

    return new M.VGroup(halo, r, day, n, index);
  }

  // ============================================================
  // 0-5: The greenhouse and two temperature scales.
  // ============================================================

  // 0. Imagine a small greenhouse with one temperature sensor.
  await until(S(0));
  await play(
    ...put('greenhouse', greenhouse(GP)),
    ...put('sensor', sensor()),
    ...say('ONE GREENHOUSE, ONE SENSOR', C.green)
  );

  // 1. Every day at noon, the sensor records degrees Celsius.
  await until(S(1));

  const noonP = [GP[0], GP[1] - 2.05, 0];

  await play(
    ...put('noon', tag('12:00 NOON · °C', C.cyan, noonP, 17)),
    new M.Flash(visible.get('sensor'), { color: C.cyan }),
    ...say('EVERY DAY AT NOON')
  );

  // 2. A supplier sends a reading from another thermometer.
  await until(S(2));
  await play(
    ...drop('noon'),
    ...put('supplier', thermometer(TP)),
    ...say("A SUPPLIER'S READING", C.amber)
  );

  // 3. The thermometer says 77, but uses Fahrenheit.
  await until(S(3));

  const cScale = tag(
    'CELSIUS · °C',
    C.green,
    [GP[0], GP[1] - 2.04, 0],
    16
  );

  const fScale = tag(
    'FAHRENHEIT · °F',
    C.amber,
    [TP[0], TP[1] - 1.88, 0],
    16
  );

  await play(
    ...put('cScale', cScale),
    ...put('supplierReading', supplierReading(77, '°F')),
    ...put('fScale', fScale),
    ...say('TWO DIFFERENT TEMPERATURE SCALES', C.amber)
  );

  // 4. Is 77 Fahrenheit hot or normal?
  await until(S(4));

  const questionP = P ? [2.70, -2.65, 0] : [0, -0.15, 0];

  await play(
    ...put('question', text('?', 48, C.violet, questionP)),
    ...mark('supplierReading', C.amber),
    ...say('HOT OR NORMAL?', C.violet)
  );

  // 5. We must convert Fahrenheit into Celsius.
  await until(S(5));

  const convY = P ? -0.25 : -0.45;
  const convX = P ? 2.0 : 2.65;

  const fCard = new M.VGroup(
    rect(
      P ? 2.65 : 3.25,
      1.65,
      [-convX, convY, 0],
      C.amber
    ),
    text(
      '77°F',
      P ? 38 : 42,
      C.amber,
      [-convX, convY + 0.13, 0],
      true
    ),
    text(
      'Fahrenheit',
      17,
      C.muted,
      [-convX, convY - 0.48, 0]
    )
  );

  const cCard = new M.VGroup(
    rect(
      P ? 2.65 : 3.25,
      1.65,
      [convX, convY, 0],
      C.green
    ),
    text(
      '?°C',
      P ? 38 : 42,
      C.green,
      [convX, convY + 0.13, 0],
      true
    ),
    text(
      'Celsius',
      17,
      C.muted,
      [convX, convY - 0.48, 0]
    )
  );

  await play(
    ...clear(),
    ...put('fCard', fCard),
    ...put('cCard', cCard),
    ...put(
      'conversionArrow',
      arrow(
        [P ? -0.55 : -0.85, convY, 0],
        [P ? 0.55 : 0.85, convY, 0],
        C.cyan
      )
    ),
    ...say('CONVERSION: CHANGE THE SCALE')
  );

  // ============================================================
  // 6-11: Work it out on paper.
  // ============================================================

  // 6. A little strip of paper, in three steps.
  await until(S(6));
  await play(
    ...clear(),
    ...put('paper', paper()),
    ...say('THREE STEPS, BY HAND', C.amber)
  );

  // 7. Take away 32: 77 - 32 = 45.
  await until(S(7));
  await play(
    ...put('step0', paperStep(0, 'Take away 32', '77 − 32 = 45')),
    ...put('paperFocus', paperFocus(0)),
    ...say('STEP 1: SUBTRACT 32', C.amber)
  );

  // 8. Multiply by 5: 45 x 5 = 225.
  await until(S(8));
  await play(
    ...put('step1', paperStep(1, 'Multiply by 5', '45 × 5 = 225')),
    ...put('paperFocus', paperFocus(1)),
    ...say('STEP 2: MULTIPLY BY 5', C.amber)
  );

  // 9. Divide by 9: 225 / 9 = 25.
  await until(S(9));
  await play(
    ...put('step2', paperStep(2, 'Divide by 9', '225 ÷ 9 = 25', C.green)),
    ...put('paperFocus', paperFocus(2)),
    ...say('STEP 3: DIVIDE BY 9', C.green)
  );

  // 10. 77 Fahrenheit is 25 Celsius, a normal mild day.
  await until(S(10));
  await play(
    ...drop('paperFocus'),
    ...put('paperResult', paperResult()),
    ...say('25°C: A NORMAL, MILD DAY', C.green)
  );

  // 11. Repeating these steps by hand is slow and error-prone.
  await until(S(11));

  const paperY = P ? -0.05 : -0.40;
  const paperSP = P ? 2.05 : 2.65;

  const repeated = [
    miniPaper([-paperSP, paperY, 0], 'Today', C.cyan),
    miniPaper([0, paperY, 0], 'Tomorrow', C.muted),
    miniPaper([paperSP, paperY, 0], 'Next day', C.muted)
  ];

  visible.set('repeat0', repeated[0]);
  visible.set('repeat1', repeated[1]);
  visible.set('repeat2', repeated[2]);

  await play(
    ...drop('paper', 'step0', 'step1', 'step2', 'paperResult'),
    new M.LaggedStart(
      repeated.map(r => new M.FadeIn(r)),
      { lagRatio: 0.18, runTime: 1.25 }
    ),
    ...say('THE SAME WORK, AGAIN AND AGAIN', C.amber)
  );

  // ============================================================
  // 12-15: Introduce code and the notebook.
  // ============================================================

  // 12. Ask a computer to do it using code.
  await until(S(12));

  const introY = P ? 0.10 : -0.35;

  const codeIntro = new M.VGroup(
    rect(
      P ? 5.9 : 7.5,
      2.25,
      [0, introY, 0],
      C.cyan,
      C.card,
      0.98
    ),
    text(
      '77 - 32',
      P ? 35 : 38,
      C.cyan,
      [0, introY + 0.40, 0],
      true
    ),
    text(
      'Instructions for the computer',
      P ? 20 : 22,
      C.ink,
      [0, introY - 0.48, 0],
      false,
      P ? 5.3 : 7.0
    )
  );

  await play(
    ...clear(),
    ...put('codeIntro', codeIntro),
    ...say('CODE = INSTRUCTIONS', C.cyan)
  );

  // 13. A notebook is a page made of boxes called cells.
  await until(S(13));
  await play(
    ...clear(),
    ...put('notebook', notebookPage()),
    ...put('demoCell', emptyCell(DEMO_Y)),
    ...put(
      'nextCell',
      emptyCell(P ? -2.05 : -1.98)
    ),
    ...say('NOTEBOOK = A PAGE OF CELLS')
  );

  // 14. Type code into a cell and press Run.
  await until(S(14));
  await play(
    ...put(
      'demoCell',
      cell(
        [
          ['77', C.cyan],
          [' - ', C.ink],
          ['32', C.amber]
        ],
        {
          y: DEMO_Y,
          w: DEMO_W,
          running: true,
          h: P ? 1.10 : 0.80
        }
      )
    ),
    ...say('RUN = CARRY OUT THE CODE', C.green)
  );

  // 15. The result appears right below the cell.
  await until(S(15));
  await play(
    ...put('demoOutput', notebookOutput(45)),
    ...say('THE RESULT APPEARS BELOW', C.green)
  );

  // ============================================================
  // 16-23: A variable is a named box holding a value.
  // ============================================================

  // 16. First, store the supplier's number.
  await until(S(16));

  const incomingP = [VX, BOX_Y - BOX_H * 0.15, 0];

  await play(
    ...clear(),
    ...put('incoming', looseValue(77, incomingP)),
    ...put(
      'incomingLabel',
      text(
        "Supplier's reading",
        P ? 19 : 20,
        C.muted,
        [VX, BOX_Y + BOX_H * 0.48, 0],
        false,
        BOX_W + 0.50
      )
    ),
    ...say("STORE THE SUPPLIER'S NUMBER")
  );

  // 17. Picture a small box with a label: temp f.
  await until(S(17));
  await play(
    ...put('fBox', variableFrame(FP, C.cyan)),
    ...put('fLabel', variableLabel('temp f', FP, C.cyan)),
    ...put('fEmpty', emptyValue(FP)),
    ...put('fUnit', variableUnit('Fahrenheit', FP)),
    ...say('A BOX WITH A NAME')
  );

  // 18. An underscore joins the two parts of the name.
  await until(S(18));

  const underscoreY = P ? 1.50 : 0.82;

  const underscoreDemo = new M.VGroup(
    text(
      'temp f',
      25,
      C.muted,
      [-1.80, underscoreY, 0],
      true
    ),
    arrow(
      [-0.65, underscoreY, 0],
      [0.65, underscoreY, 0],
      C.amber
    ),
    text(
      'temp_f',
      27,
      C.cyan,
      [1.80, underscoreY, 0],
      true
    )
  );

  await play(
    ...put('fLabel', variableLabel('temp_f', FP, C.cyan)),
    ...put('underscoreDemo', underscoreDemo),
    ...say('USE AN UNDERSCORE, NOT A SPACE', C.amber)
  );

  // 19. Put 77 inside the box.
  await until(S(19));
  await play(
    ...drop('fEmpty', 'incomingLabel', 'underscoreDemo'),
    ...moveKey(
      'incoming',
      'fValue',
      variableValue(77, FP, C.amber),
      { pathArc: 0.35 }
    ),
    ...say('PUT 77 INSIDE THE BOX', C.amber)
  );
  settle('fValue', variableValue(77, FP, C.amber));

  // 20. The code reads: temp_f = 77.
  await until(S(20));
  await play(
    ...put(
      'code',
      cell([
        ['temp_f', C.cyan],
        [' = ', C.ink],
        ['77', C.amber]
      ])
    ),
    ...say('NAME = VALUE')
  );

  // 21. This labelled box is called a variable.
  await until(S(21));

  const definition = workCard([
    ['VARIABLE', C.cyan],
    ['A name that holds a value', C.ink]
  ], C.cyan);

  await play(
    ...put('work', definition),
    ...mark('fBox', C.cyan),
    ...say('VARIABLE = A NAMED BOX')
  );

  // 22. A value is one piece of data: here, 77.
  await until(S(22));
  await play(
    ...put(
      'work',
      workCard([
        ['VALUE', C.amber],
        ['77: one piece of data', C.ink]
      ], C.amber)
    ),
    ...mark('fValue', C.amber),
    ...say('VALUE = ONE PIECE OF DATA', C.amber)
  );

  // 23. The equals sign means assignment.
  await until(S(23));

  const assignmentY = BOX_Y - BOX_H * 0.15;

  const assignmentArrow = arrow(
    [P ? 0.60 : 1.30, assignmentY, 0],
    [FP[0] + BOX_W / 2 + 0.10, assignmentY, 0],
    C.amber
  );

  await play(
    ...put(
      'code',
      cell(
        [
          ['temp_f', C.cyan],
          [' = ', C.amber],
          ['77', C.amber]
        ],
        { highlight: [1, 1, C.amber] }
      )
    ),
    ...put('assignmentArrow', assignmentArrow),
    ...put(
      'assignmentSource',
      looseValue(
        77,
        [P ? 1.70 : 2.65, assignmentY, 0],
        C.amber
      )
    ),
    ...put(
      'work',
      workCard([
        ['ASSIGNMENT', C.amber],
        ['Put the value into the named box', C.ink]
      ], C.amber)
    ),
    ...say('= MEANS PUT THE VALUE INTO THE BOX', C.amber)
  );

  // ============================================================
  // 24-29: Build the expression, piece by piece.
  // ============================================================

  // 24. Turn the three paper steps into one line of code.
  await until(S(24));
  await play(
    ...drop('assignmentArrow', 'assignmentSource'),
    ...put(
      'code',
      cell([['...', C.muted]])
    ),
    ...put(
      'work',
      workCard([
        ['THREE PAPER STEPS', C.muted],
        ['−32    →    ×5    →    ÷9', C.amber]
      ], C.amber)
    ),
    ...say('THREE STEPS IN ONE LINE')
  );

  // 25. Use the name temp_f instead of the number.
  await until(S(25));
  await play(
    ...put(
      'code',
      cell([['temp_f', C.cyan]])
    ),
    ...mark('fLabel', C.cyan),
    ...put(
      'work',
      workCard([
        ['temp_f', C.cyan],
        ['The name stands for 77', C.ink]
      ], C.cyan)
    ),
    ...say('USE THE NAME INSTEAD OF THE NUMBER')
  );

  // 26. Open a bracket, temp_f - 32, close the bracket.
  await until(S(26));
  await play(
    ...put(
      'code',
      cell(
        [
          ['(', C.amber],
          ['temp_f', C.cyan],
          [' - 32', C.ink],
          [')', C.amber]
        ],
        { highlight: [0, 3, C.amber] }
      )
    ),
    ...put(
      'work',
      workCard(['FIRST: TAKE AWAY 32'], C.amber)
    ),
    ...say('BRACKETS KEEP STEP ONE TOGETHER', C.amber)
  );

  // 27. Multiply by 5, then divide by 9.
  await until(S(27));
  await play(
    ...put(
      'code',
      cell([
        ['(', C.ink],
        ['temp_f', C.cyan],
        [' - 32)', C.ink],
        [' * 5 / 9', C.amber]
      ])
    ),
    ...put(
      'work',
      workCard([
        ['*  means multiply', C.ink],
        ['/  means divide', C.ink]
      ], C.amber)
    ),
    ...say('THEN MULTIPLY, THEN DIVIDE', C.amber)
  );

  // 28. A new box to receive the answer: temp_c =.
  await until(S(28));
  await play(
    ...put('cBox', variableFrame(CP, C.green)),
    ...put('cLabel', variableLabel('temp_c', CP, C.green)),
    ...put('cEmpty', emptyValue(CP)),
    ...put('cUnit', variableUnit('Celsius', CP)),
    ...put('code', conversionCode()),
    ...put(
      'work',
      workCard(['A NEW BOX FOR THE ANSWER'], C.green)
    ),
    ...say('temp_c WILL HOLD THE ANSWER', C.green)
  );

  // 29. Everything after the equals sign is an expression.
  await until(S(29));
  await play(
    ...put(
      'code',
      conversionCode({
        highlight: [2, 6, C.amber]
      })
    ),
    ...put(
      'work',
      workCard([
        ['EXPRESSION', C.amber],
        ['A calculation that gives one value', C.ink]
      ], C.amber)
    ),
    ...say('EXPRESSION = CALCULATION', C.amber)
  );

  // ============================================================
  // 30-36: Follow the computer's evaluation.
  // ============================================================

  // 30. Watch the computer follow the calculation.
  await until(S(30));
  await play(
    ...put(
      'code',
      conversionCode({
        running: true
      })
    ),
    ...put(
      'flowArrow',
      arrow(
        [FP[0] + BOX_W / 2 + 0.14, BOX_Y, 0],
        [CP[0] - BOX_W / 2 - 0.14, BOX_Y, 0],
        C.amber
      )
    ),
    ...put(
      'work',
      workCard(['READY TO CALCULATE'], C.muted)
    ),
    ...say('FOLLOW THE COMPUTER, STEP BY STEP')
  );

  // 31. Read temp_f and find 77.
  await until(S(31));
  await play(
    ...put(
      'code',
      conversionCode({
        running: true,
        highlight: [3, 3, C.cyan]
      })
    ),
    ...mark('fValue', C.cyan),
    ...setEquation('temp_f =', '77', C.cyan),
    ...say('LOOK UP THE VALUE OF temp_f')
  );

  // 32. Work out the part inside the brackets: 77 - 32 = 45.
  await until(S(32));
  await play(
    ...put(
      'code',
      conversionCode({
        running: true,
        highlight: [2, 5, C.amber]
      })
    ),
    ...setEquation('77 − 32 =', '45', C.amber),
    ...say('BRACKETS FIRST', C.amber)
  );

  // 33. Multiply by 5: 225.
  await until(S(33));
  await play(
    ...put(
      'code',
      cell(
        [
          ['temp_c = ', C.green],
          ['(temp_f - 32)', C.ink],
          [' * 5', C.amber],
          [' / 9', C.ink]
        ],
        {
          running: true,
          highlight: [2, 2, C.amber]
        }
      )
    ),
    ...setEquation('45 × 5 =', '225', C.amber),
    ...say('MULTIPLY BY 5', C.amber)
  );

  // 34. Divide by 9: 25.
  await until(S(34));
  await play(
    ...put(
      'code',
      cell(
        [
          ['temp_c = ', C.green],
          ['(temp_f - 32) * 5', C.ink],
          [' / 9', C.amber]
        ],
        {
          running: true,
          highlight: [2, 2, C.amber]
        }
      )
    ),
    ...setEquation('225 ÷ 9 =', '25', C.green),
    ...say('DIVIDE BY 9', C.green)
  );

  // 35. Put 25 into the new variable temp_c.
  await until(S(35));
  await play(
    ...drop('cEmpty', 'work'),
    ...moveKey(
      'workResult',
      'cValue',
      variableValue(25, CP, C.green),
      { pathArc: -0.45 }
    ),
    ...put('code', conversionCode()),
    ...say('STORE 25 IN temp_c', C.green)
  );
  settle('cValue', variableValue(25, CP, C.green));

  // 36. The same 25 we found on paper.
  await until(S(36));
  await play(
    ...put('work', paperComparison(25)),
    ...mark('cValue', C.green),
    ...say('SAME ANSWER: 25°C', C.green)
  );

  // ============================================================
  // 37-40: Store values, calculate values, reuse the expression.
  // ============================================================

  // 37. A variable stores a value; an expression produces a value.
  await until(S(37));
  await play(
    ...put(
      'work',
      workCard([
        ['VARIABLE: stores a value', C.cyan],
        ['EXPRESSION: produces a value', C.amber]
      ], C.violet)
    ),
    ...put(
      'code',
      conversionCode({
        highlight: [2, 6, C.amber]
      })
    ),
    ...say('STORE → CALCULATE → STORE', C.violet)
  );

  // 38. Write the steps once and reuse them.
  await until(S(38));
  await play(
    ...put(
      'work',
      workCard([
        ['WRITE ONCE', C.cyan],
        ['Reuse with new values', C.ink]
      ], C.cyan)
    ),
    ...put('code', conversionCode()),
    ...say('ONE EXPRESSION, MANY USES')
  );

  // 39. Tomorrow: change temp_f to 86, run the same line.
  await until(S(39));
  await play(
    ...put(
      'fValue',
      variableValue(86, FP, C.amber)
    ),
    ...drop('cValue'),
    ...put('cEmpty', emptyValue(CP)),
    ...put(
      'code',
      conversionCode({
        running: true
      })
    ),
    ...put(
      'work',
      workCard([
        ['temp_f = 86', C.amber],
        ['Same conversion code', C.ink]
      ], C.amber)
    ),
    ...say('NEW VALUE, SAME EXPRESSION', C.amber)
  );

  // 40. The computer gives 30°C without new paper working.
  await until(S(40));
  await play(
    ...drop('cEmpty'),
    ...put('cValue', variableValue(30, CP, C.green)),
    ...put('code', conversionCode()),
    ...put(
      'work',
      workCard([
        ['86°F → 30°C', C.green],
        ['No new code needed', C.muted]
      ], C.green)
    ),
    ...say('86°F = 30°C', C.green)
  );

  // ============================================================
  // 41-46: The common trap — missing brackets.
  // ============================================================

  // 41. Forgetting the brackets.
  // Return to 77 so the trap uses the original input.
  await until(S(41));
  await play(
    ...put('fValue', variableValue(77, FP, C.amber)),
    ...drop('cValue'),
    ...put('cEmpty', emptyValue(CP)),
    ...put(
      'code',
      wrongCode({
        color: C.amber
      })
    ),
    ...put(
      'work',
      workCard([
        ['ORIGINAL INPUT: 77', C.muted],
        ['The brackets are missing!', C.amber]
      ], C.amber)
    ),
    ...say('COMMON TRAP: MISSING BRACKETS', C.amber)
  );

  // 42. Multiplication and division happen before subtraction.
  await until(S(42));
  await play(
    ...put(
      'code',
      wrongCode({
        color: C.amber,
        running: true,
        highlight: [4, 4, C.amber]
      })
    ),
    ...put(
      'work',
      workCard([
        ['FIRST:  ×  and  ÷', C.amber],
        ['LATER:  +  and  −', C.muted]
      ], C.amber)
    ),
    ...say('MULTIPLY AND DIVIDE BEFORE SUBTRACTING', C.amber)
  );

  // 43. First, 32 x 5 / 9 gives about 17.8.
  await until(S(43));
  await play(
    ...put(
      'work',
      workCard([
        ['32 × 5 = 160', C.amber],
        ['160 ÷ 9 ≈ 17.8', C.amber]
      ], C.amber)
    ),
    ...mark('code', C.amber),
    ...say('THE WRONG PART HAPPENS FIRST', C.amber)
  );

  // 44. Then 77 - 17.8 gives about 59.2.
  await until(S(44));
  await play(
    ...put(
      'code',
      wrongCode({
        running: true,
        color: C.amber
      })
    ),
    ...setEquation('77 − 17.8 ≈', '59.2', C.amber),
    ...say('A VERY DIFFERENT ANSWER', C.amber)
  );

  // 45. A dangerously hot greenhouse, but no computer warning.
  await until(S(45));
  await play(
    ...drop('cEmpty', 'workResult'),
    ...put('cValue', variableValue('59.2', CP, C.green)),
    ...put('code', wrongCode()),
    ...put(
      'work',
      workCard([
        ['59.2°C ≈ 59°C', C.amber],
        ['Too hot! No computer error.', C.ink]
      ], C.amber)
    ),
    ...say('VALID CODE CAN GIVE A WRONG ANSWER', C.amber)
  );

  // 46. Put brackets around the part that must happen first.
  await until(S(46));
  await play(
    ...put(
      'code',
      conversionCode({
        highlight: [2, 5, C.green]
      })
    ),
    ...put('cValue', variableValue(25, CP, C.green)),
    ...put(
      'work',
      workCard([
        ['(77 − 32) FIRST', C.amber],
        ['Correct answer: 25°C', C.green]
      ], C.green)
    ),
    ...say('BRACKETS SAY WHAT HAPPENS FIRST', C.green)
  );

  // ============================================================
  // 47-48: Preview the next lesson and close with the definition.
  // ============================================================

  // 47. Next lesson: store a whole week in one variable.
  await until(S(47));

  const weekY = P ? -0.45 : -0.55;
  const week = D1.map((_, i) => weekBox(i, weekY));

  const rowW = P ? 6.68 : 9.6;

  const weekOutline = rect(
    rowW,
    P ? 2.35 : 2.55,
    [0, weekY, 0],
    C.violet,
    C.card,
    0,
    2
  );

  const weekName = tag(
    'readings',
    C.violet,
    [0, weekY + (P ? 1.55 : 1.47), 0],
    21
  );

  const weekLabel = text(
    'ONE WEEK OF NOON READINGS · °C',
    P ? 17 : 19,
    C.muted,
    [0, weekY - (P ? 1.65 : 1.68), 0],
    false,
    FW - 0.8
  );

  const previous = clear();

  week.forEach((g, i) => visible.set(`week${i}`, g));

  await play(
    ...previous,
    ...put('weekOutline', weekOutline),
    ...put('weekName', weekName),
    ...put('weekLabel', weekLabel),
    new M.LaggedStart(
      week.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.11,
        runTime: 1.50
      }
    ),
    ...say('NEXT: MANY VALUES UNDER ONE NAME', C.violet)
  );

  // 48. A variable is a named box for a value.
  // An expression is a calculation that fills a new box.
  await until(S(48));

  const finalArrow = arrow(
    [FP[0] + BOX_W / 2 + 0.13, BOX_Y, 0],
    [CP[0] - BOX_W / 2 - 0.13, BOX_Y, 0],
    C.amber
  );

  const finalDefinition = workCard([
    ['VARIABLE = named box for a value', C.cyan],
    ['EXPRESSION = calculation of a new value', C.amber]
  ], C.violet);

  await play(
    ...clear(),
    ...put(
      'code',
      conversionCode({
        highlight: [2, 6, C.amber]
      })
    ),
    ...put('fBox', variableFrame(FP, C.cyan)),
    ...put('fLabel', variableLabel('temp_f', FP, C.cyan)),
    ...put('fValue', variableValue(77, FP, C.amber)),
    ...put('fUnit', variableUnit('Fahrenheit', FP)),
    ...put('cBox', variableFrame(CP, C.green)),
    ...put('cLabel', variableLabel('temp_c', CP, C.green)),
    ...put('cValue', variableValue(25, CP, C.green)),
    ...put('cUnit', variableUnit('Celsius', CP)),
    ...put('finalArrow', finalArrow),
    ...put('work', finalDefinition),
    ...say('VARIABLES STORE. EXPRESSIONS CALCULATE.', C.green)
  );
}
