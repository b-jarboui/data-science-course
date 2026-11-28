// 21.3.4 Try it: inspect speech frames using a generated sound.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const RATE = 16000, HOP = 160, SIZE = 400, BANDS = 80, FFT = 512;
  const DEFAULT_DURATION = 120; // Duration in hundredths of a second.
  const WIDTH = 360, HEIGHT = 224;
  const X = 46, Y = 22, W = 300, H = 151;
  const PRESET = [
    { pitch: 180, upper: 710, gain: 0.82 },
    { pitch: 260, upper: 1540, gain: 0.68 },
    { pitch: 220, upper: 1160, gain: 0.61 },
    { pitch: 155, upper: 940, gain: 0.88 },
  ];
  const EDGES = [0, 0.25, 5 / 12, 13 / 24, 1];

  let duration = DEFAULT_DURATION, selected = 0, pause = false, parts = PRESET;
  let frames = [], timer = null, random = false;
  const canvas = h('canvas', {
    width: WIDTH * 2, height: HEIGHT * 2, role: 'img',
    style: { width: '100%', height: 'auto', display: 'block', touchAction: 'pan-y' },
  });
  const bitmap = h('canvas');
  const ctx = canvas.getContext('2d'), heat = bitmap.getContext('2d');
  ctx.scale(2, 2);

  const box = h('div'), note = h('div', { class: 'sim-note' }), challengeRoot = h('div');
  const sliderStyle = { width: '100%', minHeight: '32px', accentColor: C.cyan };
  const durationReadout = h('span'), frameReadout = h('span'), speedReadout = h('span');
  const durationInput = h('input', {
    type: 'range', min: 40, max: 300, step: 1, value: DEFAULT_DURATION,
    'aria-label': 'Clip duration', style: sliderStyle,
    oninput: event => { duration = Number(event.target.value); stop(); rebuild(); },
  });
  const frameInput = h('input', {
    type: 'range', min: 1, max: DEFAULT_DURATION, value: 1,
    'aria-label': 'Select a frame', style: sliderStyle,
    oninput: event => { stop(); select(Number(event.target.value) - 1); },
  });
  const speedInput = h('input', {
    type: 'range', min: 1, max: 30, value: 10,
    'aria-label': 'Playback speed', style: sliderStyle,
    oninput: () => {
      speedReadout.textContent = `${speedInput.value} frames per second`;
      speedInput.setAttribute('aria-valuetext', speedReadout.textContent);
      if (timer !== null) { stop(); start(); }
    },
  });

  function control(name, readout, input) {
    return h('label', { class: 'sim-note', style: { display: 'block' } }, name, ' · ', readout, input);
  }

  const playButton = btn('Play', () => { if (timer === null) start(); else stop(); });
  const stepButton = btn('Step', () => { stop(); select(selected + 1); });
  const pauseInput = h('input', {
    type: 'checkbox',
    onchange: event => { pause = event.target.checked; stop(); rebuild(); },
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: frames in time'),
    h('p', { class: 'sub' },
      'Four groups of tones stand in for “Where is the library?” Change the duration, then tap the picture or use the frame slider to look inside a column.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        canvas,
        control('Clip duration', durationReadout, durationInput),
        control('Selected frame', frameReadout, frameInput),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', () => {
            stop();
            duration = DEFAULT_DURATION;
            selected = 0;
            pause = false;
            random = false;
            parts = PRESET;
            pauseInput.checked = false;
            speedInput.value = 10;
            speedReadout.textContent = '10 frames per second';
            speedInput.setAttribute('aria-valuetext', speedReadout.textContent);
            rebuild();
          })),
        control('Playback speed', speedReadout, speedInput),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.5rem', minHeight: '44px' } },
            pauseInput, 'Add a pause in the middle'),
          btn('New data', () => {
            stop();
            parts = PRESET.map(() => ({ pitch: rnd(130, 430), upper: rnd(540, 2450), gain: rnd(50, 95) / 100 }));
            duration = rnd(75, 275);
            selected = 0;
            random = true;
            rebuild();
          }, 'go'))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const quiz = challenges(challengeRoot, [
    {
      text: 'Select frame 66 of the 1.2-second clip.',
      check: st => st.duration === 120 && st.selected === 65,
      why: 'Frame 66 starts after 65 gaps of 10 milliseconds, at 0.65 seconds.',
    },
    {
      text: 'Give the same four groups of tones twice as much time as the starting clip.',
      check: st => st.duration === 240 && !st.random,
      why: 'At 2.4 seconds the four groups take 240 frames, twice the starting count of 120.',
    },
    {
      text: 'Add a pause, then select a frame that is silent for all 25 milliseconds.',
      check: st => st.inPause,
      why: 'A silent frame still has a start time and 80 loudness values, all zero.',
    },
  ]);

  // FFT lookup tables. The transform uses a tapered 400-sample frame and
  // zeros for its remaining input, including any samples beyond the clip.
  const bitReverse = Uint16Array.from({ length: FFT }, (_, i) => {
    let value = i, reversed = 0;
    for (let k = FFT; k > 1; k >>= 1) {
      reversed = (reversed << 1) | (value & 1);
      value >>= 1;
    }
    return reversed;
  });
  const cos = Float64Array.from({ length: FFT / 2 }, (_, i) => Math.cos(2 * Math.PI * i / FFT));
  const sin = Float64Array.from({ length: FFT / 2 }, (_, i) => -Math.sin(2 * Math.PI * i / FFT));
  const windowWeights = Float64Array.from({ length: SIZE }, (_, i) =>
    0.5 - 0.5 * Math.cos(2 * Math.PI * i / (SIZE - 1)));
  const real = new Float64Array(FFT), imag = new Float64Array(FFT);
  const seconds = hundredths => (hundredths / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const pauseBounds = n => [Math.floor(n * 0.42), Math.ceil(n * 0.58)];

  function makeSound() {
    const n = duration * HOP;
    const sound = new Float32Array(n);
    const [from, to] = pauseBounds(n);
    parts.forEach(({ pitch, upper, gain }, k) => {
      const a = Math.floor(EDGES[k] * n), b = Math.floor(EDGES[k + 1] * n);
      for (let i = a; i < b; i++) {
        if (pause && i >= from && i < to) continue;
        const u = (i - a) / (b - a);
        const time = (i - a) / RATE;
        const envelope = Math.sin(Math.PI * u) ** 0.65 * (0.82 + 0.18 * Math.cos(4 * Math.PI * u));
        sound[i] = gain * envelope * (
          0.54 * Math.sin(2 * Math.PI * pitch * time)
          + 0.24 * Math.sin(2 * Math.PI * 2 * pitch * time)
          + 0.15 * Math.sin(2 * Math.PI * upper * time)
          + 0.07 * Math.sin(2 * Math.PI * (upper + pitch) * time)
        );
      }
    });
    return sound;
  }

  function frameBands(sound, start) {
    real.fill(0);
    imag.fill(0);
    for (let i = 0; i < SIZE; i++) {
      real[bitReverse[i]] = (sound[start + i] ?? 0) * windowWeights[i];
    }
    for (let size = 2; size <= FFT; size *= 2) {
      const half = size / 2, stride = FFT / size;
      for (let a = 0; a < FFT; a += size) {
        for (let j = 0; j < half; j++) {
          const p = a + j, q = p + half, k = j * stride;
          const r = cos[k] * real[q] - sin[k] * imag[q];
          const im = cos[k] * imag[q] + sin[k] * real[q];
          real[q] = real[p] - r;
          imag[q] = imag[p] - im;
          real[p] += r;
          imag[p] += im;
        }
      }
    }
    const bandPower = new Float64Array(BANDS);
    for (let k = 0; k < FFT / 2; k++) {
      const band = Math.floor(k * BANDS / (FFT / 2));
      bandPower[band] += real[k] ** 2 + imag[k] ** 2;
    }
    return bandPower;
  }

  function paintBitmap() {
    bitmap.width = frames.length;
    bitmap.height = BANDS;
    const image = heat.createImageData(bitmap.width, BANDS);
    frames.forEach((frame, i) => {
      frame.forEach((power, band) => {
        const value = Math.min(1, Math.log1p(55 * Math.sqrt(power) / SIZE) / Math.log1p(9));
        const p = 4 * ((BANDS - 1 - band) * bitmap.width + i);
        image.data[p] = 11 + Math.round(value * 79);
        image.data[p + 1] = 16 + Math.round(value * 199);
        image.data[p + 2] = 32 + Math.round(value * 200);
        image.data[p + 3] = 255;
      });
    });
    heat.putImageData(image, 0, 0);
  }

  function rebuild() {
    const sound = makeSound();
    frames = Array.from({ length: duration }, (_, i) => frameBands(sound, i * HOP));
    selected = Math.min(selected, frames.length - 1);
    durationInput.value = duration;
    frameInput.max = frames.length;
    paintBitmap();
    draw();
  }

  function text(label, x, y, color = C.ink, align = 'left') {
    ctx.fillStyle = color;
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = align;
    ctx.fillText(label, x, y);
  }

  function draw() {
    const n = frames.length, dx = W / n;
    const x = X + dx * selected, start = selected * HOP;
    const [pauseStart, pauseEnd] = pauseBounds(n * HOP);
    const padded = Math.max(0, start + SIZE - n * HOP);
    const inPause = pause && start >= pauseStart && start + SIZE <= pauseEnd;
    const time = seconds(selected);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, X, Y, W, H);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1;
    ctx.strokeRect(X, Y, W, H);
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, Y, dx, H);
    ctx.beginPath();
    ctx.moveTo(x + dx / 2, Y + H);
    ctx.lineTo(x + dx / 2, Y + H + 9);
    ctx.stroke();
    text('High', X - 6, Y + 11, C.muted, 'right');
    text('Low', X - 6, Y + H, C.muted, 'right');
    text('Pitch', X, 15, C.muted);
    text('Bright = loud', X + W, 15, C.cyan, 'right');
    text('0 s', X, 197, C.muted);
    text(`${seconds(duration)} s`, X + W, 197, C.muted, 'right');
    text(`Time · frame ${selected + 1}`, X + W / 2, 215, C.amber, 'center');

    durationReadout.textContent = `${seconds(duration)} seconds`;
    frameReadout.textContent = `${selected + 1} of ${n}`;
    frameInput.value = selected + 1;
    frameInput.setAttribute('aria-valuetext', `Frame ${selected + 1} at ${time} seconds`);
    durationInput.setAttribute('aria-valuetext', durationReadout.textContent);
    stepButton.disabled = selected === n - 1;
    canvas.setAttribute('aria-label',
      `Spectrogram of a ${seconds(duration)}-second generated sound. Frame ${selected + 1} of ${n} starts at ${time} seconds.`);
    fbox(box, [
      `${seconds(duration)} s × 100 = ${n} frames`,
      `${n} × 80 = ${n * BANDS} values`,
      [`Frame ${selected + 1} starts at ${time} s`, C.amber],
      '25 ms · 400 samples · 80 bands',
    ]);
    if (inPause) note.textContent = 'All 400 samples in this frame are silent, so all 80 bands have zero loudness.';
    else if (padded) note.textContent = `This frame reaches past the end of the clip. ${padded} of its 400 samples are filled with silence.`;
    else note.textContent = 'Each column has 80 pitch bands. Brighter bands contain more sound.';
    quiz.update({ duration, selected, inPause, random });
  }

  function select(i) {
    selected = Math.max(0, Math.min(frames.length - 1, i));
    draw();
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function start() {
    if (selected === frames.length - 1) select(0);
    playButton.textContent = 'Pause';
    timer = setInterval(() => {
      select(selected + 1);
      if (selected === frames.length - 1) stop();
    }, 1000 / Number(speedInput.value));
  }

  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * WIDTH / rect.width;
    const y = (event.clientY - rect.top) * HEIGHT / rect.height;
    if (x < X || x >= X + W || y < Y || y > Y + H) return;
    stop();
    select(Math.floor((x - X) / W * frames.length));
  });

  speedReadout.textContent = '10 frames per second';
  speedInput.setAttribute('aria-valuetext', speedReadout.textContent);
  rebuild();
  return stop;
}
