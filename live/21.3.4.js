// 21.3.4 Speech representations. Beat i follows sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const Y = P ? -1.45 : -0.55;
  const YS = P ? 1.75 : 1;
  const LEFT = -2.55, RIGHT = 2.95, WIDTH = RIGHT - LEFT;
  const RATE = 16000, FRAME_MS = 25, HOP_MS = 10, BANDS = 80, SECONDS = 1.2;
  const COUNT = SECONDS * 100;
  const words = [
    { word: 'Where', first: 1, last: 30, color: C.cyan },
    { word: 'is', first: 31, last: 50, color: C.green },
    { word: 'the', first: 51, last: 65, color: C.amber },
    { word: 'library', first: 66, last: 120, color: C.violet },
  ];

  const at = (x, y) => [CX + x, Y + y * YS, 0];
  const group = (...parts) => new M.VGroup(...parts);
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 18 : 19);
  const fadeIn = o => new M.FadeIn(o, { runTime: 0.45 });
  const fadeOut = o => new M.FadeOut(o, { runTime: 0.35 });
  const label = (s, x, y, color = C.ink, size = 19, mono = false) =>
    T(s, size, color, mono).moveTo(at(x, y));
  const line = (x0, y0, x1, y1, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: at(x0, y0), end: at(x1, y1), color, strokeWidth });
  const arrow = (x0, y0, x1, y1, color = C.cyan) =>
    new M.Arrow({ start: at(x0, y0), end: at(x1, y1), color, strokeWidth: 3 });

  function dot(x, y, color = C.cyan, radius = 0.07) {
    const d = new M.Dot({ point: at(x, y), radius, color });
    d.setFill(color, 1);
    return d;
  }

  function rect(x, y, width, height, color, opacity = 0, strokeWidth = 2) {
    const r = new M.Rectangle({ width, height: height * YS, color, strokeWidth });
    r.setFill(color, opacity);
    r.moveTo(at(x, y));
    return r;
  }

  let boxNow = null, panel = null, detail = null;
  function fbox(lines, color = C.cyan) {
    const out = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return out;
    const size = P ? 22 : 21, lh = P ? 0.34 : 0.42;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.48;
    const height = rows.length * lh + 0.36;
    const bg = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo([
      BOXP[0] - width / 2 + 0.24 + t.getWidth() / 2,
      BOXP[1] + ((texts.length - 1) / 2 - i) * lh,
      0,
    ]));
    boxNow = group(bg, ...texts);
    const maxWidth = P ? FW - 1.2 : 4.0;
    if (width > maxWidth) boxNow.scale(maxWidth / width);
    out.push(fadeIn(boxNow));
    return out;
  }

  function annotate(next = null) {
    const out = detail ? [fadeOut(detail)] : [];
    detail = next;
    if (next) out.push(fadeIn(next));
    return out;
  }

  function replace(next) {
    const out = annotate();
    if (panel) out.push(fadeOut(panel));
    panel = next;
    out.push(fadeIn(next));
    return out;
  }

  function durationLine(seconds) {
    return group(
      line(LEFT, -0.35, RIGHT, -0.35),
      ...[LEFT, RIGHT].map(x => line(x, -0.45, x, -0.25)),
      label('0 s', LEFT, -0.66, C.muted, 16, true),
      label(`${seconds} s`, RIGHT, -0.66, C.amber, 17, true),
    );
  }

  function conversation() {
    const head = new M.Circle({ radius: 0.19, color: C.ink });
    head.setFill(C.ink, 1);
    head.moveTo(at(-2, 0.35));
    const shoulders = new M.Arc({ radius: 0.33, startAngle: 0, angle: Math.PI, color: C.ink });
    shoulders.moveTo(at(-2, -0.02));
    const mic = new M.RoundedRectangle({ width: 0.38, height: 0.65, cornerRadius: 0.18, color: C.cyan });
    mic.setFill(C.cyan, 0.22);
    mic.moveTo(at(0.15, 0.12));
    return group(
      head, shoulders, arrow(-1.35, 0.1, -0.22, 0.1), mic,
      line(0.15, -0.12, 0.15, -0.38, C.cyan), line(-0.02, -0.38, 0.32, -0.38, C.cyan),
      arrow(0.55, 0.1, 1.33, 0.1),
      rect(2.15, 0.1, 1.35, 0.69, C.green, 0.12),
      label('Guide', 2.15, 0.1, C.green),
      label('Visitor', -2, -0.81, C.ink, 18),
      label('Microphone', 0.15, -0.81, C.cyan, 17),
    );
  }

  function trace(fn, x0, x1, y, amplitude, segments = 96, color = C.cyan) {
    return Array.from({ length: segments }, (_, i) => {
      const a = i / segments, b = (i + 1) / segments;
      return line(x0 + (x1 - x0) * a, y + amplitude * fn(a),
        x0 + (x1 - x0) * b, y + amplitude * fn(b), color, 2);
    });
  }

  const wordEdges = [0, 0.3, 0.5, 0.65, SECONDS];
  function speech(t) {
    const seconds = t * SECONDS;
    const i = wordEdges.slice(1).findIndex(end => seconds < end);
    if (i < 0) return 0;
    const u = (seconds - wordEdges[i]) / (wordEdges[i + 1] - wordEdges[i]);
    const envelope = Math.sin(Math.PI * u) ** 0.65;
    return envelope * (0.68 * Math.sin(2 * Math.PI * (i + 7) * u)
      + 0.23 * Math.sin(2 * Math.PI * (i * 2 + 13) * u));
  }

  function waveform() {
    return group(
      line(LEFT, -0.04, RIGHT, -0.04, C.grid),
      ...trace(speech, LEFT, RIGHT, -0.04, 0.85, 156),
      label('0 s', LEFT, -1.18, C.muted, 18, true),
      label('1.2 s', RIGHT, -1.18, C.muted, 18, true),
      label('Illustrative waveform', 0.2, -1.52, C.muted, 18),
    );
  }

  function pressure() {
    return group(...[0, 1].map(i => {
      const x = i ? 1.65 : -1.25;
      return group(
        ...Array.from({ length: 12 }, (_, k) => {
          const step = i ? 0.31 : 0.15;
          return dot(x + (k % 4 - 1.5) * step, 0.18 - Math.floor(k / 4) * 0.23, C.cyan, 0.045);
        }),
        arrow(x + (i ? 0.4 : -0.4), 0.67, x + (i ? -0.4 : 0.4), 0.67, C.amber),
        label(i ? 'Pulls back' : 'Pushes forward', x, -0.83, C.ink, 17),
      );
    }));
  }

  function samples(showDots) {
    const fn = t => 0.75 * Math.sin(t * Math.PI * 4) + 0.18 * Math.sin(t * Math.PI * 8);
    const marks = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16, x = LEFT + t * WIDTH;
      const offset = 0.76 * fn(t);
      const mark = dot(x, -0.12 + offset);
      if (Math.abs(offset) < 1e-9) return mark;
      return group(line(x, -0.12, x, -0.12 + offset, C.grid), mark);
    });
    return group(
      line(LEFT, -0.12, RIGHT, -0.12, C.muted),
      ...(showDots ? marks : trace(fn, LEFT, RIGHT, -0.12, 0.76)),
      label(showDots ? 'A few measurements, enlarged' : 'Push above · pull below', 0.2, -1.16, C.muted, 19),
    );
  }

  function film() {
    return group(...Array.from({ length: 4 }, (_, i) => {
      const x = -2.15 + 1.55 * i;
      return group(
        rect(x, 0.1, 1.21, 0.99, C.violet, 0.08),
        line(x - 0.49, -0.2, x + 0.49, -0.2, C.muted),
        dot(x - 0.34 + 0.22 * i, 0.02 + 0.23 * Math.sin(i * Math.PI / 3), C.amber, 0.1),
        label(String(i + 1), x, -0.72, C.violet, 17, true),
      );
    }));
  }

  function slicedWave() {
    const ends = [LEFT, -0.8, 1.12, RIGHT];
    return group(
      ...trace(speech, LEFT, RIGHT, -0.11, 0.62, 136),
      ...ends.map(x => line(x, -0.82, x, 0.58, C.amber)),
      ...ends.slice(0, -1).map((x, i) => line(x, 0.58, ends[i + 1] - 0.08, 0.58, C.amber)),
    );
  }

  const msX = ms => LEFT + ms / 40 * WIDTH;
  function bracket(a, b, y, color) {
    const x0 = msX(a), x1 = msX(b);
    return group(line(x0, y, x1, y, color, 3),
      line(x0, y - 0.08, x0, y + 0.08, color),
      line(x1, y - 0.08, x1, y + 0.08, color));
  }

  const peak = distance => Math.exp(-(distance ** 2));

  function frameZoom() {
    const sound = t => (0.11 + 0.82 * peak((t - 0.625) / 0.12))
      * Math.sin(2 * Math.PI * 7 * t);
    return group(
      line(LEFT, -0.25, RIGHT, -0.25, C.grid),
      ...trace(sound, LEFT, RIGHT, -0.25, 0.62, 110),
      ...[0, 10, 25, 35].map(ms => group(
        line(msX(ms), -1.01, msX(ms), -0.89, C.muted),
        label(`${ms} ms`, msX(ms), -1.25, C.muted, 18, true),
      )),
      bracket(0, FRAME_MS, 1.04, C.cyan),
      label('Frame 1', msX(12.5), 0.84, C.cyan, 17),
    );
  }

  function overlap(showEdge) {
    return group(
      bracket(HOP_MS, HOP_MS + FRAME_MS, 0.56, C.violet),
      label('Frame 2', msX(22.5), 0.36, C.violet, 17),
      ...(showEdge ? [
        line(msX(25), -0.72, msX(25), 0.24, C.amber),
        bracket(19, 31, -0.78, C.amber),
        label('One sound', msX(25), -1.57, C.amber, 16),
      ] : []),
    );
  }

  function frameTrack(n, seconds) {
    const dx = WIDTH / n;
    return group(
      ...Array.from({ length: n }, (_, i) =>
        rect(LEFT + dx * (i + 0.5), -0.08, dx * 0.72, i % 10 === 0 ? 0.62 : 0.37, C.cyan, 0.7, 0)),
      label('0 s', LEFT, -0.64, C.muted, 17, true),
      label(`${seconds} s`, RIGHT, -0.64, C.muted, 17, true),
      label(`${n} frame starts`, 0.2, -1.15, C.cyan, 19, true),
    );
  }

  function pitches() {
    return group(
      ...trace(t => Math.sin(t * Math.PI * 4), LEFT, RIGHT, 0.64, 0.26, 48, C.cyan),
      ...trace(t => Math.sin(t * Math.PI * 16), LEFT, RIGHT, -0.52, 0.26, 84, C.violet),
      label('Low hum', 0.2, 1.13, C.cyan),
      label('High whistle', 0.2, -1.05, C.violet),
    );
  }

  // Schematic loudness arranged around the four word spans in the shared example.
  function loudness(frame, band) {
    if (frame >= COUNT) return 0;
    const w = words.findIndex(({ last }) => frame < last);
    const { first, last } = words[w];
    const u = (frame - first + 1) / (last - first + 1);
    const envelope = Math.sin(Math.PI * u) ** 0.55;
    const low = 0.98 * peak((band - (9 + w * 2 + 4 * Math.sin(u * 5))) / 8);
    const mid = 0.73 * peak((band - (29 + w * 4 + 5 * Math.cos(u * 6))) / 10);
    const high = 0.42 * peak((band - (58 - w * 3)) / 13);
    return Math.min(1, envelope * (low + mid + high) * (0.77 + 0.23 * Math.cos(band * 0.61)));
  }

  function bars(n) {
    const dx = WIDTH / n, bottom = -0.86;
    return group(
      line(LEFT, bottom, RIGHT, bottom, C.muted),
      ...Array.from({ length: n }, (_, i) => {
        const value = loudness(20, Math.floor(BANDS * (i + 0.5) / n));
        const height = 0.05 + 2.05 * value;
        return rect(LEFT + dx * (i + 0.5), bottom + height / 2, dx * 0.75, height, C.cyan, 0.92, 0);
      }),
      label('Low pitch', LEFT + 0.55, -1.3, C.muted, 19),
      label('High pitch', RIGHT - 0.6, -1.3, C.muted, 19),
    );
  }

  function bandValues() {
    const parts = [];
    for (let band = 0; band < BANDS; band++) {
      const x = -2.48 + (band % 10) * 0.59;
      const y = 1.13 - Math.floor(band / 10) * 0.29;
      const value = Math.round(99 * loudness(20, band));
      parts.push(rect(x, y, 0.54, 0.26, C.cyan, 0.08 + value / 250, 0),
        label(String(value).padStart(2, '0'), x, y, C.ink, P ? 14 : 15, true));
    }
    return group(...parts, label('One frame · 80 loudness values', 0.2, -1.43, C.muted, 16));
  }

  const HEAT_BOTTOM = -0.79, HEAT_TOP = 0.91;
  const heatX = edge => LEFT + WIDTH * edge / COUNT;
  function heatmap(y0 = HEAT_BOTTOM, y1 = HEAT_TOP) {
    // Average five pitch bands per display stripe. The frame columns retain their time scale.
    const stripes = 16, dy = (y1 - y0) / stripes;
    const parts = [];
    for (let row = 0; row < stripes; row++) {
      const shade = frame => {
        const sum = Array.from({ length: 5 }, (_, k) => loudness(frame, row * 5 + k))
          .reduce((total, value) => total + value, 0);
        return Math.round(sum / 5 * 9);
      };
      let first = 0, previous = shade(0);
      for (let end = 1; end <= COUNT; end++) {
        const next = end < COUNT ? shade(end) : -1;
        if (next === previous) continue;
        const x0 = heatX(first), x1 = heatX(end);
        parts.push(rect((x0 + x1) / 2, y0 + (row + 0.5) * dy, x1 - x0,
          dy * 0.96, C.cyan, 0.06 + previous / 11, 0));
        first = end;
        previous = next;
      }
    }
    return group(...parts);
  }

  function heatAxes() {
    return group(
      arrow(LEFT, -1.15, RIGHT, -1.15, C.muted),
      arrow(LEFT - 0.24, HEAT_BOTTOM, LEFT - 0.24, HEAT_TOP, C.muted),
      label('Time', 0.2, -1.45, C.muted, 19),
      label('Pitch', LEFT + 0.3, 1.2, C.muted, 19),
      label('Bright = loud', RIGHT - 0.8, 1.2, C.amber, 19),
    );
  }

  function stamp(frame, time) {
    const x = heatX(frame - 0.5);
    return group(
      rect(x, (HEAT_BOTTOM + HEAT_TOP) / 2, WIDTH / COUNT, HEAT_TOP - HEAT_BOTTOM, C.amber, 0, 2),
      line(x, HEAT_BOTTOM - 0.2, x, HEAT_BOTTOM - 0.03, C.amber),
      label(time, Math.max(LEFT + 0.28, x), -1.3, C.amber, 17, true),
    );
  }

  function wordSpans(n) {
    return group(...words.slice(0, n).map(({ word, first, last, color }) => {
      const x0 = heatX(first - 1), x1 = heatX(last), x = (x0 + x1) / 2;
      return group(
        line(x0 + 0.02, -0.97, x1 - 0.02, -0.97, color, 4),
        label(word, x, -1.21, color, 17),
        label(`${first}–${last}`, x, -1.51, color, 14, true),
      );
    }));
  }

  function tokenRow() {
    const xs = [-2.1, -0.92, 0.2, 1.35, 2.54];
    const widths = [1.11, 0.78, 0.92, 1.29, 0.55];
    return group(...['where', 'is', 'the', 'library', '?'].map((token, i) =>
      group(rect(xs[i], -0.12, widths[i], 0.58, C.violet, 0.13),
        label(token, xs[i], -0.12, C.ink, 18, true))),
    label('Typed question: 5 text tokens', 0.2, -0.96, C.muted, 17));
  }

  function compareWaveAndHeat() {
    return group(
      label('Waveform', LEFT + 0.63, 1.17, C.muted, 16),
      ...trace(speech, LEFT, RIGHT, 0.54, 0.39, 150),
      label('Spectrogram', LEFT + 0.68, -0.03, C.muted, 16),
      heatmap(-1.43, -0.23),
    );
  }

  function modelInput() {
    const frames = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 10; j++) {
        const value = loudness(6 + i * 4, j * 8);
        frames.push(rect(-2.59 + i * 0.29, -0.57 + j * 0.12, 0.24, 0.1, C.cyan, 0.08 + value * 0.8, 0));
      }
    }
    return group(...frames,
      label('Speech frames', -1.58, -0.93, C.cyan, 17),
      arrow(-0.23, 0.02, 0.94, 0.02, C.amber),
      rect(2.04, 0.02, 1.91, 0.89, C.violet, 0.12),
      label('Language', 2.04, 0.18, C.ink, 18),
      label('model', 2.04, -0.17, C.ink, 18));
  }

  function timingComparison(slow = false, pause = false) {
    const x = t => LEFT + t / 2.4 * WIDTH;
    function row(seconds, y, n, color, gap) {
      const dx = (x(seconds) - LEFT) / n;
      return group(
        ...Array.from({ length: n }, (_, i) => {
          const silent = gap && i >= 100 && i < 140;
          return rect(LEFT + (i + 0.5) * dx, y, dx * 0.75, silent ? 0.13 : 0.37,
            silent ? C.muted : color, silent ? 0.72 : 0.9, 0);
        }),
        label(`${seconds} s · ${n} frames · 4 words`, 0.16, y + 0.44, color, 17, true),
      );
    }
    return group(row(1.2, 0.48, 120, C.cyan, false),
      ...(slow ? [row(2.4, -0.55, 240, C.violet, pause)] : []),
      ...(pause ? [
        line(x(1), -0.86, x(1.4), -0.86, C.amber, 3),
        label('Pause: frames still start', x(1.2), -1.13, C.amber, 16),
      ] : []),
      ...[0, 1.2, 2.4].map(t => group(
        line(x(t), -1.36, x(t), -1.25, C.muted),
        label(`${t} s`, x(t), -1.58, C.muted, 17, true))),
    );
  }

  await until(S(0)); await play(...replace(conversation()), ...say('SPEAK TO THE CAMPUS GUIDE'));
  await until(S(1)); await play(...replace(durationLine(SECONDS)), ...say('“WHERE IS THE LIBRARY?”', C.amber));
  await until(S(2)); await play(...replace(tokenRow()), ...say('HOW CAN A MODEL READ A VOICE?', C.violet));
  await until(S(3)); await play(...replace(pressure()), ...say('AIR PUSHES FORWARD AND BACK'));
  await until(S(4)); await play(...replace(samples(true)), ...say('THE MICROPHONE MEASURES THE PUSH'));
  await until(S(5)); await play(...say('16,000 MEASUREMENTS EACH SECOND', C.amber),
    ...fbox([[`${RATE.toLocaleString('en-US')} per second`, C.amber]]));
  await until(S(6)); await play(...replace(durationLine(SECONDS)),
    ...fbox(['1.2 s × 16,000 per s', ['= 19,200 measurements', C.amber]], C.amber));
  await until(S(7)); await play(...replace(samples(false)), ...say('UP IS PUSH · DOWN IS PULL'), ...fbox([]));
  await until(S(8)); await play(...replace(waveform()), ...say('ONE MEASUREMENT TELLS VERY LITTLE', C.amber),
    ...annotate(group(dot(LEFT + WIDTH * 0.14, -0.04 + speech(0.14) * 0.85, C.amber, 0.09))));
  await until(S(9)); await play(...replace(film()), ...say('A FILM IS A ROW OF STILL PICTURES', C.violet));
  await until(S(10)); await play(...replace(slicedWave()), ...say('CUT SOUND INTO SHORT SLICES'));
  await until(S(11)); await play(...say('ONE SLICE IS ONE FRAME'),
    ...annotate(group(rect((LEFT - 0.8) / 2, -0.12, -0.8 - LEFT, 1.43, C.amber))));
  await until(S(12)); await play(...replace(frameZoom()), ...say('ONE FRAME LASTS 25 MS'),
    ...fbox(['1 ms = 0.001 s', ['25 ms = 0.025 s', C.cyan]]));
  await until(S(13)); await play(...say('400 MEASUREMENTS IN A FRAME', C.amber),
    ...fbox(['16 measurements per ms', ['25 × 16 = 400', C.amber]], C.amber));
  await until(S(14)); await play(...annotate(overlap(false)), ...say('A NEW START EVERY 10 MS', C.violet),
    ...fbox(['Frame 1: 0–25 ms', ['Frame 2: 10–35 ms', C.violet]], C.violet));
  await until(S(15)); await play(...annotate(overlap(true)), ...say('THE NEXT FRAME CATCHES THE WHOLE SOUND', C.amber));
  await until(S(16)); await play(...replace(frameTrack(100, 1)), ...say('100 FRAMES EACH SECOND'),
    ...fbox(['1 second = 1,000 ms', ['1,000 ÷ 10 = 100 starts', C.amber]]));
  await until(S(17)); await play(...replace(frameTrack(COUNT, SECONDS)), ...say('120 FRAMES IN 1.2 SECONDS'),
    ...fbox([['1.2 × 100 = 120 frames', C.amber]]));
  await until(S(18)); await play(...replace(frameZoom()), ...say('HOW DO WE DESCRIBE ONE FRAME?', C.amber), ...fbox([]));
  await until(S(19)); await play(...replace(pitches()), ...say('PITCH MEANS LOW OR HIGH', C.violet));
  await until(S(20)); await play(...replace(group(
    ...trace(t => 0.61 * Math.sin(6 * Math.PI * t), LEFT, RIGHT, 0.8, 0.62, 48, C.cyan),
    ...trace(t => 0.24 * Math.sin(24 * Math.PI * t), LEFT, RIGHT, 0.02, 0.62, 80, C.violet),
    ...trace(t => 0.61 * Math.sin(6 * Math.PI * t) + 0.24 * Math.sin(24 * Math.PI * t),
      LEFT, RIGHT, -0.83, 0.62, 96, C.amber),
    label('Mixed sound', 0.2, -1.37, C.amber, 17),
  )), ...say('QUIET AND LOUD PITCHES MIX'));
  await until(S(21)); await play(...replace(bars(12)), ...say('TALLER BAR MEANS LOUDER PITCH'));
  await until(S(22)); await play(...replace(bars(BANDS)), ...say('MEASURE LOUDNESS IN 80 PITCH BANDS'),
    ...fbox([['1 frame → 80 bands', C.cyan]]));
  await until(S(23)); await play(...replace(bandValues()), ...say('ONE LIST OF 80 NUMBERS'),
    ...fbox(['One number per band', ['Each number is loudness', C.cyan]]));
  await until(S(24)); await play(...say('COUNT ALL THE LOUDNESS VALUES', C.amber),
    ...fbox(['120 frames × 80 values', ['= 9,600 numbers', C.amber]], C.amber));
  await until(S(25)); await play(...replace(heatmap()), ...say('STAND THE FRAMES SIDE BY SIDE'),
    ...fbox(['120 frame columns', '80 bands per column', ['5 bands per display stripe', C.muted]]));
  await until(S(26)); await play(...annotate(heatAxes()), ...say('TIME ACROSS · PITCH UP · LOUDNESS GLOWS'));
  await until(S(27)); await play(...say('SPECTROGRAM', C.violet),
    ...fbox([['Time × pitch bands', C.violet], 'Brightness shows loudness']));
  await until(S(28)); await play(...annotate(stamp(1, '0 s')), ...say('EACH FRAME KEEPS ITS START TIME'),
    ...fbox(['Frame 1', ['Starts at 0 s', C.amber]]));
  await until(S(29)); await play(...annotate(stamp(66, '0.65 s')), ...say('FRAME 66 STARTS AT 0.65 S', C.amber),
    ...fbox(['(66 − 1) × 10 ms', ['= 650 ms = 0.65 s', C.amber]], C.amber));
  await until(S(30)); await play(...annotate(),
    ...say('USE START TIMES TO PLACE THE WORDS'), ...fbox(['“Where is the library?”']));
  await until(S(31)); await play(...annotate(wordSpans(1)), ...say('“WHERE”', C.cyan),
    ...fbox(['Frames 1–30', ['0 to 0.3 s', C.cyan]]));
  await until(S(32)); await play(...annotate(wordSpans(2)), ...say('“IS”', C.green),
    ...fbox(['Frames 31–50', ['0.3 to 0.5 s', C.green]], C.green));
  await until(S(33)); await play(...annotate(wordSpans(3)), ...say('“THE”', C.amber),
    ...fbox(['Frames 51–65', ['0.5 to 0.65 s', C.amber]], C.amber));
  await until(S(34)); await play(...annotate(wordSpans(4)), ...say('“LIBRARY” HAS THE LONGEST SPAN', C.violet),
    ...fbox(['Frames 66–120', ['0.65 to 1.2 s', C.violet]], C.violet));
  await until(S(35)); await play(...say('EVERY FRAME IS USED', C.amber),
    ...fbox(['30 + 20 + 15 + 55', ['= 120 frames', C.amber]], C.amber));
  await until(S(36)); await play(...annotate(heatAxes()), ...say('THE WORD MARKS WERE FOR US', C.violet),
    ...fbox([['Model input: frame values', C.violet], 'and frame start times']));
  await until(S(37)); await play(...replace(group(
    heatmap(), label('0 s', LEFT, -1.09, C.muted, 16, true),
    label('0.65 s', heatX(65), -1.09, C.muted, 16, true),
    label('1.19 s', heatX(119), -1.09, C.muted, 16, true),
  )), ...say('A SPEECH REPRESENTATION'),
    ...fbox(['Start time + 80 values', ['for each frame', C.cyan]]));
  await until(S(38)); await play(...replace(bandValues()), ...say('A WAY TO WRITE SOUND AS NUMBERS'),
    ...fbox(['Illustrated frame', ['Start time: 0.20 s', C.amber]]));
  await until(S(39)); await play(...replace(frameTrack(COUNT, SECONDS)), ...say('COUNT FRAMES USING THE DURATION'),
    ...fbox(['Frames = seconds × 100']));
  await until(S(40)); await play(...say('1.2 SECONDS GIVES 120 FRAMES', C.amber),
    ...fbox([['1.2 × 100 = 120 frames', C.amber]], C.amber));
  await until(S(41)); await play(...replace(modelInput()), ...say('FIRST STEP FOR A MODEL THAT LISTENS'), ...fbox([]));
  await until(S(42)); await play(...replace(compareWaveAndHeat()), ...say('BRIGHT BANDS MAKE SOUND PATTERNS VISIBLE'));
  await until(S(43)); await play(...replace(modelInput()), ...say('NEXT: FEED THE FRAMES TO A LANGUAGE MODEL', C.violet));
  await until(S(44)); await play(...replace(timingComparison()), ...say('FRAMES COUNT TIME', C.amber),
    ...fbox(['“Where is the library?”', ['4 words', C.amber]], C.amber));
  await until(S(45)); await play(...say('SAY THE SAME QUESTION MORE SLOWLY', C.violet),
    ...replace(timingComparison(true)));
  await until(S(46)); await play(...replace(timingComparison(true)), ...say('240 FRAMES · STILL 4 WORDS', C.violet),
    ...fbox(['2.4 × 100 = 240 frames', ['Same question: 4 words', C.violet]], C.violet));
  await until(S(47)); await play(...replace(timingComparison(true, true)), ...say('SILENCE MAKES FRAMES TOO', C.amber),
    ...fbox(['The clock still advances', ['One start every 10 ms', C.amber]], C.amber));
  await until(S(48)); await play(...replace(timingComparison(true)), ...say('SAME WORD COUNT · DIFFERENT FRAME COUNTS', C.amber),
    ...fbox(['4 words in both clips', ['120 frames or 240 frames', C.amber]], C.amber));
  await until(S(49)); await play(...replace(group(heatmap(), heatAxes())),
    ...say('SLICE IN TIME · MEASURE LOUDNESS BY PITCH'),
    ...fbox(['One frame every 10 ms', 'Each frame lasts 25 ms', ['80 pitch-band values', C.cyan]]));
}
