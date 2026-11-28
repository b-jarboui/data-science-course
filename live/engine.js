// Live lesson engine: plays a lesson scene (site/live/<id>.js, manim-web) in sync with its narration mp3,
// with captions, a progress bar, back/forward 10 s and jump anywhere. No video files.
//
// A lesson scene module looks like:
//   export default async function (L) {
//     const { M, S, E, until, play, show, showA, T, pill, P, FW, FH, C } = L;
//     await until(S(0)); await play(new M.FadeIn(x), ...showA('7 STUDENTS'));
//     ...
//   }
// Rules: every beat starts with `await until(S(i))`; only ONE play() at a time (merge with showA);
// LaggedStart takes an ARRAY; set fills with .setFill(color, opacity); place each part with moveTo (no VGroup.shift).
// Never wrap objects that are already on screen in a new VGroup / SurroundingRectangle (it detaches them);
// only do that to remove them (FadeOut(new M.VGroup(...))). Draw outline boxes from coordinates.
// Neural-network lessons: draw the network with L.net({ layers:[2,2,1], center, names, outName }) -> N.group, N.nodes[l][i],
// N.edges[l][i][j], N.value(l,i,'1'), N.weight(l,i,j,w), N.flow(l): circles in layers + weight lines, never a flowchart.
import * as M from 'https://cdn.jsdelivr.net/npm/manim-web@0.42.0/dist/manim-web.browser.js';

export const C = { bg: '#0b1020', ink: '#eef2ff', muted: '#7d89b0', cyan: '#5ad7e8', pink: '#f472b6',
  amber: '#fbbf24', green: '#86efac', violet: '#a78bfa', grid: '#2a3560', line: '#26305a', card: '#0f1630' };

// The lesson modules use Python's runTime spelling. In manim-web 0.42 a
// leaf reads duration, while a LaggedStart computes its own child schedule.
function timing(options = {}) {
  return options.runTime == null ? options : { ...options, duration: options.duration ?? options.runTime };
}

function timed(Animation) {
  return class extends Animation {
    constructor(subject, options) { super(subject, timing(options)); }
  };
}

class LessonLaggedStart extends M.LaggedStart {
  constructor(animations, options = {}) {
    super(animations, options);
    this.naturalDuration = this.duration;
    this.duration = options.duration ?? options.runTime ?? this.duration;
  }

  interpolate(alpha) {
    // The parent converts alpha to seconds on the original child schedule.
    super.interpolate(this.duration > 0 ? alpha * this.naturalDuration / this.duration : 1);
  }
}

const isText = m => m && typeof m.getText === 'function' && typeof m.setText === 'function';
function textsOf(m, out = []) {
  if (isText(m)) { out.push(m); return out; }
  for (const c of m?.submobjects || []) textsOf(c, out);
  return out;
}
// partial arcs (bell tops, handles, half circles) also lose their place in a Transform: same treatment for position
const isArc = m => m && typeof m.getArcCenter === 'function' && Math.abs(m._angle ?? 2 * Math.PI) < 2 * Math.PI - 1e-6;
function arcsOf(m, out = []) {
  if (isArc(m)) { out.push(m); return out; }
  for (const c of m?.submobjects || []) arcsOf(c, out);
  return out;
}

const opOf = m => (typeof m.opacity === 'number' ? m.opacity : 1);
const setOp = (m, v) => { if (typeof m.opacity === 'number') m.opacity = v; };
const worldCenter = m => m.parent && m.parent._localToWorld ? m.parent._localToWorld(m.getCenter()) : m.getCenter();
function worldScale(m) {
  const s = m.scaleVector.toArray(), p = m.parent ? worldScale(m.parent) : [1, 1, 1];
  return s.map((v, i) => v * p[i]);
}

class LessonTransform extends M.Transform {
  constructor(source, target, options = {}) {
    super(source, target, timing(options));
    if (options.pathArc) this.arc = M.pathAlongArc(options.pathArc);
  }

  begin() {
    if (this.arc) {
      this.from = [this.mobject.getCenter()];
      this.to = [this.target.getCenter()];
    }
    // manim-web's Transform moves only point-based shapes: Text inside a group stays behind (labels left on
    // the old spot) and Text -> Text never changes the words or colour (numbers that never update).
    // Pair the texts of source and target in order and carry position, size, words and colour ourselves.
    // Texts inside a group keep LOCAL position/scale (relative to the group), so work in world space.
    const src = textsOf(this.mobject), dst = textsOf(this.target);
    this.texts = src.slice(0, dst.length).map((s, k) => ({ s, d: dst[k], c0: worldCenter(s), c1: worldCenter(dst[k]),
      k0: worldScale(s), k1: worldScale(dst[k]), o0: opOf(s), o1: opOf(dst[k]) }));
    // unmatched texts: extra old ones fade out, extra new ones fade in (no ghost labels, nothing missing)
    this.gone = src.slice(dst.length).map(s => ({ s, o0: opOf(s) }));
    const sa = arcsOf(this.mobject), da = arcsOf(this.target);
    this.arcs = sa.slice(0, da.length).map((a, k) => ({ a, c0: worldCenter(a), c1: worldCenter(da[k]) }));
    this.extra = [];
    const want = dst.slice(src.length).map(d => ({ d, c: worldCenter(d), o1: opOf(d) }));
    super.begin();
    if (this.mobject.add) {
      for (const { d, c, o1 } of want) {
        const t = d.copy();
        this.mobject.add(t);
        t.moveTo(c);
        this.extra.push({ t, o1: o1 || 1 });
        setOp(t, 0);
      }
    }
  }

  interpolate(alpha) {
    super.interpolate(alpha);
    if (this.arc) this.mobject.moveTo(this.arc(this.from, this.to, alpha)[0]);
    for (const p of this.texts || []) {
      const { s, d } = p;
      if (alpha >= 0.5 && !p.swapped) {
        p.swapped = true;
        if (s.getText() !== d.getText()) s.setText(d.getText());
        if (s.getFontSize() !== d.getFontSize()) s.setFontSize(d.getFontSize());
        if (s._color !== d._color) s.setColor(d._color);
      }
      const ps = s.parent ? worldScale(s.parent) : [1, 1, 1];
      s.scaleVector.set(...p.k0.map((v, i) => (v + (p.k1[i] - v) * alpha) / (ps[i] || 1)));
      s.moveTo(p.c0.map((v, i) => v + (p.c1[i] - v) * alpha));
      setOp(s, p.o0 + (p.o1 - p.o0) * alpha);
      s._dirty = true;
    }
    for (const q of this.arcs || []) q.a.moveTo(q.c0.map((v, i) => v + (q.c1[i] - v) * alpha));
    for (const g of this.gone || []) setOp(g.s, g.o0 * (1 - alpha));
    for (const e of this.extra || []) setOp(e.t, e.o1 * alpha);
  }
}

// The copy is transient. Subsequent lesson beats refer to the target itself.
class LessonTransformFromCopy extends M.ReplacementTransform {
  constructor(source, target, options) { super(source.copy(), target, timing(options)); }
}

// Use scene lines so that a flash has the same stroke scale as the diagram.
// Keeping the rays independent also leaves the flashing dot in its own group.
class LessonFlash extends M.Animation {
  constructor(subject, options = {}) {
    const { color = '#ffff00', numLines = 12, flashRadius = 0.3, lineWidth = 3, lineLength = 0.2 } = options;
    const [x, y, z] = subject.getCenter();
    const rays = Array.from({ length: numLines }, (_, k) => {
      const angle = k * 2 * Math.PI / numLines;
      const point = r => [x + r * Math.cos(angle), y + r * Math.sin(angle), z];
      const line = new M.Line({ start: point(flashRadius), end: point(flashRadius + lineLength), color, strokeWidth: lineWidth });
      return { line, point };
    });
    super(new M.VGroup(...rays.map(ray => ray.line)), timing(options));
    this.rays = rays;
    this.radius = flashRadius;
    this.length = lineLength;
    this.remover = true;
  }

  interpolate(alpha) {
    const head = this.radius + this.length * Math.min(1, 2 * alpha);
    const tail = this.radius + this.length * Math.max(0, 2 * alpha - 1);
    for (const { line, point } of this.rays) {
      line.setStart(point(tail));
      line.setEnd(point(head));
    }
    this.mobject.opacity = alpha > 0 && alpha < 1 ? 1 : 0;
  }
}

// Manim (Python) names that lesson writers often use but manim-web lacks: add them so scenes do not crash.
for (const K of [M.VMobject, M.Mobject, M.VGroup].filter(Boolean)) {
  const p = K.prototype;
  if (!p.setStroke) p.setStroke = function (color, width, opacity) {
    if (color && typeof color === 'object' && !Array.isArray(color)) ({ color, width, opacity } = color);
    if (color != null && this.setColor) this.setColor(color);
    if (width != null && this.setStrokeWidth) this.setStrokeWidth(width);
    if (opacity != null && this.setStrokeOpacity) this.setStrokeOpacity(opacity);
    return this;
  };
  if (!p.setStyle) p.setStyle = function (o = {}) {
    if (o.fillColor != null && this.setFill) this.setFill(o.fillColor, o.fillOpacity ?? 1);
    return this.setStroke(o.strokeColor ?? o.color, o.strokeWidth, o.strokeOpacity);
  };
}

// manim-web gives a plain VMobject a 50% white fill, so every hand-drawn curve became a grey wedge.
// A curve is a line: no fill unless the scene asks for one (setFill / fillOpacity still work).
class LessonVMobject extends M.VMobject {
  constructor(options = {}) {
    super(options);
    if (options.fillOpacity == null && options.fillColor == null) this.fillOpacity = 0;
  }
}

const lessonManim = { ...M, VMobject: LessonVMobject, LaggedStart: LessonLaggedStart, Transform: LessonTransform,
  TransformFromCopy: LessonTransformFromCopy, Flash: LessonFlash, FadeIn: timed(M.FadeIn),
  FadeOut: timed(M.FadeOut), Create: timed(M.Create), Indicate: timed(M.Indicate) };

export { lessonManim };

export async function startLesson({ D, lessonFn, mount, audioUrl, els, signal }) {
  // --- size: 16:9 on laptop, 9:16 on phone, fill the space -------------------
  // measure the space around the stage; wait until the page has a real layout (background tabs report 0)
  const host = mount.parentElement || mount;
  for (let i = 0; i < 300 && (host.getBoundingClientRect().width < 50 || host.getBoundingClientRect().height < 50); i++)
    { signal?.throwIfAborted(); await new Promise(r => setTimeout(r, 50)); }
  signal?.throwIfAborted();
  const box = host.getBoundingClientRect();
  const P = box.height > box.width * 1.1;
  const fitSize = b => { let w = b.width, h = P ? w * 16 / 9 : w * 9 / 16; if (h > b.height) { h = b.height; w = P ? h * 9 / 16 : h * 16 / 9; } return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))]; };
  const [w, h] = fitSize(box);
  const sc = new M.Scene(mount, { width: w, height: h, backgroundColor: C.bg, autoRender: false });
  // Three draws opaque strokes before transparent card fills, even when the
  // stroke was added later. Keep 2D lines in the same ordered pass as fills
  // and text. A fade can switch the native material back to opaque each frame.
  sc.threeScene.onBeforeRender = () => {
    sc.threeScene.traverseVisible(object => {
      const material = object.material;
      if (material?.isLineMaterial) {
        material.transparent = true;
        material.depthWrite = false;
      }
    });
  };
  const listeners = new AbortController();
  const on = (target, event, handler) => target.addEventListener(event, handler, { signal: listeners.signal });
  on(window, 'resize', () => sc.resize(...fitSize(host.getBoundingClientRect())));
  const FW = P ? 8 : 14.22, FH = P ? 14.22 : 8;
  if (P) { sc.camera.frameWidth = 8; sc.camera.frameHeight = 14.22; }

  const sans = '"Segoe UI", Arial, sans-serif', monospace = 'Consolas, "Liberation Mono", monospace';
  const T = (text, size = 30, color = C.ink, mono = false, bold = false) =>
    new M.Text({ text, fontSize: size, color, fontFamily: mono ? monospace : sans, fontWeight: bold ? 'bold' : 'normal' });

  // Manim arranges the visible glyphs. Text.getHeight() in manim-web includes
  // the transparent texture margin and line box, even for one capital letter.
  const measure = document.createElement('canvas').getContext('2d');
  function inkBounds(label, text, size, family) {
    measure.font = `bold ${size}pt ${family}`;
    measure.textAlign = 'center';
    measure.textBaseline = 'top';
    const m = measure.measureText(text);
    const padding = size * 0.2;
    const units = label.getWidth() / (m.width + 2 * padding);
    return {
      width: (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * units,
      height: (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * units,
      dx: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) * units / 2,
      dy: label.getHeight() / 2 - padding * units + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * units / 2
    };
  }

  function pill(s, color = C.cyan, size = 20) {
    const t = T(s, size, color, true, true), ink = inkBounds(t, s, size, monospace);
    const width = ink.width + 0.36, height = ink.height + 0.26;
    const r = new M.RoundedRectangle({ width, height, cornerRadius: height / 2, color, strokeWidth: 2 });
    r.setFill(C.bg, 0.92);
    t.moveTo([-ink.dx, -ink.dy, 0]);
    const group = new M.VGroup(r, t);
    if (width > FW - 0.6) group.scale((FW - 0.6) / width);
    return group;
  }

  let pillNow = null;
  const PILLP = P ? [0, 2.65, 0] : [0, 1.85, 0];
  function showA(s, color = C.cyan, where, size = 19) {
    const p = pill(s, color, size).moveTo(where || PILLP);
    const drift = { shift: [0, 0.12, 0] };
    const a = [new M.FadeIn(p, drift)];
    if (pillNow) a.push(new M.FadeOut(pillNow, drift));
    pillNow = p;
    return a;
  }

  function addBackdrop() {
    // The NumberPlane in dslib has half-unit spacing and invisible axes.
    const lines = [];
    function line(start, end) {
      const gridLine = new M.Line({ start, end, color: C.grid, strokeWidth: 1 });
      gridLine.setStrokeOpacity(0.22);
      lines.push(gridLine);
    }
    for (let x = 0.5; x < FW / 2; x += 0.5) {
      for (const v of [-x, x]) line([v, -FH / 2, -0.02], [v, FH / 2, -0.02]);
    }
    for (let y = 0.5; y < FH / 2; y += 0.5) {
      for (const v of [-y, y]) line([-FW / 2, v, -0.02], [FW / 2, v, -0.02]);
    }
    const grid = new M.VGroup(...lines);
    grid.disableChildZLayering();
    sc.add(grid);
    const kicker = pill(D.kicker, C.cyan, P ? 15 : 17);
    const top = FH / 2 - (P ? 1.25 : 0.35);
    // Measure the border, independent of the transparent padding on the text.
    const height = kicker.submobjects[0].getHeight();
    kicker.moveTo([0, top - height / 2, 0]);

    const title = D.short || D.title, size = P ? 40 : 46;
    const label = T(title, size, C.ink, false, true), ink = inkBounds(label, title, size, sans);
    const scale = Math.min(1, (FW - 0.8) / ink.width);
    label.scale(scale);
    label.moveTo([-ink.dx * scale, top - height - 0.28 - scale * (ink.height / 2 + ink.dy), 0]);
    sc.add(kicker, label);
  }

  // net(): the classic neural-network picture every network lesson uses (PEDAGOGY.md "Neural networks look like networks").
  // Neurons are circles in columns (layers), weights are lines (thickness = size, cyan = positive, pink = negative).
  //   const N = net({ layers: [2, 2, 1], center: [0, 0, 0], width: 7, height: 3.2, names: ['corner A','corner B'], outName: 'score' });
  //   await play(new M.FadeIn(N.group));               // or LaggedStart over N.nodes.flat() then N.edges.flat(2)
  //   await play(...N.value(0, 0, '1'), ...N.value(0, 1, '0'));          // numbers inside neurons
  //   await play(...N.weight(0, 0, 1, -1));            // set/restyle one weight (layer, from, to, w)
  //   await play(...N.flow(0));                        // a pulse travels along every line of layer 0 -> 1
  // N.nodes[l][i] circle, N.edges[l][i][j] line, N.labels[] names; all objects are created here, never re-wrapped.
  function net({ layers, center = [0, 0, 0], width = P ? 6.6 : 8, height = P ? 4 : 3.6, r = P ? 0.32 : 0.3,
                 names = [], outName = '', color = C.cyan }) {
    const L0 = layers.length, nodes = [], edges = [], labels = [];
    const xs = layers.map((_, l) => center[0] - width / 2 + (L0 === 1 ? width / 2 : l * width / (L0 - 1)));
    const pos = (l, i) => [xs[l], center[1] + (layers[l] - 1) * height / Math.max(1, Math.max(...layers) - 1) / 2
                          - i * height / Math.max(1, Math.max(...layers) - 1), 0];
    for (let l = 0; l < L0; l++) {
      nodes.push([]);
      for (let i = 0; i < layers[l]; i++) {
        const c = new M.Circle({ radius: r, color: l === L0 - 1 ? C.amber : (l === 0 ? C.violet : color), strokeWidth: 3 });
        c.setFill(C.card, 0.95); c.moveTo(pos(l, i)); nodes[l].push(c);
      }
    }
    const style = (ln, w) => { const a = Math.min(1, Math.abs(w)); ln.setColor(w < 0 ? C.pink : C.cyan); ln.setStrokeWidth(1.5 + 4 * a); ln.setStrokeOpacity(0.35 + 0.6 * a); };
    for (let l = 0; l < L0 - 1; l++) {
      edges.push([]);
      for (let i = 0; i < layers[l]; i++) {
        edges[l].push([]);
        for (let j = 0; j < layers[l + 1]; j++) {
          const a = pos(l, i), b = pos(l + 1, j);
          const ln = new M.Line({ start: [a[0] + r, a[1], -0.01], end: [b[0] - r, b[1], -0.01], color: C.muted, strokeWidth: 2 });
          ln.setStrokeOpacity(0.55); edges[l][i].push(ln);
        }
      }
    }
    names.forEach((s, i) => { if (i < layers[0]) { const t = T(s, P ? 15 : 16, C.muted); const p = pos(0, i); t.moveTo([p[0] - r - 0.25 - t.getWidth() / 2, p[1], 0]); labels.push(t); } });
    if (outName) { const p = pos(L0 - 1, 0); const t = T(outName, P ? 15 : 16, C.amber); t.moveTo([p[0] + r + 0.25 + t.getWidth() / 2, p[1], 0]); labels.push(t); }
    const group = new M.VGroup(...edges.flat(2), ...nodes.flat(), ...labels);
    const vals = {};
    return {
      nodes, edges, labels, group, pos,
      value(l, i, s, col = C.ink) {           // number inside a neuron (replaces the previous one)
        const t = T(String(s), P ? 18 : 18, col, true); t.moveTo(pos(l, i));
        const k = l + ':' + i, a = [new M.FadeIn(t)]; if (vals[k]) a.push(new M.FadeOut(vals[k])); vals[k] = t; return a;
      },
      weight(l, i, j, w) { const ln = edges[l][i][j]; const t = ln.copy(); style(t, w); return [new M.Transform(ln, t)]; },
      flow(l, col = C.amber) {                // a bright pulse runs along every line from layer l to l+1
        // flash the real line (ShowPassingFlash draws its own pulse and removes it at the end; a copy would stay on screen)
        return [new M.LaggedStart(edges[l].flat().map(ln => new M.ShowPassingFlash(ln, { color: col, strokeWidth: 5, timeWidth: 0.4 })), { lagRatio: 0.08 })];
      },
    };
  }

  // The media element owns the clock. Each invocation of the lesson has one
  // cursor and at most one suspended until()/play(). Manim's Timeline samples
  // a play group without starting Scene.play()'s independent RAF and timer.
  const audio = new Audio(audioUrl);
  const S = i => D.timing[Math.min(i, D.timing.length - 1)][0];
  const E = i => D.timing[Math.min(i, D.timing.length - 1)][1];
  const duration = () => Number.isFinite(audio.duration) ? audio.duration : D.T;
  const cancelled = new Error('Lesson run cancelled');
  let run = null, frame = null, ended = false, dragging = false;
  let playing = false, started = false, disposed = false, playRequest = 0;
  let errorText = '';

  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function updateControls() {
    const end = duration(), t = ended ? end : audio.currentTime;
    els.bar.max = Math.ceil(end * 10) / 10;
    if (!dragging) els.bar.value = ended ? els.bar.max : t;
    let i = -1;
    D.timing.forEach(([start], n) => { if (t >= start - 0.05) i = n; });
    const cap = started && !ended && i >= 0 && t < E(i) + 0.35 ? D.sentences[i] : '';
    if (els.cap.textContent !== (errorText || cap)) els.cap.textContent = errorText || cap;
    els.time.textContent = `${mmss(t)} / ${mmss(end)}`;
    const label = ended ? 'Replay' : audio.paused ? 'Play' : 'Pause';
    els.play.textContent = { Replay: '↺', Play: '▶', Pause: '❚❚' }[label];
    els.play.setAttribute('aria-label', label);
  }

  function stopFrames() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  function cancelRun() {
    const previous = run;
    run = null;
    previous?.pending?.reject(cancelled);
  }
  function sample() {
    run?.pending?.sample();
    updateControls();
  }
  function tick() {
    frame = null;
    if (!playing || audio.paused || audio.seeking || ended || disposed) return;
    sample();
    frame = requestAnimationFrame(tick);
  }
  function pause() {
    ++playRequest;
    playing = false;
    audio.pause();
    stopFrames();
    sample();
  }
  function finish() {
    if (disposed || ended) return;
    ended = true;
    dragging = false;
    pause(); // sample once at the media endpoint, then keep that canvas
  }
  function fail(error) {
    cancelRun();
    errorText = 'Error: ' + error.message;
    pause();
    console.error(error);
  }

  function startRun() {
    cancelRun();
    const owner = { pending: null, catching: true };
    run = owner;
    let cursor = 0, dirty = false;
    const check = () => { if (owner !== run) throw cancelled; };
    function paint() {
      if (dirty) sc.render();
      dirty = false;
    }
    // Completed steps can be reconstructed in the same turn. Only paint
    // the visible frame when we reach the requested time or the last step.
    function waitFor(target, draw) {
      check();
      return new Promise((resolve, reject) => {
        function sampleStep() {
          try {
            check();
            const t = audio.currentTime;
            if (draw) draw(t);
            if (t >= target) {
              owner.pending = null;
              resolve();
              return;
            }
            paint();
            owner.catching = false;
            if (ended) cancelRun();
          } catch (error) {
            owner.pending = null;
            reject(error);
          }
        }
        owner.pending = { sample: sampleStep, reject };
        sampleStep();
      });
    }
    function until(t) {
      cursor = Math.max(cursor, t);
      dirty = true; // A lesson may change a fill or opacity directly between plays.
      return waitFor(cursor);
    }
    async function play(...animations) {
      check();
      if (!animations.length) return;
      const members = [];
      function collect(a) {
        members.push(a);
        if (a instanceof M.AnimationGroup) a.animations.forEach(collect);
      }
      animations.forEach(collect);
      // Match Scene.play's setup and cleanup for nested groups, removers
      // and transforms. The Timeline applies Manim's duration and easing.
      members.forEach(a => a.mobject.getThreeObject());
      animations.forEach(a => a.begin());
      members.forEach(a => sc.add(a.mobject));
      const timeline = new M.Timeline().addParallel(animations);
      const start = cursor, length = timeline.getDuration();
      cursor += length;
      let last = -1;
      await waitFor(cursor, t => {
        const offset = t >= cursor ? length : Math.max(0, t - start);
        if (offset === last) return;
        timeline.seek(offset);
        last = offset;
        dirty = true;
      });
      check();
      members.forEach(a => a.cleanUpFromScene(sc));
      dirty = true;
    }
    const show = (...args) => play(...showA(...args));
    const L = { M: lessonManim, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, net, END: D.T, LINE_Y: P ? 0.9 : 0.1 };
    lessonFn(L).then(() => {
      check();
      dirty = true;
      paint();
      owner.catching = false;
    }).catch(error => { if (owner === run && error !== cancelled) fail(error); });
  }

  function rebuild() {
    cancelRun();
    sc.clear();
    pillNow = null;
    addBackdrop();
    sc.render();
    started = true;
    errorText = '';
    startRun();
  }
  function seek(seconds) {
    if (disposed || !Number.isFinite(seconds)) return;
    const t = Math.max(0, Math.min(duration(), seconds));
    ended = Number.isFinite(audio.duration) && t >= audio.duration;
    if (ended) pause();
    audio.currentTime = t;
    rebuild();
    updateControls();
  }
  function resume() {
    const request = ++playRequest;
    // Keep play() in the user gesture, including replay and the first skip.
    const attempt = audio.play();
    updateControls();
    attempt.catch(error => {
      if (disposed || request !== playRequest) return;
      playing = false;
      stopFrames();
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') fail(error);
      else updateControls();
    });
  }

  on(audio, 'playing', () => {
    if (audio.paused || ended) return;
    playing = true;
    if (frame === null) tick();
  });
  for (const event of ['pause', 'waiting', 'seeking']) {
    on(audio, event, () => {
      if (event === 'pause' && !audio.paused) return;
      if (event === 'seeking' && !audio.seeking) return;
      playing = false;
      stopFrames();
      sample();
    });
  }
  on(audio, 'ended', () => { if (audio.ended) finish(); });
  on(audio, 'timeupdate', sample);
  on(audio, 'durationchange', updateControls);
  on(audio, 'error', () => fail(new Error(audio.error?.message || 'Could not load narration')));
  on(els.bar, 'input', () => { dragging = true; });
  on(els.bar, 'change', () => { dragging = false; seek(+els.bar.value); });
  on(els.bar, 'pointercancel', () => { dragging = false; updateControls(); });
  on(els.play, 'click', () => {
    if (ended || audio.ended || errorText) seek(0);
    if (!audio.paused) { pause(); return; }
    if (!started) { started = true; startRun(); }
    resume();
  });
  on(els.back, 'click', () => { if (started) seek(audio.currentTime - 10); });
  on(els.fwd, 'click', () => {
    const first = !started;
    seek(audio.currentTime + 10);
    if (first && !ended) resume();
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    cancelRun();
    stopFrames();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    sc.dispose();
  }
  addBackdrop();
  sc.render();
  updateControls();
  return { sc, audio, seek, pause, dispose, ended: () => ended, catching: () => !!run?.catching };
}
