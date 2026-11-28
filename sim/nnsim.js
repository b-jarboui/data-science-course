// file site/sim/nnsim.js

/**
 * Neural Network Playground
 * ------------------------------------------------------------
 * A small, real neural network for beginners.
 *
 * No dependencies. No server. No external assets.
 * All learning happens locally in the browser.
 *
 * Network:
 *   - Two inputs
 *   - One or two hidden layers, with tanh activation
 *   - One sigmoid output
 *   - Binary cross-entropy error
 *   - Full-batch gradient descent, including biases
 *
 * Options:
 *   layers:     [2, 3, 1] or [2, 4, 4, 1]
 *   shape:      "groups" | "circle" | "xor" | "spiral"
 *   lr:         learning rate, from 0.01 to 40
 *   speed:      animation speed, from 1 to 10
 *   showMap:    true
 *   showCurve:  true
 *   lockLayers: false
 *   challenges: undefined (built-in challenges), or an array
 *
 * Custom challenges:
 *   {
 *     title: "Make the error smaller than 0.2.",
 *     check: state => state.error < 0.2,
 *     feedback: (state, done) => done ? "You did it!" : "Keep trying."
 *   }
 *
 * Returns:
 *   { destroy(), getState() }
 *
 * The animation shows one example point.
 * Each learning step uses ALL the training points.
 *
 * Browser interaction has not been runtime-tested here.
 * The accompanying example page can be used for a smoke test.
 */

const NN_COLORS = {
  bg: "#0b1020",
  card: "#0f1630",
  ink: "#eef2ff",
  muted: "#7d89b0",
  cyan: "#5ad7e8",
  pink: "#f472b6",
  amber: "#fbbf24",
  green: "#86efac",
  violet: "#a78bfa"
};

const SHAPES = [
  {
    id: "groups",
    name: "Two groups",
    icon: "groups",
    hint: "Can one line separate the two colours?"
  },
  {
    id: "circle",
    name: "Circle inside",
    icon: "circle",
    hint: "Can the network draw a circle?"
  },
  {
    id: "xor",
    name: "Four corners (XOR)",
    icon: "xor",
    hint: "One straight line is not enough here."
  },
  {
    id: "spiral",
    name: "Spiral",
    icon: "spiral",
    hint: "This shape is harder. Try more circles."
  }
];

const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_SIZE = 40;
const MIN_LR = 0.01;
const MAX_LR = 40;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const random = (min, max) => min + Math.random() * (max - min);

const numberOr = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const formatError = n =>
  Number.isFinite(n) ? n.toFixed(3) : "—";

const formatValue = n =>
  Math.abs(n) < 0.005 ? "0.00" : n.toFixed(2);

const formatRate = n =>
  n >= 10 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toFixed(3);

function normalizeShape(shape) {
  const aliases = {
    blobs: "groups",
    cluster: "groups",
    clusters: "groups",
    "two groups": "groups",
    "circle inside": "circle",
    "four corners": "xor",
    "four corners (xor)": "xor"
  };

  const key = String(shape || "groups").toLowerCase();
  const normalized = aliases[key] || key;

  return SHAPES.some(s => s.id === normalized)
    ? normalized
    : "groups";
}

function normalizeLayers(layers) {
  if (!Array.isArray(layers) || layers.length < 3) {
    return [2, 3, 1];
  }

  const hidden = layers
    .slice(1, -1)
    .slice(0, 2)
    .map(n => clamp(Math.round(numberOr(n, 3)), 1, 8));

  return [2, ...(hidden.length ? hidden : [3]), 1];
}

function sigmoid(x) {
  // This form remains safe even for very large numbers.
  if (x >= 0) {
    return 1 / (1 + Math.exp(-x));
  }

  const e = Math.exp(x);
  return e / (1 + e);
}

function svgElement(name, attrs = {}) {
  const element = document.createElementNS(SVG_NS, name);

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }

  return element;
}

function setAttrs(element, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

/* ============================================================
   DATA
   ============================================================ */

function makePoints(shape) {
  const points = [];

  const add = (x, y, label) => {
    points.push({
      x: clamp(x, -0.97, 0.97),
      y: clamp(y, -0.97, 0.97),
      label
    });
  };

  if (shape === "groups") {
    for (let label = 0; label <= 1; label++) {
      const side = label ? 1 : -1;

      for (let i = 0; i < 48; i++) {
        const angle = random(0, Math.PI * 2);
        const radius = Math.sqrt(Math.random());

        add(
          side * 0.53 + Math.cos(angle) * radius * 0.32,
          side * 0.29 + Math.sin(angle) * radius * 0.49,
          label
        );
      }
    }
  }

  if (shape === "circle") {
    for (let label = 0; label <= 1; label++) {
      for (let i = 0; i < 48; i++) {
        const angle = random(0, Math.PI * 2);

        const radius = label
          ? Math.sqrt(Math.random()) * 0.43
          : random(0.66, 0.93);

        add(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          label
        );
      }
    }
  }

  if (shape === "xor") {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const label = sx === sy ? 1 : 0;

        for (let i = 0; i < 24; i++) {
          add(
            sx * 0.55 + random(-0.27, 0.27),
            sy * 0.55 + random(-0.27, 0.27),
            label
          );
        }
      }
    }
  }

  if (shape === "spiral") {
    for (let label = 0; label <= 1; label++) {
      for (let i = 0; i < 60; i++) {
        const t = (i + 0.5) / 60;
        const radius = 0.10 + t * 0.82 + random(-0.025, 0.025);

        const angle =
          t * Math.PI * 2.6 +
          label * Math.PI +
          random(-0.15, 0.15);

        add(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          label
        );
      }
    }
  }

  return shuffle(points).map((point, index) => ({
    ...point,
    index
  }));
}

/* ============================================================
   THE REAL NEURAL NETWORK
   ============================================================ */

function createNetwork(layers) {
  const weights = [];
  const biases = [];

  for (let l = 1; l < layers.length; l++) {
    const inputCount = layers[l - 1];
    const outputCount = layers[l];

    // Balanced random starting weights.
    const limit = Math.sqrt(6 / (inputCount + outputCount));

    weights.push(
      Array.from({ length: outputCount }, () =>
        Array.from({ length: inputCount }, () =>
          random(-limit, limit)
        )
      )
    );

    biases.push(
      Array.from({ length: outputCount }, () => random(-0.15, 0.15))
    );
  }

  return {
    layers: [...layers],
    weights,
    biases,

    // Reused memory for fast map drawing.
    scratch: layers.map(size => new Float64Array(size))
  };
}

function forward(network, x, y) {
  const activations = [[x, y]];
  let outputLogit = 0;

  for (let l = 0; l < network.weights.length; l++) {
    const previous = activations[l];
    const isOutput = l === network.weights.length - 1;
    const current = [];

    for (let j = 0; j < network.weights[l].length; j++) {
      let sum = network.biases[l][j];

      for (let i = 0; i < previous.length; i++) {
        sum += network.weights[l][j][i] * previous[i];
      }

      current.push(isOutput ? sigmoid(sum) : Math.tanh(sum));

      if (isOutput) {
        outputLogit = sum;
      }
    }

    activations.push(current);
  }

  return {
    activations,
    probability: activations.at(-1)[0],
    logit: outputLogit
  };
}

function predict(network, x, y) {
  // Allocation-free forward pass for drawing the map.
  const a = network.scratch;

  a[0][0] = x;
  a[0][1] = y;

  for (let l = 0; l < network.weights.length; l++) {
    const isOutput = l === network.weights.length - 1;
    const previous = a[l];
    const current = a[l + 1];
    const w = network.weights[l];
    const b = network.biases[l];

    for (let j = 0; j < current.length; j++) {
      let sum = b[j];

      for (let i = 0; i < previous.length; i++) {
        sum += w[j][i] * previous[i];
      }

      current[j] = isOutput ? sigmoid(sum) : Math.tanh(sum);
    }
  }

  return a[a.length - 1][0];
}

function pointError(logit, label) {
  // Numerically stable binary cross-entropy.
  return (
    Math.max(logit, 0) -
    logit * label +
    Math.log1p(Math.exp(-Math.abs(logit)))
  );
}

function measureNetwork(network, points, calculateGradients = false) {
  const L = network.weights.length;

  const dW = calculateGradients
    ? network.weights.map(layer =>
        layer.map(row => row.map(() => 0))
      )
    : null;

  const dB = calculateGradients
    ? network.biases.map(layer => layer.map(() => 0))
    : null;

  let error = 0;
  let wrong = 0;

  for (const point of points) {
    const result = forward(network, point.x, point.y);
    const a = result.activations;
    const p = result.probability;

    error += pointError(result.logit, point.label);

    if (Number(p >= 0.5) !== point.label) {
      wrong++;
    }

    if (!calculateGradients) {
      continue;
    }

    const deltas = new Array(L);

    // Sigmoid output + cross-entropy.
    deltas[L - 1] = [p - point.label];

    // Work backwards through each hidden layer.
    for (let l = L - 2; l >= 0; l--) {
      deltas[l] = new Array(network.layers[l + 1]).fill(0);

      for (let i = 0; i < deltas[l].length; i++) {
        let pushedBack = 0;

        for (let j = 0; j < deltas[l + 1].length; j++) {
          pushedBack +=
            network.weights[l + 1][j][i] * deltas[l + 1][j];
        }

        const activation = a[l + 1][i];

        deltas[l][i] =
          pushedBack * (1 - activation * activation);
      }
    }

    // Collect the change suggested by this point.
    for (let l = 0; l < L; l++) {
      for (let j = 0; j < deltas[l].length; j++) {
        dB[l][j] += deltas[l][j];

        for (let i = 0; i < a[l].length; i++) {
          dW[l][j][i] += deltas[l][j] * a[l][i];
        }
      }
    }
  }

  return {
    error: error / points.length,
    wrong,
    accuracy: 1 - wrong / points.length,
    dW,
    dB
  };
}

function applyGradients(network, gradients, lr, count) {
  const scale = lr / count;

  // All weights change together, after all gradients are known.
  for (let l = 0; l < network.weights.length; l++) {
    for (let j = 0; j < network.weights[l].length; j++) {
      network.biases[l][j] -= scale * gradients.dB[l][j];

      for (let i = 0; i < network.weights[l][j].length; i++) {
        network.weights[l][j][i] -=
          scale * gradients.dW[l][j][i];
      }
    }
  }
}

/* ============================================================
   CHALLENGES
   ============================================================ */

const BUILTIN_CHALLENGES = [
  {
    id: "groups",
    title: "Make the network separate the two groups.",
    check: s => s.shape === "groups" && s.error < 0.1,
    feedback: (s, done) => {
      if (done) return "Lovely! The network found a good dividing line.";
      if (s.shape !== "groups") return "Choose Two groups to begin.";
      return "Press Learn. Try to bring the error below 0.1.";
    }
  },
  {
    id: "xor",
    title: "Try Four corners with only ONE hidden circle. Can it learn?",
    check: s => s.xorSteps >= 10,
    feedback: (s, done) => {
      if (done) {
        return "One circle can only make a straight split. Try adding circles.";
      }

      if (s.shape !== "xor") {
        return "Choose Four corners first.";
      }

      if (!s.layers.slice(1, -1).every(n => n === 1)) {
        return "Set each hidden layer to one circle.";
      }

      return "Let it learn. Watch which corners stay the wrong colour.";
    }
  },
  {
    id: "speed",
    title: "Make the learning speed too high. Watch the error.",
    check: s => s.highJump,
    feedback: (s, done) => {
      if (done) {
        return "The error jumped up! Big changes can miss a good answer.";
      }

      if (s.lr < 5) {
        return "Move Learning speed far to the right.";
      }

      if (s.highSteps >= 5) {
        return "Still steady? Try a higher speed, or start again.";
      }

      return "Take a few learning steps. Does the error go up?";
    }
  },
  {
    id: "manual",
    title: "Pause and change one weight by hand. Watch the map.",
    check: s => s.manualEdits > 0,
    feedback: (s, done) =>
      done
        ? "You changed the network yourself! Try making the error smaller."
        : "Pause, tap a line, then move its weight slider."
  }
];

function resolveChallenges(value) {
  if (value === undefined || value === true) {
    return BUILTIN_CHALLENGES;
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    if (typeof item === "string") {
      return (
        BUILTIN_CHALLENGES.find(c => c.id === item) || {
          id: `custom-${index}`,
          title: item,
          feedback: "Try this and watch what changes."
        }
      );
    }

    const base = BUILTIN_CHALLENGES.find(c => c.id === item?.id);

    return {
      ...(base || {}),
      ...(item || {}),
      id: item?.id || `custom-${index}`,
      title: item?.title || base?.title || "Try something new."
    };
  });
}

/* ============================================================
   STYLES
   ============================================================ */

const STYLES = `
  :host {
    display: block;
    color-scheme: dark;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #eef2ff;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  *, *::before, *::after { box-sizing: border-box; }

  button, select, input { font: inherit; }

  button, select {
    -webkit-tap-highlight-color: transparent;
  }

  button { cursor: pointer; }

  button:disabled, select:disabled, input:disabled {
    opacity: .42;
    cursor: not-allowed;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible,
  canvas:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid #5ad7e8;
    outline-offset: 4px;
  }

  [hidden] { display: none !important; }

  .shell {
    --bg: #0b1020;
    --card: #0f1630;
    --ink: #eef2ff;
    --muted: #7d89b0;
    --cyan: #5ad7e8;
    --pink: #f472b6;
    --amber: #fbbf24;
    --green: #86efac;
    --violet: #a78bfa;
    container-type: inline-size;
    max-width: 1260px;
    margin: 0 auto;
    padding: clamp(14px, 3vw, 32px);
    background: var(--bg);
    border-radius: 24px;
  }

  .hero {
    position: relative;
    overflow: hidden;
    margin-bottom: 24px;
    padding: clamp(19px, 4vw, 34px);
    border: 1px solid rgba(90,215,232,.14);
    border-radius: 22px;
    background:
      radial-gradient(ellipse at 95% 0%,
        rgba(90,215,232,.12), transparent 55%),
      radial-gradient(ellipse at 5% 100%,
        rgba(167,139,250,.09), transparent 55%),
      #10182e;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    color: var(--cyan);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 12px var(--cyan);
  }

  h1, h2, h3, p { margin: 0; }

  h1 {
    font-size: clamp(25px, 4.5vw, 42px);
    letter-spacing: -.045em;
    line-height: 1.15;
    font-weight: 760;
  }

  .hero p:last-child {
    max-width: 580px;
    margin-top: 12px;
    color: #b4bfdd;
    font-size: 15px;
  }

  h2 {
    font-size: 18px;
    letter-spacing: -.025em;
    line-height: 1.3;
  }

  h3 {
    font-size: 13px;
    font-weight: 700;
  }

  .muted { color: var(--muted); }

  .small {
    font-size: 12px;
    color: #a3afd0;
  }

  .card {
    min-width: 0;
    padding: clamp(14px, 2.3vw, 20px);
    border: 1px solid rgba(125,137,176,.18);
    border-radius: 20px;
    background: var(--card);
    box-shadow: 0 10px 30px rgba(0,0,0,.14);
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .section-head p {
    margin-top: 4px;
    color: #a3afd0;
    font-size: 12px;
  }

  .section-number {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-right: 7px;
    border-radius: 8px;
    background: rgba(90,215,232,.10);
    color: var(--cyan);
    font-size: 12px;
    font-weight: 800;
    vertical-align: 2px;
  }

  .controls {
    display: grid;
    gap: 18px;
    margin-bottom: 16px;
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 15px;
    border: 1px solid rgba(125,137,176,.26);
    border-radius: 11px;
    background: #19233f;
    color: var(--ink);
    font-size: 13px;
    font-weight: 680;
    line-height: 1.3;
    transition:
      background .16s,
      border-color .16s,
      transform .16s,
      box-shadow .16s;
  }

  .btn:hover:not(:disabled) {
    background: #243250;
    border-color: #7d89b0;
  }

  .btn:active:not(:disabled) {
    transform: scale(.97);
  }

  .btn.primary {
    color: #071c25;
    background: var(--cyan);
    border-color: var(--cyan);
    box-shadow: 0 3px 18px rgba(90,215,232,.14);
    font-weight: 800;
  }

  .btn.primary:hover:not(:disabled) {
    background: #8ae6f2;
    border-color: #8ae6f2;
  }

  .btn.play {
    color: var(--green);
    background: rgba(134,239,172,.08);
    border-color: rgba(134,239,172,.3);
    min-width: 105px;
  }

  .btn.play[aria-pressed="true"] {
    color: var(--amber);
    border-color: rgba(251,191,36,.35);
    background: rgba(251,191,36,.10);
  }

  .btn-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
  }

  .control-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 16px;
    padding-top: 17px;
    border-top: 1px solid rgba(125,137,176,.15);
  }

  .control-group { min-width: 0; }

  .control-group h3 {
    margin-bottom: 10px;
    color: #c6d0eb;
  }

  .shape-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .shape-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    min-height: 48px;
    padding: 7px 9px;
    border: 1px solid rgba(125,137,176,.22);
    border-radius: 10px;
    background: #131d37;
    color: #aebbdc;
    font-size: 12px;
    font-weight: 650;
    text-align: left;
    transition: background .18s, border-color .18s;
  }

  .shape-btn:hover {
    border-color: var(--muted);
  }

  .shape-btn[aria-pressed="true"] {
    border-color: rgba(90,215,232,.65);
    background: rgba(90,215,232,.09);
    color: var(--ink);
  }

  .shape-btn svg {
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: #0b1020;
  }

  .shape-hint {
    min-height: 32px;
    margin-top: 8px;
    font-size: 12px;
    color: #a3afd0;
  }

  .layer-choice {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }

  .layer-choice .btn {
    flex: 1;
    min-width: 0;
    padding: 8px;
  }

  .layer-choice .btn[aria-pressed="true"] {
    color: var(--cyan);
    border-color: rgba(90,215,232,.52);
    background: rgba(90,215,232,.08);
  }

  .layer-size {
    display: grid;
    grid-template-columns: minmax(0,1fr) 44px 24px 44px;
    align-items: center;
    gap: 5px;
    margin-top: 7px;
  }

  .layer-size label {
    color: #b6c2e1;
    font-size: 12px;
  }

  .square-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    font-size: 21px;
    font-weight: 500;
  }

  .layer-number {
    color: var(--cyan);
    font-size: 16px;
    font-weight: 750;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .range-group + .range-group {
    margin-top: 15px;
  }

  .range-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #c6d0eb;
    font-size: 13px;
    font-weight: 650;
  }

  .range-value {
    color: var(--cyan);
    font-size: 12px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }

  input[type="range"] {
    display: block;
    width: 100%;
    height: 34px;
    margin: 0;
    accent-color: var(--cyan);
    cursor: pointer;
    touch-action: pan-y;
  }

  .range-ends {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: -2px;
    color: #a3afd0;
    font-size: 11px;
  }

  .rate-hint {
    min-height: 32px;
    margin-top: 6px;
    font-size: 12px;
    color: #a3afd0;
  }

  .rate-hint.warning {
    color: var(--amber);
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .metric {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid rgba(125,137,176,.15);
    border-radius: 13px;
    background: #111a32;
  }

  .metric-label {
    color: #a3afd0;
    font-size: 11px;
    font-weight: 650;
  }

  .metric-value {
    margin-top: 3px;
    font-size: clamp(20px, 3vw, 30px);
    line-height: 1.2;
    letter-spacing: -.04em;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }

  .amber { color: var(--amber); }
  .cyan { color: var(--cyan); }
  .green { color: var(--green); }
  .pink { color: var(--pink); }

  .visuals {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .visuals.single {
    grid-template-columns: minmax(0, 1fr);
  }

  .network-card { overflow: hidden; }

  .phase-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border: 1px solid rgba(125,137,176,.2);
    border-radius: 999px;
    color: #a3afd0;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .phase-pill::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .phase-pill[data-phase="forward"] {
    color: var(--cyan);
  }

  .phase-pill[data-phase="backward"] {
    color: var(--amber);
  }

  .network-wrap {
    width: 100%;
    overflow: hidden;
    border-radius: 15px;
    background:
      radial-gradient(ellipse at center,
        rgba(90,215,232,.035), transparent 75%),
      #0b1227;
    border: 1px solid rgba(125,137,176,.12);
  }

  .network {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    user-select: none;
  }

  .network text {
    font-family: inherit;
    pointer-events: none;
  }

  .edge {
    outline: none;
  }

  .edge .weight-line {
    transition: stroke-width .13s, stroke .13s, opacity .13s;
  }

  .edge .weight-halo {
    opacity: 0;
    transition: opacity .15s;
  }

  .edge.selected .weight-halo,
  .edge:focus-visible .weight-halo {
    opacity: .34;
  }

  .edge .weight-hit {
    pointer-events: stroke;
    cursor: ns-resize;
    touch-action: none;
  }

  .edge[aria-disabled="true"] .weight-hit {
    cursor: default;
  }

  .node {
    pointer-events: none;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px 15px;
    margin-top: 12px;
    color: #a3afd0;
    font-size: 11px;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .legend-line {
    display: inline-block;
    width: 18px;
    height: 3px;
    border-radius: 3px;
    background: currentColor;
  }

  .legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 7px currentColor;
  }

  .legend-diamond {
    display: inline-block;
    width: 7px;
    height: 7px;
    background: currentColor;
    transform: rotate(45deg);
  }

  .weight-definition {
    margin-top: 12px;
    padding: 10px 12px;
    border-left: 2px solid rgba(167,139,250,.7);
    border-radius: 0 9px 9px 0;
    background: rgba(167,139,250,.055);
    color: #b9c4e1;
    font-size: 12px;
  }

  .weight-definition strong {
    color: var(--violet);
  }

  .weight-editor {
    margin-top: 13px;
    padding: 13px;
    border: 1px solid rgba(125,137,176,.17);
    border-radius: 12px;
    background: #111a32;
  }

  .weight-editor-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
    margin-bottom: 7px;
  }

  .weight-readout {
    font-size: 17px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }

  .weight-select {
    width: 100%;
    min-height: 42px;
    padding: 9px 10px;
    border: 1px solid rgba(125,137,176,.3);
    border-radius: 8px;
    background: #19233f;
    color: var(--ink);
    font-size: 12px;
    text-overflow: ellipsis;
  }

  .weight-range-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 7px;
  }

  .weight-range-row input {
    flex: 1;
    min-width: 0;
  }

  .weight-range-row .btn {
    min-height: 40px;
    min-width: 40px;
  }

  .weight-help {
    margin-top: 7px;
    color: #a3afd0;
    font-size: 12px;
  }

  .map-frame {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(125,137,176,.25);
    border-radius: 13px;
    background: #0b1020;
  }

  .map {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    cursor: crosshair;
    touch-action: manipulation;
  }

  .map-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    color: #a3afd0;
    font-size: 11px;
  }

  .map-selection {
    min-height: 57px;
    margin-top: 13px;
    padding: 10px 12px;
    border: 1px solid rgba(125,137,176,.15);
    border-radius: 10px;
    background: #111a32;
    color: #b9c4e1;
    font-size: 12px;
  }

  .selection-title {
    display: block;
    margin-bottom: 3px;
    color: var(--ink);
    font-size: 13px;
    font-weight: 700;
  }

  .prediction {
    margin-top: 4px;
    font-weight: 650;
  }

  .lower-grid {
    display: grid;
    grid-template-columns: minmax(0,1.2fr) minmax(0,1fr);
    gap: 16px;
    margin-top: 16px;
    align-items: start;
  }

  .lower-grid.single {
    grid-template-columns: minmax(0,1fr);
  }

  .curve {
    display: block;
    width: 100%;
    height: 164px;
  }

  .chart-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    color: #a3afd0;
    font-size: 11px;
  }

  .explanation {
    position: relative;
    min-height: 100%;
    background:
      radial-gradient(ellipse at 0% 0%,
        rgba(251,191,36,.05), transparent 70%),
      var(--card);
  }

  .explanation-text {
    min-height: 66px;
    margin-top: 10px;
    color: var(--ink);
    font-size: 16px;
    line-height: 1.6;
    letter-spacing: -.01em;
  }

  .step-comparison {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    padding: 12px;
    border-radius: 12px;
    background: #0b1227;
  }

  .comparison-value {
    margin-top: 3px;
    font-size: 24px;
    font-weight: 750;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
    letter-spacing: -.04em;
  }

  .comparison-arrow {
    color: var(--muted);
    font-size: 20px;
  }

  .change-note {
    min-height: 18px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 700;
  }

  .challenge-section {
    margin-top: 28px;
  }

  .challenge-intro {
    margin-top: 5px;
    margin-bottom: 14px;
    color: #a3afd0;
    font-size: 13px;
  }

  .challenges {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 11px;
  }

  .challenge {
    display: grid;
    grid-template-columns: 27px minmax(0,1fr);
    align-items: start;
    gap: 11px;
    min-width: 0;
    padding: 15px;
    border: 1px solid rgba(125,137,176,.18);
    border-radius: 14px;
    background: #10182e;
    transition: border-color .25s, background .25s;
  }

  .challenge[data-done="true"] {
    border-color: rgba(134,239,172,.30);
    background:
      linear-gradient(135deg, rgba(134,239,172,.045), transparent),
      #10182e;
  }

  .challenge-icon {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border: 1px solid rgba(167,139,250,.4);
    border-radius: 9px;
    background: rgba(167,139,250,.08);
    color: var(--violet);
    font-size: 15px;
  }

  .challenge[data-done="true"] .challenge-icon {
    color: var(--green);
    background: rgba(134,239,172,.08);
    border-color: rgba(134,239,172,.35);
  }

  .challenge-title {
    font-size: 13px;
    font-weight: 720;
    line-height: 1.5;
  }

  .challenge-feedback {
    margin-top: 6px;
    color: #a3afd0;
    font-size: 12px;
    line-height: 1.5;
  }

  .challenge[data-done="true"] .challenge-feedback {
    color: var(--green);
  }

  .footer-note {
    margin-top: 20px;
    color: #a3afd0;
    font-size: 12px;
    text-align: center;
  }

  @container (max-width: 850px) {
    .control-grid {
      grid-template-columns: minmax(0,1fr) minmax(0,1fr);
    }

    .control-group.shapes {
      grid-column: 1 / -1;
    }

    .shape-grid {
      grid-template-columns: repeat(4,minmax(0,1fr));
    }

    .visuals, .lower-grid {
      grid-template-columns: minmax(0,1fr);
    }

    .map-frame {
      max-width: 540px;
      margin-inline: auto;
    }
  }

  @container (max-width: 520px) {
    .control-grid {
      grid-template-columns: minmax(0,1fr);
    }

    .shape-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .control-group.shapes {
      grid-column: auto;
    }

    .metrics {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .challenges {
      grid-template-columns: minmax(0,1fr);
    }

    .action-row .btn {
      flex: 1 1 40%;
    }

    .section-head {
      gap: 6px;
    }

    .phase-pill {
      font-size: 10px;
      padding: 4px 7px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;

/* ============================================================
   SMALL ICONS
   ============================================================ */

function icon(name) {
  const paths = {
    step: '<path d="M6 4l10 8-10 8z"/><path d="M19 5v14"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    reset: '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 5v7h7"/>',
    points: '<circle cx="6" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="10" cy="18" r="2"/><path d="M17 15v6m-3-3h6"/>'
  };

  return `
    <svg class="btn-icon" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">${paths[name] || ""}</svg>
  `;
}

function shapeIcon(shape) {
  const dots = [];
  const add = (x, y, cyan) => {
    dots.push(
      `<circle cx="${x}" cy="${y}" r="1.65"
        fill="${cyan ? NN_COLORS.cyan : NN_COLORS.pink}"/>`
    );
  };

  if (shape === "groups") {
    [[7, 9], [11, 13], [6, 17], [10, 21]].forEach(
      ([x, y]) => add(x, y, false)
    );
    [[21, 7], [24, 12], [19, 16], [24, 19]].forEach(
      ([x, y]) => add(x, y, true)
    );
  }

  if (shape === "circle") {
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI * 2 / 9;
      add(15 + Math.cos(a) * 11, 15 + Math.sin(a) * 11, false);
    }

    [[12, 13], [18, 13], [15, 18], [15, 10]].forEach(
      ([x, y]) => add(x, y, true)
    );
  }

  if (shape === "xor") {
    for (const x of [7, 23]) {
      for (const y of [7, 23]) {
        const cyan = x === y;
        add(x - 2, y, cyan);
        add(x + 2, y - 2, cyan);
        add(x + 1, y + 3, cyan);
      }
    }
  }

  if (shape === "spiral") {
    for (let label = 0; label < 2; label++) {
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const a = t * Math.PI * 2.3 + label * Math.PI;
        const r = 2 + 10.5 * t;

        add(
          15 + Math.cos(a) * r,
          15 + Math.sin(a) * r,
          Boolean(label)
        );
      }
    }
  }

  return `<svg viewBox="0 0 30 30" aria-hidden="true">${dots.join("")}</svg>`;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export function nnPlayground(mount, options = {}) {
  if (typeof mount === "string") {
    mount = document.querySelector(mount);
  }

  if (!mount || typeof mount.appendChild !== "function") {
    throw new Error("nnPlayground: please provide a mount element.");
  }

  const host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });

  mount.appendChild(host);

  const showMap = options.showMap !== false;
  const showCurve = options.showCurve !== false;
  const lockLayers = Boolean(options.lockLayers);
  const challengeDefinitions = resolveChallenges(options.challenges);

  let layers = normalizeLayers(options.layers);
  let shape = normalizeShape(options.shape);
  let lr = clamp(numberOr(options.lr, 0.3), MIN_LR, MAX_LR);
  let speed = clamp(Math.round(numberOr(options.speed, 6)), 1, 10);

  let points = makePoints(shape);
  let network = createNetwork(layers);
  let measurement = measureNetwork(network, points);

  let step = 0;
  let running = false;
  let destroyed = false;

  let animation = null;
  let frameId = 0;
  let resizeFrame = 0;

  let selectedPoint = points[0];
  let pinnedPoint = false;

  let manualEdits = 0;
  let xorSteps = 0;
  let highSteps = 0;
  let highJump = false;

  let lastBefore = null;
  let lastAfter = null;

  let history = [{ step: 0, error: measurement.error }];
  let historyStride = 1;

  let selectedWeight = 0;
  let drag = null;

  let edgeElements = [];
  let nodeElements = [];
  let networkWidth = 0;
  let challengeElements = [];

  let heatDirty = true;
  let currentPhase = "";

  const completedChallenges = new Set();

  const motionPreference = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  const heatCanvas = document.createElement("canvas");
  heatCanvas.width = GRID_SIZE;
  heatCanvas.height = GRID_SIZE;

  const heatContext = heatCanvas.getContext("2d");

  root.innerHTML = `
    <style>${STYLES}</style>

    <main class="shell" aria-label="Neural network playground">

      <header class="hero">
        <p class="eyebrow">
          <span class="live-dot"></span>
          Interactive lesson
        </p>
        <h1>Neural network playground</h1>
        <p>
          Give the network some points. Watch the numbers move.
          Help it learn which colour belongs where.
        </p>
      </header>

      <section class="card controls" aria-label="Learning controls">

        <div class="action-row">
          <button class="btn primary" id="one-step" type="button">
            ${icon("step")}
            One learning step
          </button>

          <button class="btn play" id="play" type="button"
            aria-pressed="false">
            ${icon("play")} Learn
          </button>

          <button class="btn" id="restart" type="button">
            ${icon("reset")} Start again
          </button>

          <button class="btn" id="new-points" type="button">
            ${icon("points")} New points
          </button>
        </div>

        <div class="control-grid">

          <div class="control-group shapes">
            <h3>Choose a shape</h3>

            <div class="shape-grid" role="group"
              aria-label="Shape of the points">
              ${SHAPES.map(s => `
                <button type="button" class="shape-btn"
                  data-shape="${s.id}" aria-pressed="false">
                  ${shapeIcon(s.icon)}
                  <span>${s.name}</span>
                </button>
              `).join("")}
            </div>

            <p class="shape-hint" id="shape-hint"></p>
          </div>

          <div class="control-group">
            <h3>Build the network</h3>

            <div class="small">Hidden layers</div>

            <div class="layer-choice" role="group"
              aria-label="Number of hidden layers">

              <button type="button" class="btn"
                data-layer-count="1" aria-pressed="true">
                1 layer
              </button>

              <button type="button" class="btn"
                data-layer-count="2" aria-pressed="false">
                2 layers
              </button>
            </div>

            <div id="layer-sizes"></div>

            <p class="small" id="layer-note"
              style="margin-top:8px"></p>
          </div>

          <div class="control-group">

            <div class="range-group">
              <label class="range-label" for="speed">
                Speed
                <span class="range-value" id="speed-value"></span>
              </label>

              <input type="range" id="speed"
                min="1" max="10" step="1" value="6">

              <div class="range-ends">
                <span>Slow</span><span>Fast</span>
              </div>
            </div>

            <div class="range-group">
              <label class="range-label" for="learning-rate">
                Learning speed
                <span class="range-value" id="rate-value"></span>
              </label>

              <input type="range" id="learning-rate"
                min="0" max="100" step="0.1">

              <div class="range-ends">
                <span>Small changes</span><span>Big changes</span>
              </div>

              <p class="rate-hint" id="rate-hint"></p>
            </div>

          </div>
        </div>
      </section>

      <section class="metrics" aria-label="Learning numbers">
        <div class="metric">
          <div class="metric-label">Learning step</div>
          <div class="metric-value" id="step-count">0</div>
        </div>

        <div class="metric">
          <div class="metric-label">Error · lower is better</div>
          <div class="metric-value amber" id="error-value">—</div>
        </div>

        <div class="metric">
          <div class="metric-label">Correct points</div>
          <div class="metric-value green" id="correct-count">—</div>
        </div>

        <div class="metric">
          <div class="metric-label">Wrong points</div>
          <div class="metric-value pink" id="wrong-count">—</div>
        </div>
      </section>

      <div class="visuals ${showMap ? "" : "single"}">

        <section class="card network-card">
          <div class="section-head">
            <div>
              <h2><span class="section-number">1</span>The network</h2>
              <p>Each circle passes a number to the next circles.</p>
            </div>

            <span class="phase-pill" id="phase" data-phase="idle">
              Ready
            </span>
          </div>

          <div class="network-wrap" id="network-wrap">
            <svg class="network" id="network"
              viewBox="0 0 600 320"
              role="group"
              aria-label="Neural network with editable weights">
            </svg>
          </div>

          <div class="legend">
            <span class="legend-item">
              <span class="legend-line cyan"></span>
              Positive weight
            </span>

            <span class="legend-item">
              <span class="legend-line pink"></span>
              Negative weight
            </span>

            <span class="legend-item">
              <span class="legend-dot cyan"></span>
              Numbers moving
            </span>

            <span class="legend-item">
              <span class="legend-dot amber"></span>
              Error going back
            </span>
          </div>

          <p class="weight-definition">
            A <strong>weight</strong> is how strongly one circle pushes
            the next one. A thick line means a strong weight.
            Positive and negative weights push in opposite directions.
          </p>

          <div class="weight-editor">
            <div class="weight-editor-head">
              <h3>Change a weight yourself</h3>
              <span class="weight-readout" id="weight-value">0.00</span>
            </div>

            <select class="weight-select" id="weight-select"
              aria-label="Choose a weight"></select>

            <div class="weight-range-row">
              <button type="button" class="btn square-btn"
                id="weight-minus" aria-label="Decrease weight">−</button>

              <input type="range" id="weight-range"
                min="-8" max="8" step="0.01"
                aria-label="Change selected weight">

              <button type="button" class="btn square-btn"
                id="weight-plus" aria-label="Increase weight">+</button>
            </div>

            <p class="weight-help" id="weight-help">
              Tap a line, then move the slider. Or drag a line up or down.
            </p>
          </div>
        </section>

        <section class="card" ${showMap ? "" : "hidden"}>
          <div class="section-head">
            <div>
              <h2><span class="section-number">2</span>The map</h2>
              <p>Tap a point to pause and send its numbers through.</p>
            </div>
          </div>

          <div class="map-frame">
            <canvas class="map" id="map" tabindex="0"
              aria-label="Map of points. Use the arrow keys to inspect points.">
              A map showing the network's answers for two inputs.
            </canvas>
          </div>

          <div class="map-axis">
            <span>−1</span>
            <span>Input 1 →</span>
            <span>+1</span>
          </div>

          <p class="small" style="margin-top:4px">
            Input 2 goes from −1 at the bottom to +1 at the top.
          </p>

          <div class="legend">
            <span class="legend-item">
              <span class="legend-dot cyan"></span> Cyan points
            </span>
            <span class="legend-item">
              <span class="legend-diamond pink"></span> Pink points
            </span>
          </div>

          <p class="small" style="margin-top:10px">
            The background shows the network's answer.
            Dark areas mean it is not sure.
          </p>

          <div class="map-selection">
            <span class="selection-title" id="selection-title"></span>
            <div id="selection-inputs"></div>
            <div class="prediction" id="selection-prediction"></div>
          </div>
        </section>
      </div>

      <div class="lower-grid ${showCurve ? "" : "single"}">

        <section class="card" ${showCurve ? "" : "hidden"}>
          <div class="section-head">
            <div>
              <h2><span class="section-number">3</span>The error curve</h2>
              <p>Watch the error as the network learns.</p>
            </div>
          </div>

          <canvas class="curve" id="curve"
            role="img" aria-label="Error against learning step">
            A chart of error at each learning step.
          </canvas>

          <div class="chart-footer">
            <span>Error: 0 is best</span>
            <span>Learning step →</span>
          </div>

          <p class="small" style="margin-top:10px">
            A falling line is good. A jump means the network got worse.
          </p>
        </section>

        <section class="card explanation">
          <div class="section-head">
            <div>
              <h2>What just happened?</h2>
              <p>Learning, in simple words.</p>
            </div>
          </div>

          <p class="explanation-text" id="explanation"
            aria-live="polite"></p>

          <div class="step-comparison">
            <div>
              <div class="metric-label">Error before</div>
              <div class="comparison-value amber"
                id="error-before">—</div>
            </div>

            <span class="comparison-arrow" aria-hidden="true">→</span>

            <div>
              <div class="metric-label">Error after</div>
              <div class="comparison-value"
                id="error-after">—</div>
            </div>
          </div>

          <p class="change-note muted" id="change-note">
            Take one learning step to see the change.
          </p>
        </section>
      </div>

      <section class="challenge-section"
        ${challengeDefinitions.length ? "" : "hidden"}>
        <h2>Try it yourself</h2>

        <p class="challenge-intro">
          Small experiments. No marks, no timer.
          Explore and see what happens.
        </p>

        <div class="challenges" id="challenges"></div>
      </section>

      <p class="footer-note">
        The moving dots show one point.
        Every learning step uses all the points.
        Each receiving circle also has a small starting number that it learns.
      </p>

    </main>
  `;

  const $ = id => root.getElementById(id);

  const ui = {
    oneStep: $("one-step"),
    play: $("play"),
    restart: $("restart"),
    newPoints: $("new-points"),

    speed: $("speed"),
    speedValue: $("speed-value"),
    rate: $("learning-rate"),
    rateValue: $("rate-value"),
    rateHint: $("rate-hint"),

    shapeHint: $("shape-hint"),
    layerSizes: $("layer-sizes"),
    layerNote: $("layer-note"),

    step: $("step-count"),
    error: $("error-value"),
    correct: $("correct-count"),
    wrong: $("wrong-count"),

    network: $("network"),
    networkWrap: $("network-wrap"),
    phase: $("phase"),

    weightSelect: $("weight-select"),
    weightValue: $("weight-value"),
    weightRange: $("weight-range"),
    weightMinus: $("weight-minus"),
    weightPlus: $("weight-plus"),
    weightHelp: $("weight-help"),

    map: $("map"),
    selectionTitle: $("selection-title"),
    selectionInputs: $("selection-inputs"),
    selectionPrediction: $("selection-prediction"),

    curve: $("curve"),

    explanation: $("explanation"),
    before: $("error-before"),
    after: $("error-after"),
    changeNote: $("change-note"),

    challenges: $("challenges")
  };

  /* ----------------------------------------------------------
     State and small UI updates
     ---------------------------------------------------------- */

  function getState() {
    return {
      layers: [...layers],
      shape,
      lr,
      speed,
      step,
      running,
      error: measurement.error,
      wrong: measurement.wrong,
      accuracy: measurement.accuracy,
      pointCount: points.length,
      manualEdits,
      xorSteps,
      highSteps,
      highJump,
      errorBefore: lastBefore,
      errorAfter: lastAfter,

      weights: network.weights.map(layer =>
        layer.map(row => [...row])
      ),

      biases: network.biases.map(layer => [...layer])
    };
  }

  function explain(text) {
    if (ui.explanation.textContent !== text) {
      ui.explanation.textContent = text;
    }
  }

  function setPhase(phase, text) {
    if (currentPhase === phase && ui.phase.textContent === text) {
      return;
    }

    currentPhase = phase;
    ui.phase.dataset.phase = phase;
    ui.phase.textContent = text;
  }

  function isLearning() {
    return running || animation?.kind === "step";
  }

  function rateToSlider(rate) {
    return (
      100 * Math.log(rate / MIN_LR) /
      Math.log(MAX_LR / MIN_LR)
    );
  }

  function sliderToRate(value) {
    return MIN_LR * Math.pow(MAX_LR / MIN_LR, value / 100);
  }

  function syncMetrics() {
    ui.step.textContent = step.toLocaleString();
    ui.error.textContent = formatError(measurement.error);

    ui.correct.textContent =
      `${points.length - measurement.wrong}/${points.length}`;

    ui.wrong.textContent = measurement.wrong;

    ui.curve.setAttribute(
      "aria-label",
      `Error curve. Learning step ${step}. Error ${formatError(measurement.error)}.`
    );
  }

  function syncComparison() {
    ui.before.textContent =
      lastBefore === null ? "—" : formatError(lastBefore);

    ui.after.textContent =
      lastAfter === null ? "—" : formatError(lastAfter);

    ui.after.className = "comparison-value";
    ui.changeNote.className = "change-note muted";

    if (lastBefore === null || lastAfter === null) {
      ui.changeNote.textContent =
        "Take one learning step to see the change.";
      return;
    }

    const change = lastAfter - lastBefore;

    if (change < -0.000001) {
      ui.after.classList.add("green");
      ui.changeNote.className = "change-note green";

      ui.changeNote.textContent =
        `↓ Error went down by ${Math.abs(change).toFixed(4)}.`;

    } else if (change > 0.000001) {
      ui.after.classList.add("pink");
      ui.changeNote.className = "change-note pink";

      ui.changeNote.textContent =
        `↑ Error went up by ${change.toFixed(4)}.`;

    } else {
      ui.after.classList.add("amber");
      ui.changeNote.textContent = "The error stayed almost the same.";
    }
  }

  function syncRate() {
    ui.rate.value = rateToSlider(lr);
    ui.rateValue.textContent = formatRate(lr);
    ui.rate.setAttribute("aria-valuetext", formatRate(lr));

    ui.rateHint.classList.toggle("warning", lr >= 5);

    if (lr >= 5) {
      ui.rateHint.textContent =
        "Very big changes can make the error jump.";
    } else if (lr < 0.08) {
      ui.rateHint.textContent =
        "Small changes are gentle, but learning may be slow.";
    } else {
      ui.rateHint.textContent =
        "How much each weight changes in one step.";
    }
  }

  function syncControls() {
    ui.oneStep.disabled = isLearning();

    ui.play.setAttribute("aria-pressed", String(running));

    const playMode = running ? "pause" : "play";

    if (ui.play.dataset.mode !== playMode) {
      ui.play.dataset.mode = playMode;
      ui.play.innerHTML = running
        ? `${icon("pause")} Pause`
        : `${icon("play")} Learn`;
    }

    ui.explanation.setAttribute(
      "aria-live",
      running ? "off" : "polite"
    );

    ui.speed.value = speed;
    ui.speedValue.textContent = `${speed}/10`;

    root.querySelectorAll("[data-shape]").forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.shape === shape)
      );
    });

    root.querySelectorAll("[data-layer-count]").forEach(button => {
      const count = Number(button.dataset.layerCount);

      button.disabled = lockLayers;
      button.setAttribute(
        "aria-pressed",
        String(count === layers.length - 2)
      );
    });

    ui.shapeHint.textContent =
      SHAPES.find(s => s.id === shape)?.hint || "";

    ui.layerNote.textContent = lockLayers
      ? "The circles are fixed for this lesson."
      : "Changing the circles starts a new network.";

    syncWeightEditor();
  }

  function buildLayerControls() {
    ui.layerSizes.replaceChildren();

    layers.slice(1, -1).forEach((count, index) => {
      const row = document.createElement("div");
      row.className = "layer-size";

      const label = document.createElement("label");
      label.textContent = `Layer ${index + 1} circles`;

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "btn square-btn";
      minus.textContent = "−";
      minus.disabled = lockLayers || count <= 1;

      minus.setAttribute(
        "aria-label",
        `Remove a circle from hidden layer ${index + 1}`
      );

      const value = document.createElement("span");
      value.className = "layer-number";
      value.textContent = count;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "btn square-btn";
      plus.textContent = "+";
      plus.disabled = lockLayers || count >= 8;

      plus.setAttribute(
        "aria-label",
        `Add a circle to hidden layer ${index + 1}`
      );

      minus.addEventListener("click", () => changeLayerSize(index, -1));
      plus.addEventListener("click", () => changeLayerSize(index, 1));

      row.append(label, minus, value, plus);
      ui.layerSizes.appendChild(row);
    });
  }

  /* ----------------------------------------------------------
     Challenges
     ---------------------------------------------------------- */

  function buildChallenges() {
    ui.challenges.replaceChildren();
    challengeElements = [];

    challengeDefinitions.forEach((definition, index) => {
      const card = document.createElement("article");
      card.className = "challenge";
      card.dataset.done = "false";

      const marker = document.createElement("span");
      marker.className = "challenge-icon";
      marker.textContent = "○";
      marker.setAttribute("aria-hidden", "true");

      const body = document.createElement("div");

      const title = document.createElement("h3");
      title.className = "challenge-title";
      title.textContent = definition.title;

      const feedback = document.createElement("p");
      feedback.className = "challenge-feedback";

      body.append(title, feedback);
      card.append(marker, body);

      ui.challenges.appendChild(card);

      challengeElements.push({
        key: `${definition.id}:${index}`,
        definition,
        card,
        marker,
        feedback
      });
    });
  }

  function updateChallenges() {
    const state = getState();

    for (const item of challengeElements) {
      const { definition, card, marker, feedback, key } = item;

      let done = completedChallenges.has(key);

      if (!done && typeof definition.check === "function") {
        try {
          done = Boolean(definition.check(state));

          if (done) {
            completedChallenges.add(key);
          }
        } catch {
          done = false;
        }
      }

      card.dataset.done = String(done);
      marker.textContent = done ? "✓" : "○";

      card.setAttribute(
        "aria-label",
        `${done ? "Completed. " : ""}${definition.title}`
      );

      let text = "Try it and see what happens.";

      try {
        if (typeof definition.feedback === "function") {
          text = definition.feedback(state, done);
        } else if (typeof definition.feedback === "string") {
          text = definition.feedback;
        } else if (done) {
          text = "You did it!";
        }
      } catch {
        text = done ? "You did it!" : "Keep exploring.";
      }

      text = String(text ?? "");

      if (feedback.textContent !== text) {
        feedback.textContent = text;
      }
    }
  }

  /* ----------------------------------------------------------
     Draw the network
     ---------------------------------------------------------- */

  function layerName(index) {
    if (index === 0) return "Input";
    if (index === layers.length - 1) return "Output";
    return `Hidden ${index}`;
  }

  function nodeName(layer, index) {
    if (layer === 0) return `Input ${index + 1}`;
    if (layer === layers.length - 1) return "Output";
    return `Hidden ${layer}, circle ${index + 1}`;
  }

  function nodeColor(layer) {
    if (layer === 0) return NN_COLORS.violet;
    if (layer === layers.length - 1) return NN_COLORS.amber;
    return NN_COLORS.cyan;
  }

  function buildNetwork() {
    drag = null;

    const width = Math.max(
      280,
      Math.round(ui.networkWrap.clientWidth || 600)
    );

    const largestLayer = Math.max(...layers);
    const height = Math.max(275, 78 + largestLayer * 44);

    const radius = width < 360 ? 17 : 20;
    const xPadding = width < 360 ? 29 : 37;
    const yTop = 65;
    const yBottom = height - 39;

    networkWidth = width;

    ui.network.replaceChildren();
    ui.network.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const defs = svgElement("defs");

    const glow = svgElement("filter", {
      id: "nn-node-glow",
      x: "-100%",
      y: "-100%",
      width: "300%",
      height: "300%"
    });

    glow.appendChild(svgElement("feGaussianBlur", {
      stdDeviation: 5
    }));

    const dotGlow = svgElement("filter", {
      id: "nn-dot-glow",
      x: "-150%",
      y: "-150%",
      width: "400%",
      height: "400%"
    });

    dotGlow.appendChild(svgElement("feGaussianBlur", {
      stdDeviation: 2.8
    }));

    defs.append(glow, dotGlow);
    ui.network.appendChild(defs);

    const positions = layers.map((count, l) => {
      const x =
        xPadding +
        (width - xPadding * 2) * l / (layers.length - 1);

      return Array.from({ length: count }, (_, i) => {
        const y = count === 1
          ? (yTop + yBottom) / 2
          : yTop + (yBottom - yTop) * i / (count - 1);

        return { x, y };
      });
    });

    const guideGroup = svgElement("g", {
      "pointer-events": "none"
    });

    const edgeGroup = svgElement("g");
    const nodeGroup = svgElement("g");
    const dotGroup = svgElement("g", {
      "pointer-events": "none"
    });

    const labelGroup = svgElement("g", {
      "pointer-events": "none"
    });

    ui.network.append(
      guideGroup,
      edgeGroup,
      nodeGroup,
      dotGroup,
      labelGroup
    );

    // Very quiet guides behind the circles.
    for (let l = 0; l < positions.length; l++) {
      const x = positions[l][0].x;

      guideGroup.appendChild(svgElement("line", {
        x1: x,
        y1: 46,
        x2: x,
        y2: height - 23,
        stroke: NN_COLORS.muted,
        "stroke-width": 1,
        "stroke-dasharray": "2 7",
        opacity: 0.15
      }));

      const label = svgElement("text", {
        x,
        y: 23,
        fill: nodeColor(l),
        "font-size": width < 360 ? 10 : 12,
        "font-weight": 750,
        "text-anchor": "middle"
      });

      label.textContent = layerName(l);
      labelGroup.appendChild(label);
    }

    edgeElements = [];
    nodeElements = [];

    // Draw the weights behind the circles.
    for (let l = 0; l < layers.length - 1; l++) {
      for (let j = 0; j < layers[l + 1]; j++) {
        for (let i = 0; i < layers[l]; i++) {
          const from = positions[l][i];
          const to = positions[l + 1][j];

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.hypot(dx, dy) || 1;

          const ux = dx / length;
          const uy = dy / length;

          const start = {
            x: from.x + ux * (radius + 2),
            y: from.y + uy * (radius + 2)
          };

          const end = {
            x: to.x - ux * (radius + 2),
            y: to.y - uy * (radius + 2)
          };

          const attrs = {
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            "stroke-linecap": "round"
          };

          const group = svgElement("g", {
            class: "edge",
            role: "slider",
            tabindex: "-1",
            "aria-orientation": "horizontal",
            "aria-label":
              `${nodeName(l, i)} to ${nodeName(l + 1, j)}`
          });

          const halo = svgElement("line", {
            ...attrs,
            class: "weight-halo",
            stroke: NN_COLORS.ink,
            "stroke-width": 10,
            "pointer-events": "none"
          });

          const line = svgElement("line", {
            ...attrs,
            class: "weight-line",
            "pointer-events": "none"
          });

          const hit = svgElement("line", {
            ...attrs,
            class: "weight-hit",
            stroke: "transparent",
            "stroke-width": 16
          });

          const title = svgElement("title");

          group.append(halo, line, hit, title);
          edgeGroup.appendChild(group);

          const dotHalo = svgElement("circle", {
            r: 5,
            opacity: 0,
            filter: "url(#nn-dot-glow)"
          });

          const dot = svgElement("circle", {
            r: 2.8,
            opacity: 0
          });

          dotGroup.append(dotHalo, dot);

          const index = edgeElements.length;

          const edge = {
            l, i, j,
            start, end,
            group, halo, line, hit, title,
            dot, dotHalo
          };

          edgeElements.push(edge);

          hit.addEventListener("pointerdown", event => {
            if (isLearning()) return;
            if (event.button !== 0) return;

            event.preventDefault();

            selectWeight(index);

            drag = {
              index,
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              initial: weightAt(edge),
              limit: Math.max(8, Math.ceil(Math.abs(weightAt(edge)) + 2)),
              moved: false
            };

            try {
              hit.setPointerCapture(event.pointerId);
            } catch {
              // The slider remains available if capture is unsupported.
            }
          });

          hit.addEventListener("pointermove", event => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            if (isLearning()) return;

            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;

            if (!drag.moved && Math.hypot(dx, dy) < 3) return;

            drag.moved = true;

            const next =
              drag.initial + (dx - dy) * 0.025;

            setWeight(
              drag.index,
              clamp(next, -drag.limit, drag.limit)
            );
          });

          const endDrag = event => {
            if (!drag || drag.pointerId !== event.pointerId) return;

            if (!drag.moved) {
              explain("You chose a line. Move its weight slider to change it.");
            }

            drag = null;
          };

          hit.addEventListener("pointerup", endDrag);
          hit.addEventListener("pointercancel", () => { drag = null; });
          hit.addEventListener("lostpointercapture", () => { drag = null; });

          group.addEventListener("focus", () => {
            if (!isLearning()) selectWeight(index);
          });

          group.addEventListener("keydown", event => {
            if (isLearning()) return;

            const increment = event.shiftKey ? 1 : 0.1;
            let change = 0;

            if (event.key === "ArrowUp" || event.key === "ArrowRight") {
              change = increment;
            }

            if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
              change = -increment;
            }

            if (change) {
              event.preventDefault();
              selectWeight(index);
              adjustWeight(change);
            }
          });
        }
      }
    }

    // Draw the circles.
    for (let l = 0; l < layers.length; l++) {
      const color = nodeColor(l);
      nodeElements[l] = [];

      for (let i = 0; i < layers[l]; i++) {
        const { x, y } = positions[l][i];

        const group = svgElement("g", { class: "node" });

        const outerGlow = svgElement("circle", {
          cx: x,
          cy: y,
          r: radius + 2,
          fill: color,
          opacity: 0.10,
          filter: "url(#nn-node-glow)"
        });

        const circle = svgElement("circle", {
          cx: x,
          cy: y,
          r: radius,
          fill: "#101a31",
          stroke: color,
          "stroke-width": 1.7
        });

        const ring = svgElement("circle", {
          cx: x,
          cy: y,
          r: radius - 4,
          fill: "none",
          stroke: color,
          "stroke-width": 1,
          opacity: 0.14
        });

        const value = svgElement("text", {
          x,
          y: y + 0.5,
          fill: NN_COLORS.ink,
          "font-size": width < 360 ? 11 : 13,
          "font-weight": 750,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-variant-numeric": "tabular-nums"
        });

        value.textContent = "0.00";

        group.append(outerGlow, circle, ring, value);

        if (l === 0) {
          const inputLabel = svgElement("text", {
            x,
            y: y + radius + 13,
            fill: NN_COLORS.violet,
            "font-size": 10,
            "text-anchor": "middle"
          });

          inputLabel.textContent = `Input ${i + 1}`;
          group.appendChild(inputLabel);
        }

        if (l === layers.length - 1) {
          const outputLabel = svgElement("text", {
            x,
            y: y + radius + 14,
            fill: NN_COLORS.amber,
            "font-size": 10,
            "text-anchor": "middle"
          });

          outputLabel.textContent = "0 — 1";
          group.appendChild(outputLabel);
        }

        nodeGroup.appendChild(group);

        nodeElements[l].push({
          group,
          circle,
          value,
          outerGlow,
          color
        });
      }
    }

    selectedWeight = clamp(
      selectedWeight,
      0,
      Math.max(0, edgeElements.length - 1)
    );

    buildWeightSelect();
    syncEdges();

    if (selectedPoint) {
      showActivations(
        forward(network, selectedPoint.x, selectedPoint.y).activations
      );
    }

    if (animation) {
      renderAnimation(performance.now());
    }
  }

  function weightAt(edge) {
    return network.weights[edge.l][edge.j][edge.i];
  }

  function weightColor(weight) {
    if (Math.abs(weight) < 0.00001) return NN_COLORS.muted;
    return weight > 0 ? NN_COLORS.cyan : NN_COLORS.pink;
  }

  function weightThickness(weight) {
    // Large weights stay visible without covering the whole network.
    return 0.85 + 6.1 * Math.tanh(Math.abs(weight) / 2.4);
  }

  function syncEdges() {
    edgeElements.forEach((edge, index) => {
      const weight = weightAt(edge);
      const thickness = weightThickness(weight);
      const limit = Math.max(8, Math.ceil(Math.abs(weight) + 1));

      setAttrs(edge.line, {
        stroke: weightColor(weight),
        "stroke-width": thickness,
        opacity: 0.40 + 0.52 * Math.tanh(Math.abs(weight))
      });

      edge.halo.setAttribute("stroke-width", thickness + 5);

      edge.group.classList.toggle(
        "selected",
        index === selectedWeight
      );

      edge.group.setAttribute(
        "tabindex",
        !isLearning() && index === selectedWeight ? "0" : "-1"
      );

      setAttrs(edge.group, {
        "aria-valuemin": -limit,
        "aria-valuemax": limit,
        "aria-valuenow": weight.toFixed(2),
        "aria-valuetext": formatValue(weight),
        "aria-disabled": String(isLearning())
      });

      edge.title.textContent =
        `${nodeName(edge.l, edge.i)} → ` +
        `${nodeName(edge.l + 1, edge.j)}: ${formatValue(weight)}`;
    });
  }

  function showLayerValues(layer, values) {
    if (!nodeElements[layer]) return;

    nodeElements[layer].forEach((node, i) => {
      const value = values[i];
      const text = formatValue(value);

      if (node.value.textContent !== text) {
        node.value.textContent = text;
      }

      const strength = layer === layers.length - 1
        ? Math.abs(value - 0.5) * 2
        : Math.abs(value);

      node.outerGlow.setAttribute(
        "opacity",
        0.07 + clamp(strength, 0, 1) * 0.25
      );

      node.circle.setAttribute(
        "stroke-width",
        1.5 + clamp(strength, 0, 1) * 0.9
      );
    });
  }

  function showActivations(activations) {
    activations.forEach((values, l) => showLayerValues(l, values));
  }

  /* ----------------------------------------------------------
     Editing weights by hand
     ---------------------------------------------------------- */

  function buildWeightSelect() {
    ui.weightSelect.replaceChildren();

    const groups = [];

    for (let l = 0; l < layers.length - 1; l++) {
      const group = document.createElement("optgroup");

      group.label = `${layerName(l)} → ${layerName(l + 1)}`;
      groups.push(group);

      ui.weightSelect.appendChild(group);
    }

    edgeElements.forEach((edge, index) => {
      const option = document.createElement("option");

      option.value = index;

      option.textContent =
        `${nodeName(edge.l, edge.i)} → ` +
        `${nodeName(edge.l + 1, edge.j)}`;

      groups[edge.l].appendChild(option);
    });

    ui.weightSelect.value = String(selectedWeight);
    syncWeightEditor();
  }

  function selectWeight(index) {
    if (!edgeElements[index]) return;

    selectedWeight = index;
    syncEdges();
    syncWeightEditor();
  }

  function syncWeightEditor() {
    const edge = edgeElements[selectedWeight];
    const disabled = isLearning() || !edge;

    ui.weightSelect.disabled = disabled;
    ui.weightRange.disabled = disabled;
    ui.weightMinus.disabled = disabled;
    ui.weightPlus.disabled = disabled;

    ui.weightHelp.textContent = disabled
      ? "Pause learning to change a weight by hand."
      : "Tap a line, then move the slider. Or drag a line up or down.";

    if (!edge) return;

    const weight = weightAt(edge);
    const limit = Math.max(8, Math.ceil(Math.abs(weight)));

    ui.weightSelect.value = String(selectedWeight);
    ui.weightValue.textContent = formatValue(weight);
    ui.weightValue.style.color = weightColor(weight);

    ui.weightRange.min = -limit;
    ui.weightRange.max = limit;
    ui.weightRange.value = weight;
    ui.weightRange.style.accentColor = weightColor(weight);

    ui.weightRange.setAttribute(
      "aria-valuetext",
      formatValue(weight)
    );

    edgeElements.forEach((item, index) => {
      item.group.setAttribute("aria-disabled", String(disabled));

      item.group.setAttribute(
        "tabindex",
        !disabled && index === selectedWeight ? "0" : "-1"
      );
    });
  }

  function adjustWeight(amount) {
    const edge = edgeElements[selectedWeight];
    if (!edge || isLearning()) return;

    const limit = Math.max(8, Math.ceil(Math.abs(weightAt(edge)) + 1));

    setWeight(
      selectedWeight,
      clamp(weightAt(edge) + amount, -limit, limit)
    );
  }

  function setWeight(index, value) {
    if (destroyed || isLearning()) return;
    if (!Number.isFinite(value)) return;

    const edge = edgeElements[index];
    if (!edge) return;

    if (animation?.kind === "inspect") {
      cancelMotion();
    }

    const previous = weightAt(edge);
    const next = Math.round(value * 100) / 100;

    if (Math.abs(previous - next) < 0.000001) {
      return;
    }

    network.weights[edge.l][edge.j][edge.i] = next;

    manualEdits++;
    selectedWeight = index;

    const oldError = measurement.error;

    refreshModel();

    setPhase("idle", "By hand");

    const difference = measurement.error - oldError;

    if (difference < -0.00001) {
      explain("You changed a weight, and the error became smaller.");
    } else if (difference > 0.00001) {
      explain("You changed a weight, and the error became bigger.");
    } else {
      explain("You changed a weight. Watch how the map changes.");
    }
  }

  /* ----------------------------------------------------------
     Canvas helpers
     ---------------------------------------------------------- */

  function prepareCanvas(canvas) {
    const bounds = canvas.getBoundingClientRect();

    if (bounds.width < 1 || bounds.height < 1) {
      return null;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = bounds.width;
    const height = bounds.height;

    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

    const context = canvas.getContext("2d");

    if (!context) return null;

    context.setTransform(
      pixelWidth / width, 0,
      0, pixelHeight / height,
      0, 0
    );

    return { context, width, height };
  }

  /* ----------------------------------------------------------
     The decision map
     ---------------------------------------------------------- */

  function paintHeat() {
    if (!heatContext || !heatDirty) return;

    const image = heatContext.createImageData(GRID_SIZE, GRID_SIZE);
    const pixels = image.data;

    const neutral = [17, 25, 47];
    const positive = [26, 100, 117];
    const negative = [117, 40, 84];

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const x = -1 + 2 * (gx + 0.5) / GRID_SIZE;
        const y = 1 - 2 * (gy + 0.5) / GRID_SIZE;

        const probability = predict(network, x, y);

        const confidence = Math.pow(
          Math.abs(probability - 0.5) * 2,
          0.78
        );

        const target = probability >= 0.5 ? positive : negative;

        const k = (gy * GRID_SIZE + gx) * 4;

        for (let c = 0; c < 3; c++) {
          pixels[k + c] = Math.round(
            neutral[c] + (target[c] - neutral[c]) * confidence
          );
        }

        pixels[k + 3] = 255;
      }
    }

    heatContext.putImageData(image, 0, 0);
    heatDirty = false;
  }

  function mapPosition(point, width, height) {
    return {
      x: (point.x + 1) * width / 2,
      y: (1 - point.y) * height / 2
    };
  }

  function drawPoint(context, x, y, radius, label) {
    context.beginPath();

    if (label === 1) {
      context.arc(x, y, radius, 0, Math.PI * 2);
    } else {
      // Different shapes make the colours easier to distinguish.
      context.moveTo(x, y - radius);
      context.lineTo(x + radius, y);
      context.lineTo(x, y + radius);
      context.lineTo(x - radius, y);
      context.closePath();
    }

    context.fillStyle = label === 1
      ? NN_COLORS.cyan
      : NN_COLORS.pink;

    context.fill();

    context.strokeStyle = "rgba(7,12,27,.85)";
    context.lineWidth = 1.25;
    context.stroke();
  }

  function paintMap() {
    if (!showMap || destroyed) return;

    const canvas = prepareCanvas(ui.map);
    if (!canvas) return;

    const { context: ctx, width, height } = canvas;

    paintHeat();

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heatCanvas, 0, 0, width, height);

    // Quiet reference grid.
    ctx.strokeStyle = "rgba(238,242,255,.065)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for (let i = 1; i < 4; i++) {
      const x = width * i / 4;
      const y = height * i / 4;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const radius = clamp(width / 88, 3.2, 5.5);

    for (const point of points) {
      const position = mapPosition(point, width, height);

      drawPoint(
        ctx,
        position.x,
        position.y,
        radius,
        point.label
      );
    }

    // The white ring marks the point currently in the network.
    if (selectedPoint) {
      const position = mapPosition(selectedPoint, width, height);

      ctx.save();

      ctx.beginPath();
      ctx.arc(
        position.x,
        position.y,
        radius + 5,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle = "rgba(11,16,32,.85)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = NN_COLORS.ink;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = NN_COLORS.ink;
      ctx.shadowBlur = 7;
      ctx.stroke();

      ctx.restore();

      if (selectedPoint.label === null) {
        ctx.fillStyle = NN_COLORS.ink;

        ctx.fillRect(position.x - 4, position.y - 1, 8, 2);
        ctx.fillRect(position.x - 1, position.y - 4, 2, 8);
      }
    }
  }

  function updateSelectionText(sending = false) {
    if (!selectedPoint) return;

    const p = selectedPoint;

    const actual =
      p.label === null ? "Test spot" :
      p.label === 1 ? "Cyan" : "Pink";

    ui.selectionTitle.textContent = p.index === undefined
      ? "Test spot"
      : `Point ${p.index + 1} · ${actual}`;

    ui.selectionInputs.textContent =
      `Input 1: ${formatValue(p.x)}  ·  ` +
      `Input 2: ${formatValue(p.y)}`;

    if (sending) {
      ui.selectionPrediction.textContent = "Sending its numbers…";
      ui.selectionPrediction.style.color = NN_COLORS.muted;
      return;
    }

    const probability = predict(network, p.x, p.y);
    const predictedLabel = Number(probability >= 0.5);

    const confidence = Math.round(
      Math.max(probability, 1 - probability) * 100
    );

    const predictedName = predictedLabel ? "Cyan" : "Pink";

    const result = p.label === null
      ? ""
      : predictedLabel === p.label
        ? " · Correct"
        : " · Wrong";

    ui.selectionPrediction.textContent =
      `Network says: ${predictedName} (${confidence}%)${result}`;

    ui.selectionPrediction.style.color =
      predictedLabel ? NN_COLORS.cyan : NN_COLORS.pink;
  }

  function inspectMapAt(clientX, clientY) {
    const bounds = ui.map.getBoundingClientRect();

    if (bounds.width <= 0 || bounds.height <= 0) return;

    const px = clientX - bounds.left;
    const py = clientY - bounds.top;

    let nearest = null;
    let distance = Infinity;

    for (const point of points) {
      const position = mapPosition(point, bounds.width, bounds.height);

      const d = Math.hypot(
        px - position.x,
        py - position.y
      );

      if (d < distance) {
        nearest = point;
        distance = d;
      }
    }

    // Tapping near a point selects that actual training point.
    if (nearest && distance <= 17) {
      inspectPoint(nearest);
      return;
    }

    // Empty space is also useful: ask the network about a new spot.
    inspectPoint({
      x: clamp(px / bounds.width * 2 - 1, -1, 1),
      y: clamp(1 - py / bounds.height * 2, -1, 1),
      label: null
    });
  }

  /* ----------------------------------------------------------
     The error curve
     ---------------------------------------------------------- */

  function appendHistory() {
    history.push({
      step,
      error: measurement.error
    });

    // Keep long lessons fast and memory use bounded.
    // Preserve samples across the entire lesson.
    if (history.length > 2200) {
      historyStride *= 2;

      const last = history[history.length - 1];

      history = history.filter(
        point => point.step % historyStride === 0
      );

      if (history.at(-1)?.step !== last.step) {
        history.push(last);
      }
    } else if (historyStride > 1 && history.length >= 3) {
      const previousIndex = history.length - 2;
      const previous = history[previousIndex];

      if (previous.step % historyStride !== 0) {
        history.splice(previousIndex, 1);
      }
    }
  }

  function niceMaximum(value) {
    if (value <= 0.1) return 0.1;
    if (value <= 0.2) return 0.2;
    if (value <= 0.5) return 0.5;
    if (value <= 1) return 1;

    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;

    const multiplier =
      normalized <= 2 ? 2 :
      normalized <= 5 ? 5 : 10;

    return multiplier * magnitude;
  }

  function paintCurve() {
    if (!showCurve || destroyed) return;

    const canvas = prepareCanvas(ui.curve);
    if (!canvas) return;

    const { context: ctx, width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    const left = 43;
    const right = 12;
    const top = 10;
    const bottom = 25;

    const plotWidth = Math.max(1, width - left - right);
    const plotHeight = Math.max(1, height - top - bottom);

    const largestError = history.reduce(
      (maximum, point) => Math.max(maximum, point.error),
      0.1
    );

    const yMax = niceMaximum(largestError * 1.04);
    const xMax = Math.max(1, step);

    const px = n => left + n / xMax * plotWidth;

    const py = n =>
      top + plotHeight - clamp(n / yMax, 0, 1) * plotHeight;

    ctx.font = "11px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const value = yMax * i / 4;
      const y = py(value);

      ctx.strokeStyle = "rgba(125,137,176,.15)";
      ctx.setLineDash(i === 0 ? [] : [3, 5]);

      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = "#a3afd0";

      ctx.fillText(
        value >= 10 ? value.toFixed(0) : value.toFixed(2),
        left - 7,
        y
      );
    }

    ctx.setLineDash([]);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xTicks = step < 4
      ? Array.from({ length: step + 1 }, (_, i) => i)
      : [...new Set([
          0,
          Math.round(step / 2),
          step
        ])];

    for (const value of xTicks) {
      ctx.fillStyle = "#a3afd0";

      let alignment = "center";
      if (value === 0) alignment = "left";
      if (value === xMax && value !== 0) alignment = "right";

      ctx.textAlign = alignment;

      ctx.fillText(
        String(value),
        px(value),
        top + plotHeight + 8
      );
    }

    if (!history.length) return;

    // Soft area under the error line.
    const gradient = ctx.createLinearGradient(
      0, top, 0, top + plotHeight
    );

    gradient.addColorStop(0, "rgba(251,191,36,.20)");
    gradient.addColorStop(1, "rgba(251,191,36,.015)");

    ctx.beginPath();
    ctx.moveTo(px(history[0].step), py(0));

    for (const point of history) {
      ctx.lineTo(px(point.step), py(point.error));
    }

    const latest = history[history.length - 1];

    ctx.lineTo(px(latest.step), py(0));
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();

    // The error line itself.
    ctx.beginPath();

    history.forEach((point, index) => {
      const x = px(point.step);
      const y = py(point.error);

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = NN_COLORS.amber;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.save();

    ctx.beginPath();
    ctx.arc(px(latest.step), py(latest.error), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = NN_COLORS.amber;
    ctx.shadowColor = NN_COLORS.amber;
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.restore();
  }

  /* ----------------------------------------------------------
     Moving dots and learning animation
     ---------------------------------------------------------- */

  function animationDuration() {
    if (motionPreference.matches) {
      return 70;
    }

    // A wide range: slow enough to follow, fast enough to experiment.
    return Math.round(
      1450 * Math.pow(0.073, (speed - 1) / 9)
    );
  }

  function hideDots() {
    for (const edge of edgeElements) {
      edge.dot.setAttribute("opacity", 0);
      edge.dotHalo.setAttribute("opacity", 0);
    }
  }

  function animateDots(activeLayer, progress, reverse) {
    if (motionPreference.matches) {
      hideDots();
      return;
    }

    const color = reverse
      ? NN_COLORS.amber
      : NN_COLORS.cyan;

    for (const edge of edgeElements) {
      if (edge.l !== activeLayer) {
        edge.dot.setAttribute("opacity", 0);
        edge.dotHalo.setAttribute("opacity", 0);
        continue;
      }

      const t = reverse ? 1 - progress : progress;

      const x = edge.start.x + (edge.end.x - edge.start.x) * t;
      const y = edge.start.y + (edge.end.y - edge.start.y) * t;

      const strength = Math.tanh(Math.abs(weightAt(edge)));

      setAttrs(edge.dot, {
        cx: x,
        cy: y,
        r: 2.1 + strength * 1.25,
        fill: color,
        opacity: 0.95
      });

      setAttrs(edge.dotHalo, {
        cx: x,
        cy: y,
        r: 5 + strength * 2,
        fill: color,
        opacity: 0.55
      });
    }
  }

  function renderForwardPass(progress, result) {
    const transitions = layers.length - 1;

    const position = clamp(progress, 0, 1) * transitions;
    const activeLayer = Math.min(
      transitions - 1,
      Math.floor(position)
    );

    const localProgress = clamp(position - activeLayer, 0, 1);

    // Numbers appear in each circle when the dots arrive.
    for (let l = 0; l <= activeLayer; l++) {
      showLayerValues(l, result.activations[l]);
    }

    if (progress >= 1) {
      showActivations(result.activations);
      hideDots();
    } else {
      animateDots(activeLayer, localProgress, false);
    }

    setPhase("forward", "Numbers moving");
  }

  function renderBackwardPass(progress, result) {
    showActivations(result.activations);

    const transitions = layers.length - 1;
    const position = clamp(progress, 0, 1) * transitions;

    const segment = Math.min(
      transitions - 1,
      Math.floor(position)
    );

    const activeLayer = transitions - 1 - segment;
    const localProgress = clamp(position - segment, 0, 1);

    animateDots(activeLayer, localProgress, true);
    setPhase("backward", "Error going back");
  }

  function renderAnimation(now) {
    if (!animation) return;

    const a = animation;
    const progress = clamp((now - a.started) / a.duration, 0, 1);

    if (a.kind === "inspect") {
      renderForwardPass(progress, a.result);
      return;
    }

    const forwardShare = 0.55;

    if (progress < forwardShare) {
      renderForwardPass(progress / forwardShare, a.result);
    } else {
      renderBackwardPass(
        (progress - forwardShare) / (1 - forwardShare),
        a.result
      );
    }
  }

  function scheduleFrame() {
    if (!frameId && !destroyed) {
      frameId = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    frameId = 0;

    if (destroyed) return;

    if (!animation && running) {
      beginLearningStep(now);
    }

    if (!animation) return;

    renderAnimation(now);

    if (now - animation.started >= animation.duration) {
      const finished = animation;
      animation = null;

      hideDots();

      if (finished.kind === "step") {
        finishLearningStep(finished);
      } else {
        finishInspection(finished);
      }
    }

    if (animation || running) {
      scheduleFrame();
    }
  }

  function cancelMotion() {
    animation = null;
    drag = null;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    hideDots();
    setPhase("idle", "Ready");
  }

  function stopAndCancel() {
    running = false;
    cancelMotion();
    syncControls();
  }

  function beginLearningStep(now = performance.now()) {
    if (destroyed || animation?.kind === "step") return;

    if (!pinnedPoint) {
      selectedPoint = points[step % points.length];
    }

    if (!selectedPoint) {
      selectedPoint = points[0];
    }

    // A test spot may be displayed, but it is never added to the
    // training data. Gradients always use the actual labelled points.
    const result = forward(
      network,
      selectedPoint.x,
      selectedPoint.y
    );

    const gradients = measureNetwork(network, points, true);

    animation = {
      kind: "step",
      started: now,
      duration: animationDuration(),
      result,
      gradients,
      sample: selectedPoint,
      lr,
      shape,
      layers: [...layers]
    };

    showLayerValues(0, result.activations[0]);

    setPhase("forward", "Numbers moving");

    paintMap();
    updateSelectionText(true);
    syncControls();

    if (!running) {
      explain("First, the numbers move forward. Then the error goes back.");
    }

    scheduleFrame();
  }

  function finishLearningStep(finished) {
    const before = finished.gradients;

    // The amber pass has finished. Now change the weights.
    applyGradients(
      network,
      finished.gradients,
      finished.lr,
      points.length
    );

    step++;

    const after = measureNetwork(network, points);

    lastBefore = before.error;
    lastAfter = after.error;

    if (
      finished.shape === "xor" &&
      finished.layers.slice(1, -1).every(n => n === 1)
    ) {
      xorSteps++;
    }

    if (finished.lr >= 5) {
      highSteps++;

      if (after.error > before.error + 0.0001) {
        highJump = true;
      }
    }

    measurement = after;
    appendHistory();

    refreshModel(after);
    syncComparison();

    const prefix = `Step ${step}:`;

    if (after.error > before.error + 0.000001) {
      explain(
        `${prefix} the error went up. ` +
        "Try a smaller learning speed."
      );
    } else if (
      after.error < 0.1 &&
      before.error >= 0.1 &&
      after.wrong === 0
    ) {
      explain(
        `${prefix} the network got every point right, ` +
        "and the error is small!"
      );
    } else if (after.error < before.error - 0.000001) {
      const wrongText = before.wrong === 1
        ? "1 point was wrong."
        : `${before.wrong} points were wrong.`;

      explain(
        `${prefix} ${wrongText} ` +
        "The network changed its weights to make the error smaller."
      );
    } else {
      explain(
        `${prefix} the error hardly changed. ` +
        "Try a different learning speed or more circles."
      );
    }

    setPhase("idle", running ? "Learning" : "Ready");
    syncControls();
  }

  function inspectPoint(point) {
    // Inspect immediately. An unfinished learning step has not yet
    // changed the network, so it is safe to cancel.
    stopAndCancel();

    selectedPoint = point;
    pinnedPoint = true;

    const result = forward(network, point.x, point.y);

    animation = {
      kind: "inspect",
      started: performance.now(),
      duration: motionPreference.matches
        ? 70
        : Math.max(450, animationDuration()),
      result,
      sample: point
    };

    showLayerValues(0, result.activations[0]);

    paintMap();
    updateSelectionText(true);

    explain("This point sends two numbers into the network.");

    setPhase("forward", "Numbers moving");
    syncControls();
    scheduleFrame();
  }

  function finishInspection(finished) {
    showActivations(finished.result.activations);
    updateSelectionText();

    const p = finished.sample;
    const probability = finished.result.probability;
    const prediction = Number(probability >= 0.5);
    const name = prediction ? "cyan" : "pink";

    if (p.label === null) {
      explain(
        `The network thinks this new spot is ${name}. ` +
        "No weights changed."
      );
    } else if (prediction === p.label) {
      explain(
        `The network says ${name}. ` +
        "That is correct for this point."
      );
    } else {
      explain(
        `The network says ${name}. ` +
        "That is wrong. Learning can help."
      );
    }

    setPhase("idle", "Ready");
    syncControls();
  }

  /* ----------------------------------------------------------
     Refresh and reset
     ---------------------------------------------------------- */

  function refreshModel(newMeasurement = null) {
    measurement =
      newMeasurement || measureNetwork(network, points);

    heatDirty = true;

    if (selectedPoint) {
      const result = forward(
        network,
        selectedPoint.x,
        selectedPoint.y
      );

      showActivations(result.activations);
    }

    syncEdges();
    syncMetrics();
    syncControls();

    paintMap();
    paintCurve();

    updateSelectionText();
    updateChallenges();
  }

  function resetHistory() {
    step = 0;
    lastBefore = null;
    lastAfter = null;

    historyStride = 1;

    measurement = measureNetwork(network, points);

    history = [{
      step: 0,
      error: measurement.error
    }];

    syncComparison();
  }

  function restartNetwork(message) {
    stopAndCancel();

    network = createNetwork(layers);

    selectedPoint = points[0];
    pinnedPoint = false;
    selectedWeight = 0;

    resetHistory();

    buildLayerControls();
    buildNetwork();
    refreshModel();

    explain(
      message ||
      "The weights are new and random. Press Learn to begin again."
    );

    setPhase("idle", "Ready");
  }

  function replacePoints(nextShape) {
    stopAndCancel();

    shape = normalizeShape(nextShape);
    points = makePoints(shape);

    selectedPoint = points[0];
    pinnedPoint = false;

    // The learner can see whether the same network works on new data.
    // New points reset the curve, but keep the weights.
    resetHistory();
    refreshModel();

    explain("The points are new. The network kept its weights.");

    setPhase("idle", "Ready");
  }

  function changeLayerSize(index, amount) {
    if (lockLayers) return;

    const hidden = layers.slice(1, -1);

    hidden[index] = clamp(hidden[index] + amount, 1, 8);

    layers = [2, ...hidden, 1];

    restartNetwork(
      "You changed the number of circles. This is a new network."
    );
  }

  function changeLayerCount(count) {
    if (lockLayers) return;

    const hidden = layers.slice(1, -1);

    if (hidden.length === count) return;

    if (count === 2) {
      hidden.push(hidden[0]);
    } else {
      hidden.length = 1;
    }

    layers = [2, ...hidden, 1];

    restartNetwork(
      "You changed the hidden layers. Try learning with this new network."
    );
  }

  /* ----------------------------------------------------------
     Events
     ---------------------------------------------------------- */

  ui.oneStep.addEventListener("click", () => {
    if (isLearning()) return;

    cancelMotion();
    beginLearningStep();
  });

  ui.play.addEventListener("click", () => {
    if (running) {
      // Finish the current step, then stop.
      running = false;

      if (animation?.kind === "step") {
        explain("Finishing this learning step, then pausing.");
      } else {
        cancelMotion();
        explain("Learning is paused. Try changing a weight yourself.");
      }

      syncControls();
      return;
    }

    if (animation?.kind === "inspect") {
      cancelMotion();
    }

    drag = null;
    pinnedPoint = false;
    running = true;

    explain("The network is learning. Watch the weights and the map.");

    syncControls();
    scheduleFrame();
  });

  ui.restart.addEventListener("click", () => restartNetwork());

  ui.newPoints.addEventListener("click", () => {
    replacePoints(shape);
  });

  ui.speed.addEventListener("input", () => {
    speed = clamp(Number(ui.speed.value), 1, 10);
    ui.speedValue.textContent = `${speed}/10`;

    ui.speed.setAttribute(
      "aria-valuetext",
      `${speed} out of 10`
    );
  });

  ui.rate.addEventListener("input", () => {
    lr = sliderToRate(Number(ui.rate.value));

    syncRate();
    updateChallenges();

    if (!isLearning()) {
      explain(
        lr >= 5
          ? "The next learning step will make very big changes."
          : "You changed how much the weights move in each learning step."
      );
    }
  });

  root.querySelectorAll("[data-shape]").forEach(button => {
    button.addEventListener("click", () => {
      const nextShape = button.dataset.shape;

      if (nextShape !== shape) {
        replacePoints(nextShape);
      }
    });
  });

  root.querySelectorAll("[data-layer-count]").forEach(button => {
    button.addEventListener("click", () => {
      changeLayerCount(Number(button.dataset.layerCount));
    });
  });

  ui.weightSelect.addEventListener("change", () => {
    if (!isLearning()) {
      selectWeight(Number(ui.weightSelect.value));
    }
  });

  ui.weightRange.addEventListener("input", () => {
    setWeight(selectedWeight, Number(ui.weightRange.value));
  });

  ui.weightMinus.addEventListener("click", () => adjustWeight(-0.1));
  ui.weightPlus.addEventListener("click", () => adjustWeight(0.1));

  ui.map.addEventListener("click", event => {
    inspectMapAt(event.clientX, event.clientY);
  });

  ui.map.addEventListener("keydown", event => {
    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      const direction =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : -1;

      const current = selectedPoint?.index ?? 0;

      const next =
        (current + direction + points.length) % points.length;

      inspectPoint(points[next]);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      inspectPoint(selectedPoint || points[0]);
    }
  });

  /* ----------------------------------------------------------
     Responsive layout
     ---------------------------------------------------------- */

  function handleResize() {
    if (destroyed || resizeFrame) return;

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;

      if (destroyed) return;

      const width = Math.round(ui.networkWrap.clientWidth);

      if (width > 0 && Math.abs(width - networkWidth) > 1) {
        buildNetwork();
      }

      paintMap();
      paintCurve();
    });
  }

  let resizeObserver = null;

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(handleResize);

    resizeObserver.observe(ui.networkWrap);

    if (showMap) resizeObserver.observe(ui.map);
    if (showCurve) resizeObserver.observe(ui.curve);
  }

  window.addEventListener("resize", handleResize);

  /* ----------------------------------------------------------
     Start
     ---------------------------------------------------------- */

  buildLayerControls();
  buildChallenges();
  buildNetwork();

  syncRate();
  syncComparison();
  refreshModel();

  explain(
    "The weights start with random numbers. " +
    "Take one learning step and see what changes."
  );

  setPhase("idle", "Ready");

  /* ----------------------------------------------------------
     Public API and cleanup
     ---------------------------------------------------------- */

  function destroy() {
    if (destroyed) return;

    destroyed = true;
    running = false;
    animation = null;
    drag = null;

    if (frameId) {
      cancelAnimationFrame(frameId);
    }

    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }

    resizeObserver?.disconnect();

    window.removeEventListener("resize", handleResize);

    host.remove();
  }

  return {
    destroy,
    getState
  };
}