// 21.3.5 Modality connectors. Beat i follows sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill high, pictures stacked tall in the middle, formula card at the bottom.
  const PILL = P ? [0, 3.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.95, 0] : [4.3, -0.3, 0];
  const Y = P ? -1.0 : -0.55;
  const fitP = g => {
    if (P && g && g.getWidth() > FW - 0.5) g.scale((FW - 0.5) / g.getWidth(), { aboutPoint: [0, Y, 0] });
    return g;
  };
  const at = (x, y) => [CX + x, Y + y, 0];
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 17 : 19);

  const group = (...parts) => new M.VGroup(...parts);
  function label(s, x, y, color = C.ink, size = 20, mono = false) {
    return T(s, size, color, mono).moveTo(at(x, y));
  }
  function rect(x, y, width, height, color, fill = 0.14, rounded = false) {
    const options = { width, height, color, strokeWidth: 1.5 };
    const r = rounded
      ? new M.RoundedRectangle({ ...options, cornerRadius: 0.1 })
      : new M.Rectangle(options);
    r.setFill(color, fill);
    return r.moveTo(at(x, y));
  }
  function line(x1, y1, x2, y2, color = C.muted, dashed = false) {
    const Line = dashed ? M.DashedLine : M.Line;
    return new Line({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth: 2 });
  }
  function arrow(x1, y1, x2, y2, color = C.muted) {
    return new M.Arrow({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth: 2 });
  }
  const dot = (x, y, color, radius = 0.07) => new M.Dot({ point: at(x, y), color, radius });

  let picture = null;
  let boxNow = null;
  function formula(lines, color) {
    const size = P ? 21 : 19, lh = P ? 0.42 : 0.36;
    const rows = lines.map(entry => Array.isArray(entry) ? entry : [entry, C.ink]);
    const text = rows.map(([s, c]) => T(s, size, c, true));
    const width = Math.max(...text.map(t => t.getWidth())) + 0.56;
    const height = rows.length * lh + 0.24;
    const border = new M.RoundedRectangle({ width, height, cornerRadius: 0.14, color, strokeWidth: 2 });
    border.setFill(C.card, 0.95);
    border.moveTo(BOXP);
    text.forEach((t, i) => {
      t.moveTo([BOXP[0] - width / 2 + 0.28 + t.getWidth() / 2,
        BOXP[1] + (rows.length - 1) * lh / 2 - i * lh, 0]);
    });
    const box = group(border, ...text);
    const limit = P ? FW - 1.2 : 4;
    if (width > limit) box.scale(limit / width, { aboutPoint: BOXP });
    box.moveTo(BOXP);
    return box;
  }

  // Omit a diagram or formula to keep it. Pass null to clear it.
  async function view({ title, color = C.cyan, diagram, lines, effects = [] } = {}) {
    const out = [];
    if (diagram !== undefined && picture) out.push(new M.FadeOut(picture, { runTime: 0.15 }));
    if (lines !== undefined && boxNow) out.push(new M.FadeOut(boxNow, { runTime: 0.15 }));
    if (out.length) await play(...out);

    const next = [...effects];
    if (title) next.push(...say(title, color));
    if (diagram !== undefined) {
      picture = fitP(diagram);
      if (picture) next.push(new M.FadeIn(picture, { runTime: 0.35 }));
    }
    if (lines !== undefined) {
      boxNow = lines ? formula(lines, color) : null;
      if (boxNow) next.push(new M.FadeIn(boxNow, { runTime: 0.25 }));
    }
    if (next.length) await play(...next);
  }

  function block(x, y, text, color, width = 1.64, height = 0.64, size = 18) {
    return group(rect(x, y, width, height, color, 0.16, true),
      label(text, x, y, color, size));
  }
  function vector(values, x, y, color, spacing = 0.67) {
    return group(...values.map((v, i) =>
      block(x + (i - (values.length - 1) / 2) * spacing, y, v, color, spacing - 0.08, 0.53, 22)));
  }
  function wave(x, y, width, height, color) {
    const levels = [0, .12, -.22, .33, -.14, .41, -.48, .36, -.32, .16, -.09, .25,
      -.39, .5, -.31, .15, -.12, .3, -.46, .26, -.12, .22, -.09, 0];
    return group(...levels.slice(1).map((v, i) => line(
      x - width / 2 + i * width / (levels.length - 1), y + levels[i] * height,
      x - width / 2 + (i + 1) * width / (levels.length - 1), y + v * height, color)));
  }

  function countGrid(count, kind, y = 0) {
    const columns = P ? (count === 120 ? 12 : 6) : (count === 120 ? 30 : 10);
    const rows = count / columns;
    const dx = P ? (count === 120 ? 0.55 : 0.95) : (count === 120 ? 0.2 : 0.56);
    const dy = P ? (count === 120 ? 0.42 : 0.5) : (count === 120 ? 0.3 : 0.31);
    const color = kind === 'frame' ? C.cyan : kind === 'joined' ? C.green : C.violet;
    return group(...Array.from({ length: count }, (_, i) => {
      const x = (i % columns - (columns - 1) / 2) * dx;
      const yy = y + ((rows - 1) / 2 - Math.floor(i / columns)) * dy;
      return rect(x, yy, dx * 0.73, dy * 0.66, color, 0.66);
    }));
  }
  function framePicture(caption, model = false) {
    if (P) return group(label('“Where is the library?”', 0, 3.5, C.ink, 22),
      wave(0, 2.75, 6.6, 0.8, C.cyan), countGrid(120, 'frame', -0.05),
      label(caption, 0, -2.75, C.cyan, 22),
      ...(model ? [block(0, -3.6, 'Language model', C.green, 3.3, 0.8, 22)] : []));
    return group(label('“Where is the library?”', 0, 1.14),
      wave(0, 0.61, 5.75, 0.61, C.cyan), countGrid(120, 'frame', -0.33),
      label(caption, 0, -1.22, C.cyan),
      ...(model ? [block(0, -1.8, 'Language model', C.green, 2.55)] : []));
  }
  function encoderPicture(mode) {
    if (P) {
      const parts = [
        ...Array.from({ length: 6 }, (_, i) => rect((i - 2.5) * 0.34, 3.0, 0.24, 0.8, C.cyan, 0.65)),
        label('Frames', 0, 2.25, C.cyan, 22), arrow(0, 1.95, 0, 1.3),
        block(0, 0.75, 'Acoustic encoder', C.violet, 3.4, 0.85, 22)];
      if (mode === 'trained') parts.push(label('Already trained on speech', 0, -0.5, C.violet, 22),
        wave(0, -2.0, 6.5, 1.5, C.cyan));
      if (mode === 'vector') parts.push(arrow(0, 0.25, 0, -0.4),
        vector(['…', '…', '…'], 0, -0.95, C.violet, 0.78),
        label('Sound vector', 0, -1.7, C.violet, 22),
        label('One list of numbers per frame', 0, -3.0, C.ink, 22));
      return group(...parts);
    }
    const x = [-2.18, 0, 2.18];
    const inputs = group(...Array.from({ length: 6 }, (_, i) =>
      rect(x[0] + (i - 2.5) * 0.22, 0.66, 0.15, 0.5, C.cyan, 0.65)));
    return group(inputs, label('Frames', x[0], 0.03, C.cyan),
      arrow(-1.45, 0.66, -1.02, 0.66), block(0, 0.66, 'Acoustic encoder', C.violet, 1.94),
      ...(mode === 'trained' ? [
        label('Already trained on speech', 0, -0.67, C.violet),
        wave(0, -1.3, 4.1, 0.6, C.cyan)
      ] : []),
      ...(mode === 'vector' ? [
        arrow(1.02, 0.66, 1.43, 0.66),
        vector(['…', '…', '…'], x[2], 0.66, C.violet, 0.48),
        label('Sound vector', x[2], 0.03, C.violet),
        label('One list of numbers per frame', 0, -0.94)
      ] : []));
  }
  function wordBoardP(kind, named, marks) {
    const split = kind === 'split' || kind === 'mismatch';
    const color = C.green;
    const wy = split ? -1.95 : -0.55, wh = split ? 3.3 : 4.5, sx = 1.15, sy = split ? 1.25 : 1.7;
    const wp = (dx, y) => [dx * sx, wy + y * sy];
    const lab = (s, p, c, size = 21, mono = false) => label(s, p[0], p[1], c, size, mono);
    const parts = [rect(0, wy, 6.9, wh, color, 0.06, true),
      lab(named ? 'Word space' : 'How words are stored', [0, wy + wh / 2 + 0.38], color, 22)];
    if (marks) [[-0.75, 0.50, 'library', -0.02, 0.26], [-0.34, 0.13, 'bookshop', 0.18, -0.25],
      [0.80, -0.45, 'pond', 0, -0.28]].forEach(([dx, y, text, lx, ly]) => {
      const p = wp(dx, y);
      parts.push(dot(p[0], p[1], color, 0.08), lab(text, wp(dx + lx, y + ly * 1.1), color, 21));
    });
    if (split) {
      parts.push(rect(0, 2.1, 6.9, 2.1, C.violet, 0.08, true),
        label('Sound vectors', 0, 3.5, C.violet, 22),
        vector(['…', '…', '…'], 0, 2.5, C.violet, 0.7),
        dot(-1.9, 1.6, C.violet, 0.08), dot(-0.5, 1.45, C.violet, 0.08), dot(1.6, 1.65, C.violet, 0.08));
    }
    if (kind === 'mismatch') {
      parts.push(line(2.3, 0.95, 2.3, 0.1, C.pink, true),
        label('×', 2.75, 0.55, C.pink, 30), label('Different spaces', 0, -4.05, C.pink, 22));
    }
    if (kind === 'exact' || kind === 'landed' || kind === 'near') {
      const px = kind === 'near' ? -0.28 : -0.75;
      const py = kind === 'near' ? 0.59 : 0.50;
      parts.push(lab('(3, 2, 1)', wp(-2.05, 0.5), color, 19, true));
      if (kind === 'landed' || kind === 'near') {
        const ring = new M.Circle({ radius: 0.17, color: C.violet, strokeWidth: 3 });
        ring.moveTo(at(...wp(px, py)));
        const a = wp(-2.12, -0.48), b = wp(px - 0.16, py - 0.08);
        parts.push(ring, arrow(a[0], a[1], b[0], b[1], C.violet),
          lab('Sound of “library”', wp(-1.28, -0.86), C.violet, 18));
      }
    }
    return group(...parts);
  }
  function wordBoard(kind, named = true, marks = true) {
    if (P) return wordBoardP(kind, named, marks);
    const split = kind === 'split' || kind === 'mismatch';
    const x = split ? 1.62 : 0;
    const width = split ? 2.83 : 5.55;
    const color = C.green;
    const points = [
      [-0.75, 0.50, 'library', -0.02, 0.26],
      [-0.34, 0.13, 'bookshop', 0.18, -0.25],
      [0.80, -0.45, 'pond', 0, -0.28]
    ];
    const wordDots = points.flatMap(([dx, y, text, lx, ly]) => [
      dot(x + dx, y, color), label(text, x + dx + lx, y + ly * 1.15, color, 19)
    ]);
    const parts = [rect(x, 0, width, 2.23, color, 0.06, true),
      named ? label('Word space', x, 1.44, color) : label('How words are stored', x, 1.44, color)];
    if (marks) parts.push(...wordDots);
    if (split) {
      parts.push(rect(-1.62, 0, width, 2.23, C.violet, 0.08, true),
        label('Sound vectors', -1.62, 1.44, C.violet),
        vector(['…', '…', '…'], -1.62, 0.48, C.violet, 0.58),
        dot(-2.34, -0.37, C.violet), dot(-1.86, -0.52, C.violet), dot(-0.87, -0.3, C.violet));
    }
    if (kind === 'mismatch') {
      parts.push(line(-0.55, -0.56, 0.55, -0.56, C.pink, true),
        label('×', 0, -0.31, C.pink, 27), label('Different spaces', 0, -1.64, C.pink));
    }
    if (kind === 'exact' || kind === 'landed' || kind === 'near') {
      const px = kind === 'near' ? -0.28 : -0.75;
      const py = kind === 'near' ? 0.59 : 0.50;
      parts.push(label('(3, 2, 1)', -1.9, 0.50, color, 18, true));
      if (kind === 'landed' || kind === 'near') {
        const ring = new M.Circle({ radius: 0.14, color: C.violet, strokeWidth: 3 });
        ring.moveTo(at(px, py));
        parts.push(ring, arrow(-2.12, -0.48, px - 0.18, py - 0.06, C.violet),
          label('Sound of “library”', -1.28, -0.89, C.violet, 16));
      }
    }
    return group(...parts);
  }
  function plugPicture(adapted) {
    if (P) {
      const parts = [
        rect(0, 2.55, 1.3, 1.1, C.violet, 0.18, true), line(0, 3.1, 0, 3.6, C.violet),
        line(-0.25, 2.0, -0.25, 1.6, C.violet), line(0.25, 2.0, 0.25, 1.6, C.violet),
        label('Charger plug', 2.15, 2.55, C.violet, 21),
        rect(0, -2.45, 1.6, 1.8, C.green, 0.14, true),
        rect(-0.27, -2.15, 0.15, 0.36, C.green, 0.72), rect(0.27, -2.15, 0.15, 0.36, C.green, 0.72),
        rect(0, -2.75, 0.15, 0.28, C.green, 0.72),
        label('Wall socket', 2.15, -2.45, C.green, 21)];
      if (adapted) {
        parts.push(rect(0, 0.05, 1.25, 1.2, C.amber, 0.24, true),
          dot(-0.25, 0.45, C.amber, 0.06), dot(0.25, 0.45, C.amber, 0.06),
          ...[-0.27, 0, 0.27].map(x => line(x, -0.55, x, -0.9, C.amber)),
          arrow(0, 1.5, 0, 0.75, C.amber), arrow(0, -0.95, 0, -1.5, C.amber),
          label('Adapter', 1.85, 0.05, C.amber, 21));
      } else {
        parts.push(label('×', 0, 0.05, C.pink, 46));
      }
      return group(...parts);
    }
    const parts = [
      rect(-2.27, 0.36, 1.13, 1.26, C.violet, 0.18, true),
      line(-2.83, 0.36, -3.15, 0.36, C.violet),
      ...[0.12, 0.60].map(y => line(-1.70, y, -1.34, y, C.violet)),
      rect(2.12, 0.36, 1.35, 1.55, C.green, 0.14, true),
      rect(1.89, 0.61, 0.13, 0.3, C.green, 0.72),
      rect(2.35, 0.61, 0.13, 0.3, C.green, 0.72),
      rect(2.12, 0.14, 0.13, 0.22, C.green, 0.72),
      label('Charger plug', -2.23, -0.77, C.violet),
      label('Wall socket', 2.12, -0.77, C.green)
    ];
    if (adapted) {
      parts.push(rect(0, 0.36, 1.02, 1.06, C.amber, 0.24, true),
        ...[0.12, 0.60].map(y => dot(-0.33, y, C.amber, 0.056)),
        ...[0.12, 0.36, 0.60].map(y => line(0.51, y, 0.81, y, C.amber)),
        arrow(-1.22, 0.36, -0.62, 0.36, C.amber), arrow(0.86, 0.36, 1.34, 0.36, C.amber),
        label('Adapter', 0, -0.77, C.amber));
    } else {
      parts.push(label('×', 0, 0.36, C.pink, 40));
    }
    return group(...parts);
  }
  function neighbors(withTime) {
    if (P) return group(...Array.from({ length: 4 }, (_, i) => {
      const y = 2.75 - i * 1.6, x = withTime ? -0.9 : 0;
      return group(...[0.2, 0.6, 0.4].map((level, j) =>
        rect(x + (j - 1) * 0.45, y, 0.36, 0.75, C.violet, level + 0.04 * (i % 2))),
      ...(withTime ? [label(`${i * 10} ms`, 1.2, y, C.ink, 21, true)] : []));
    }), ...(withTime ? [label('10 ms between starts', 0, -3.55, C.amber, 22)] : []));
    return group(...Array.from({ length: 4 }, (_, i) => {
      const x = (i - 1.5) * 1.37;
      return group(...[0.2, 0.6, 0.4].map((level, j) =>
        rect(x + (j - 1) * 0.31, 0.43, 0.25, 0.48, C.violet, level + 0.04 * (i % 2))),
      ...(withTime ? [label(`${i * 10} ms`, x, -0.16, C.ink, 16, true)] : []));
    }), ...(withTime ? [label('10 ms between starts', 0, -0.85, C.amber)] : []));
  }
  function joinedPicture() {
    if (P) return group(...Array.from({ length: 30 }, (_, i) => {
      const x = (i % 5 - 2) * 1.25, y = 3.0 - Math.floor(i / 5) * 0.42;
      return group(rect(x, y, 1.05, 0.34, C.violet, 0.08, true),
        ...Array.from({ length: 4 }, (_, j) => rect(x + (j - 1.5) * 0.22, y, 0.14, 0.2, C.violet, 0.72)));
    }), arrow(0, 0.6, 0, -0.05, C.amber),
    countGrid(30, 'joined', -1.45), label('One token per group', 0, -3.2, C.green, 22));
    const xAt = i => (i % 10 - 4.5) * 0.59;
    return group(...Array.from({ length: 30 }, (_, i) => {
      const x = xAt(i), y = 1.15 - Math.floor(i / 10) * 0.27;
      return group(rect(x, y, 0.51, 0.23, C.violet, 0.08, true),
        ...Array.from({ length: 4 }, (_, j) => rect(x + (j - 1.5) * 0.106, y, 0.074, 0.13, C.violet, 0.72)));
    }), arrow(0, 0.43, 0, -0.12, C.amber),
    countGrid(30, 'joined', -0.62), label('One token per group', 0, -1.36, C.green));
  }
  function pipeline(input, output, { frozen = false, training = false } = {}) {
    const xs = [-2.19, 0, 2.19];
    const encoder = input === 'Picture' ? 'Picture encoder' : 'Acoustic encoder';
    if (P) return group(label(input, 0, 3.4, C.violet, 22),
      block(0, 2.4, encoder, C.violet, 3.4, 0.9, 22),
      arrow(0, 1.85, 0, 1.05, C.amber),
      block(0, 0.5, 'Connector', C.amber, 2.6, 0.9, 22),
      arrow(0, -0.05, 0, -0.85, C.amber),
      block(0, -1.4, 'Language model', C.green, 3.4, 0.9, 22),
      label(output, 0, -2.4, C.green, 22),
      ...(frozen ? [label('Frozen', 2.6, 2.4, C.muted, 22), label('Frozen', 2.6, -1.4, C.muted, 22)] : []),
      ...(training ? [label('Weights change', 0, -3.3, C.amber, 22)] : []));
    return group(label(input, xs[0], 1.17, C.violet), label(output, xs[2], 1.17, C.green),
      block(xs[0], 0.36, encoder, C.violet, 1.93),
      block(xs[1], 0.36, 'Connector', C.amber, 1.38),
      block(xs[2], 0.36, 'Language model', C.green, 1.93),
      arrow(-1.18, 0.36, -0.73, 0.36, C.amber), arrow(0.73, 0.36, 1.18, 0.36, C.amber),
      ...(frozen ? [label('Frozen', xs[0], -0.4, C.muted, 22), label('Frozen', xs[2], -0.4, C.muted, 22)] : []),
      ...(training ? [label('Weights change', 0, -0.95, C.amber, 21)] : []));
  }
  function toy(values, active = -1, recipes = false, showOutput = true) {
    if (P) {
      const xs = [-2.1, 0, 2.1];
      const parts = [label('Sound vector', 0, 3.4, C.violet, 22),
        vector(['2', '4'], 0, 2.6, C.violet, 0.85)];
      if (showOutput) {
        parts.push(label('Word-space vector', 0, -2.3, C.green, 22),
          ...values.map((v, i) => block(xs[i], -1.45, v, i === active ? C.amber : C.green, 0.8, 0.72, 24)));
      }
      if (recipes) xs.forEach((x, i) => {
        const color = i === active ? C.amber : C.muted;
        parts.push(arrow(0, 2.15, x, 1.0, color), label(`Mix ${i + 1}`, x, 0.55, color, 21),
          arrow(x, 0.15, x, -0.95, color));
      });
      return group(...parts);
    }
    const ys = [0.66, -0.08, -0.82];
    const parts = [label('Sound vector', -2.12, 1.3, C.violet),
      vector(['2', '4'], -2.12, -0.08, C.violet)];
    if (showOutput) {
      parts.push(label('Word-space vector', 1.88, 1.3, C.green),
        ...values.map((v, i) => block(1.88, ys[i], v, i === active ? C.amber : C.green, 0.62, 0.53, 22)));
    }
    if (recipes) {
      ys.forEach((y, i) => {
        const color = i === active ? C.amber : C.muted;
        parts.push(arrow(-1.41, -0.08, -0.86, y, color),
          label(`Mix ${i + 1}`, 0.07, y, color, 17),
          arrow(0.79, y, 1.47, y, color));
      });
    }
    return group(...parts);
  }
  function recording(withExpected) {
    if (P) return group(label('Recording', 0, 3.4, C.cyan, 22), wave(0, 2.0, 6.6, 1.9, C.cyan),
      arrow(0, 0.75, 0, -0.35, C.muted),
      label(withExpected ? 'The model should write' : 'Paired written words', 0, -0.9, C.muted, 22),
      label('Where is the library?', 0, -2.0, C.green, 28));
    return group(label('Recording', 0, 1.32, C.cyan), wave(0, 0.72, 5.65, 0.87, C.cyan),
      arrow(0, 0.22, 0, -0.32, C.muted),
      label(withExpected ? 'The model should write' : 'Paired written words', 0, -0.65, C.muted),
      label('Where is the library?', 0, -1.16, C.green, 25));
  }

  const trainWeight = i => 0.5 * (1 - 0.5 ** i);
  const trainGuess = i => 2 + 2 * trainWeight(i);
  const trainLoss = i => 0.5 * (3 - trainGuess(i)) ** 2;
  function learning(i) {
    if (P) {
      const gx = -2.75, gy = -2.45, w = 6.1, height = 2.9;
      const point = k => [gx + k * w / 7, gy + trainLoss(k) / 0.5 * height];
      const parts = [
        label('Connector only', 0, 3.45, C.amber, 22),
        label(`Step ${i}`, 0, 2.8, C.ink, 26),
        label('Target: 3', -1.55, 2.15, C.green, 20, true),
        label(`Guess: ${i <= 3 ? trainGuess(i) : '2.99'}`, 1.45, 2.15, C.violet, 20, true),
        label('First number only', 0, 1.6, C.muted, 18),
        label('Loss = ½ × error²', 0, 0.95, C.amber, 19, true),
        line(gx, gy, gx + w, gy), line(gx, gy, gx, gy + height),
        label('0', gx - 0.25, gy, C.muted, 15, true),
        label('0.5', gx - 0.38, gy + height, C.muted, 15, true),
        label('Steps', 0, -2.9, C.muted, 18)
      ];
      for (let k = 0; k <= i; k++) {
        const [x, y] = point(k);
        if (k) parts.push(line(...point(k - 1), x, y, C.amber));
        parts.push(dot(x, y, C.amber, 0.065));
      }
      return group(...parts);
    }
    const gx = -0.09, gy = -0.91, w = 2.98, height = 1.63;
    const point = k => [gx + k * w / 7, gy + trainLoss(k) / 0.5 * height];
    const parts = [
      label('Connector only', -1.81, 1.2, C.amber),
      label(`Step ${i}`, -1.81, 0.60, C.ink, 24),
      label('Target: 3', -1.81, 0.09, C.green, 18, true),
      label(`Guess: ${i <= 3 ? trainGuess(i) : '2.99'}`, -1.81, -0.43, C.violet, 18, true),
      label('First number only', -1.81, -1.07, C.muted, 16),
      label('Loss = ½ × error²', 1.45, 1.36, C.amber, 16, true),
      line(gx, gy, gx + w, gy), line(gx, gy, gx, gy + height),
      label('0', gx - 0.2, gy, C.muted, 14, true),
      label('0.5', gx - 0.30, gy + height, C.muted, 14, true),
      label('Steps', 1.44, -1.41, C.muted, 16)
    ];
    for (let k = 0; k <= i; k++) {
      const [x, y] = point(k);
      if (k) parts.push(line(...point(k - 1), x, y, C.amber));
      parts.push(dot(x, y, C.amber, 0.049));
    }
    return group(...parts);
  }
  function trainingNumbers(i) {
    const before = trainGuess(i - 1), after = trainGuess(i);
    const oldWeight = trainWeight(i - 1), newWeight = trainWeight(i);
    return [`Error: 3 − ${before} = ${3 - before}`,
      [`Weight: ${oldWeight} + ${newWeight - oldWeight} = ${newWeight}`, C.amber],
      [`Guess: ${before} → ${after}`, C.green]];
  }
  function textTokens(y) {
    const tokens = ['where', 'is', 'the', 'library', '?'];
    return group(...tokens.map((s, i) => block((i - 2) * 1.16, y, s, C.green, 1.08, 0.51, 17)));
  }
  function tokenCost(mode) {
    if (P) {
      const parts = [label('Typed question', 0, 3.4, C.green, 22)];
      if (mode === 'trap') parts.push(label('Where is the library?', 0, 2.6, C.green, 27),
        label('5 tokens', 0, 1.9, C.green, 21, true),
        label('Spoken question', 0, 0.75, C.cyan, 22),
        wave(0, -0.75, 6.6, 1.9, C.cyan),
        label('30 tokens', 0, -2.3, C.cyan, 21, true));
      else {
        parts.push(textTokens(2.55));
        if (mode === 'speech') parts.push(label('Spoken question', 0, 1.4, C.cyan, 22),
          countGrid(30, 'joined', -0.45));
      }
      return group(...parts);
    }
    const parts = [label('Typed question', 0, 1.35, C.green)];
    if (mode === 'trap') {
      parts.push(label('Where is the library?', 0, 0.73, C.green, 24),
        label('5 tokens', 0, 0.3, C.green, 19, true),
        label('Spoken question', 0, -0.13, C.cyan),
        wave(0, -0.82, 5.6, 0.88, C.cyan),
        label('30 tokens', 0, -1.5, C.cyan, 19, true));
    } else {
      parts.push(textTokens(0.67));
      if (mode === 'speech') parts.push(label('Spoken question', 0, -0.07, C.cyan),
        countGrid(30, 'joined', -0.91));
    }
    return group(...parts);
  }
  function contextPicture() {
    if (P) return group(label('Context window', 0, 3.45, C.ink, 22),
      rect(0, 0.4, 6.4, 5.2, C.muted, 0.05, true),
      ...Array.from({ length: 36 }, (_, i) => rect((i % 6 - 2.5) * 1.0, 2.4 - Math.floor(i / 6) * 0.8,
        0.82, 0.62, i < 30 ? C.cyan : C.grid, i < 30 ? 0.68 : 0.05)),
      label('Filled by speech tokens', 0, -2.65, C.cyan, 22),
      label('Illustrative capacity', 0, -3.3, C.muted, 18));
    const slots = Array.from({ length: 36 }, (_, i) => {
      const x = (i % 12 - 5.5) * 0.46;
      const y = 0.71 - Math.floor(i / 12) * 0.46;
      return rect(x, y, 0.37, 0.35, i < 30 ? C.cyan : C.grid, i < 30 ? 0.68 : 0.05);
    });
    return group(label('Context window', 0, 1.5, C.ink),
      rect(0, 0.25, 5.78, 1.54, C.muted, 0.05, true), ...slots,
      label('Filled by speech tokens', 0, -0.91, C.cyan, 18),
      label('Illustrative capacity', 0, -1.34, C.muted, 15));
  }

  await until(S(0));
  await view({ title: '120 FRAMES', diagram: framePicture('120 frames') });
  await until(S(1));
  await view({ title: 'FROM SPEECH TO THE MODEL', diagram: framePicture('Spoken question', true) });
  await until(S(2));
  await view({ title: 'ACOUSTIC = ABOUT SOUND', diagram: encoderPicture('input') });
  await until(S(3));
  await view({ title: 'ALREADY TRAINED ON SPEECH', diagram: encoderPicture('trained'), color: C.violet });
  await until(S(4));
  await view({ title: 'ONE LIST OF NUMBERS PER FRAME', diagram: encoderPicture('vector'), color: C.violet });
  await until(S(5));
  await view({ title: '120 SOUND VECTORS', color: C.violet,
    diagram: group(countGrid(120, 'vector', P ? 0.9 : 0.27),
      label('One vector per frame', 0, P ? -2.0 : -0.75, C.violet, P ? 22 : 20)) });

  await until(S(6));
  await view({ title: 'HOW DOES THE MODEL STORE WORDS?', diagram: wordBoard('plain', false, false) });
  await until(S(7));
  await view({ title: 'SIMILAR MEANINGS SIT CLOSE', diagram: wordBoard('plain', false), color: C.green });
  await until(S(8));
  await view({ title: 'WORD SPACE', diagram: wordBoard('plain'), color: C.green });
  await until(S(9));
  await view({ title: 'SOUND VECTORS COME FROM ANOTHER MODEL', diagram: wordBoard('split'), color: C.violet });
  await until(S(10));
  await view({ title: 'THE NUMBERS DO NOT FIT', diagram: wordBoard('mismatch'), color: C.pink });

  await until(S(11));
  await view({ title: 'A TRAVEL PLUG', diagram: plugPicture(false), color: C.amber });
  await until(S(12));
  await view({ title: 'ADD AN ADAPTER', diagram: plugPicture(true), color: C.amber });
  await until(S(13));
  await view({ title: 'BUILD THE ADAPTER IN TWO STEPS', color: C.amber });
  await until(S(14));
  await view({ title: 'STEP 1 · SHORTEN THE ROW', diagram: neighbors(false), color: C.amber });
  await until(S(15));
  await view({ title: 'NEIGHBOURS ARE ALIKE', diagram: neighbors(true), color: C.violet });
  await until(S(16));
  await view({ title: 'JOIN FOUR NEIGHBOURS INTO ONE', diagram: joinedPicture(), color: C.green });
  await until(S(17));
  await view({ title: '30 JOINED VECTORS', color: C.green,
    lines: ['120 ÷ 4 = 30', ['Each covers 40 ms', C.amber]] });
  await until(S(18));
  await view({ title: 'STEP 2 · INTO THE WORD SPACE', diagram: pipeline('Sound vectors', 'Word space'),
    color: C.amber, lines: null });

  await until(S(19));
  await view({ title: 'TWO SOUND NUMBERS', diagram: toy([], -1, false, false), color: C.violet });
  await until(S(20));
  await view({ title: 'MAKE THREE NEW NUMBERS', diagram: toy(['?', '?', '?']), color: C.green });
  await until(S(21));
  await view({ title: 'EACH NUMBER HAS ITS OWN MIX', diagram: toy(['?', '?', '?'], -1, true), color: C.amber });
  await until(S(22));
  await view({ title: 'MIX 1', diagram: toy(['3', '?', '?'], 0, true), color: C.amber,
    lines: ['½ × 2 + ½ × 4', ['1 + 2 = 3', C.amber]] });
  await until(S(23));
  await view({ title: 'MIX 2', diagram: toy(['3', '2', '?'], 1, true), color: C.amber,
    lines: ['1 × 2 + 0 × 4', ['2 + 0 = 2', C.amber]] });
  await until(S(24));
  await view({ title: 'MIX 3', diagram: toy(['3', '2', '1'], 2, true), color: C.amber,
    lines: ['0 × 2 + ¼ × 4', ['0 + 1 = 1', C.amber]] });
  await until(S(25));
  await view({ title: 'TWO NUMBERS BECOME THREE', diagram: toy(['3', '2', '1'], -1, true), color: C.green,
    lines: [['(2, 4) → (3, 2, 1)', C.green]] });
  await until(S(26));
  await view({ title: 'IN THIS TOY: (3, 2, 1) IS “LIBRARY”', diagram: wordBoard('exact'), color: C.green, lines: null });
  await until(S(27));
  await view({ title: 'THE SOUND LANDS ON THE MEANING', diagram: wordBoard('landed'), color: C.green });
  await until(S(28));
  await view({ title: 'REAL MODELS LAND NEAR THE WORD', diagram: wordBoard('near'), color: C.green,
    lines: ['Word-space vector', ['1,024 numbers', C.green]] });
  await until(S(29));
  await view({ title: 'MODALITY CONNECTOR', diagram: pipeline('Sound vectors', 'Word space'), color: C.amber, lines: null });
  await until(S(30));
  await view({ title: 'MODALITY = KIND OF INPUT',
    diagram: P ? group(label('Where?', -1.2, 2.6, C.green, 28), label('Text', 1.5, 2.6, C.green, 22),
      rect(-1.2, 0.3, 1.6, 1.05, C.amber, 0.13, true),
      line(-1.85, -0.05, -1.37, 0.5, C.amber), line(-1.37, 0.5, -1.05, 0.12, C.amber),
      line(-1.05, 0.12, -0.75, 0.42, C.amber), line(-0.75, 0.42, -0.52, 0.02, C.amber),
      dot(-0.82, 0.6, C.amber), label('Pictures', 1.5, 0.3, C.amber, 22),
      wave(-1.2, -2.1, 2.4, 1.4, C.violet), label('Sound', 1.5, -2.1, C.violet, 22))
    : group(label('Where?', -2.08, 0.48, C.green, 24), label('Text', -2.08, -0.52, C.green),
      rect(0, 0.48, 1.27, 0.83, C.amber, 0.13, true),
      line(-0.52, 0.18, -0.14, 0.63, C.amber), line(-0.14, 0.63, 0.12, 0.33, C.amber),
      line(0.12, 0.33, 0.37, 0.56, C.amber), line(0.37, 0.56, 0.55, 0.25, C.amber),
      dot(0.30, 0.72, C.amber), label('Pictures', 0, -0.52, C.amber),
      wave(2.09, 0.48, 1.69, 0.95, C.violet), label('Sound', 2.09, -0.52, C.violet)) });
  await until(S(31));
  await view({ title: 'A WEIGHTED MIX', diagram: toy(['3', '2', '1'], 0, true), color: C.amber,
    lines: ['New number = weighted mix', '½ × 2 + ½ × 4 = 3'] });
  await until(S(32));
  await view({ title: 'WEIGHTS ARE THE AMOUNTS', diagram: toy(['3', '2', '1'], -1, true), color: C.amber,
    lines: [['Mix 1: ½ and ½', C.amber], 'Mix 2: 1 and 0', 'Mix 3: 0 and ¼'] });

  await until(S(33));
  await view({ title: 'LEARN FROM RECORDING AND TEXT PAIRS', diagram: recording(false), lines: null });
  await until(S(34));
  await view({ title: 'THE WORDS THE MODEL SHOULD WRITE', diagram: recording(true), color: C.green });
  await until(S(35));
  await view({ title: 'NUDGE THE CONNECTOR’S WEIGHTS', color: C.amber,
    diagram: P ? group(label('Example model output', 0, 2.6, C.muted, 22),
      label('Where is the lab?', 0, 1.6, C.pink, 28),
      arrow(0, 0.95, 0, -0.1, C.muted),
      label('Target:', 0, -0.65, C.green, 22),
      label('Where is the library?', 0, -1.55, C.green, 28))
    : group(label('Example model output', 0, 1.15, C.muted),
      label('Where is the lab?', 0, 0.47, C.pink, 24),
      label('Target: Where is the library?', 0, -0.32, C.green, 22)),
    lines: ['Toy target: first number = 3', 'Start: 0 × 2 + ½ × 4 = 2'] });
  await until(S(35) + 0.95);
  await view({ diagram: learning(1), color: C.amber, lines: trainingNumbers(1) });
  await until(S(35) + 2.22);
  await view({ diagram: learning(2), color: C.amber, lines: trainingNumbers(2) });
  await until(S(35) + 3.49);
  await view({ diagram: learning(3), color: C.amber, lines: trainingNumbers(3) });
  for (let i = 4; i <= 7; i++) {
    await until(S(35) + 4.78 + (i - 4) * 0.34);
    await play(new M.FadeOut(picture, { runTime: 0.08 }));
    picture = fitP(learning(i));
    await play(new M.FadeIn(picture, { runTime: 0.17 }));
  }

  await until(S(36));
  await view({ title: 'FROZEN = NUMBERS STAY FIXED', color: C.violet,
    diagram: pipeline('Sound', 'Words', { frozen: true, training: true }), lines: null });
  await until(S(37));
  await view({ title: 'JOIN A GOOD EAR TO A GOOD LANGUAGE MODEL', color: C.green,
    diagram: pipeline('Sound', 'Words', { frozen: true }) });
  await until(S(38));
  await view({ title: 'TRAINING THE SMALL ADAPTER COSTS LESS', color: C.amber,
    diagram: P ? group(label('Train all three parts', 0, 2.9, C.muted, 22),
      rect(0, 2.05, 6.6, 0.6, C.muted, 0.26),
      label('Train only the connector', 0, 0.35, C.amber, 22),
      rect(-2.7, -0.5, 1.2, 0.6, C.amber, 0.68),
      label('Illustrative training work', 0, -2.0, C.muted, 18))
    : group(rect(0, 0.67, 5.64, 0.34, C.muted, 0.26),
      label('Train all three parts', 0, 1.23, C.muted),
      rect(-2.31, -0.74, 1.02, 0.34, C.amber, 0.68),
      label('Train only the connector', 0, -0.21, C.amber),
      label('Illustrative training work', 0, -1.36, C.muted, 16)) });
  await until(S(39));
  await view({ title: 'THE SAME IDEA WORKS FOR PICTURES', color: C.violet, diagram: pipeline('Picture', 'Words') });

  await until(S(40));
  await view({ title: 'TRAP · SPEECH COSTS MORE TOKENS', color: C.pink, diagram: tokenCost('trap') });
  await until(S(41));
  await view({ title: 'TYPED · FIVE TOKENS', color: C.green, diagram: tokenCost('text') });
  await until(S(42));
  await view({ title: 'SPOKEN · THIRTY TOKENS', diagram: tokenCost('speech'),
    lines: ['30 ÷ 5 = 6', ['6 times as many tokens', C.amber]] });
  await until(S(43));
  await view({ title: 'LONG RECORDINGS FILL THE WINDOW FAST', diagram: contextPicture(), lines: null });
  await until(S(44));
  await view({ title: 'MODALITY CONNECTOR', color: C.amber, diagram: pipeline('Encoder vectors', 'Word space'),
    lines: ['An adapter into', ['the model’s word space', C.green]] });
}
