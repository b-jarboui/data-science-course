// 14.1.1 Try it: compare station positions and directions on the same grid.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  const start = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const max = 10;
  const clamp = value => Math.max(0, Math.min(max, Math.round(value)));
  const copyStart = () => start.map(point => point.slice());
  const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
  let points = copyStart();
  let first = 2;
  let second = 4;
  let mode = 'position';
  let dragging = null;

  const svg = s('svg', {
    viewBox: '0 0 400 414',
    role: 'img',
    'aria-label': 'Station grid. Departures run across and returns run up.',
  });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const status = h('div', { class: 'sim-row' });
  const challengeRoot = h('div');

  function stationSelect(label, change) {
    const select = h('select', { onchange: event => change(Number(event.target.value)) },
      ...names.map((name, i) => h('option', { value: i }, `Station ${name}`)));
    select.style.cssText = 'min-height:44px;margin-inline-start:.4rem;font:inherit';
    return { select, control: h('label', {}, label, select) };
  }
  const reference = stationSelect('From', index => {
    if (index === second) second = first;
    first = index;
    draw();
  });
  const comparison = stationSelect('To', index => {
    if (index === first) first = second;
    second = index;
    draw();
  });
  const positionButton = btn('Euclidean', () => { mode = 'position'; draw(); });
  const directionButton = btn('Cosine', () => { mode = 'direction'; draw(); });

  function makeSlider(label, axis) {
    const value = h('span');
    const input = h('input', {
      type: 'range', min: 0, max, step: 1,
      'aria-label': `${label} at the To station`,
      style: { width: '100%', margin: 0, minHeight: '44px' },
      oninput: event => {
        points[second][axis] = Number(event.target.value);
        draw();
      },
    });
    return { input, value, control: h('label', { style: { display: 'block', marginTop: '.65rem' } }, `${label} `, value, input) };
  }
  const leaving = makeSlider('Bicycles leaving', 0);
  const returning = makeSlider('Bicycles returning', 1);

  function newData() {
    const pool = Array.from({ length: (max + 1) ** 2 }, (_, i) => [i % (max + 1), Math.floor(i / (max + 1))]);
    const next = names.map(() => pool.splice(rnd(0, pool.length - 1), 1)[0]);
    if (next.every((point, i) => samePoint(point, points[i]))) next.push(next.shift());
    points = next;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: distance choices'),
    h('p', { class: 'sub' }, 'Choose two stations. Drag any dot, or move the To station with the sliders. Switch distance rules to compare the string and the arrows.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, status, svg,
        h('div', { class: 'sim-row' }, reference.control, comparison.control),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Distance rule' }, positionButton, directionButton),
        leaving.control, returning.control,
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Reset lesson data', () => {
            points = copyStart();
            first = 2;
            second = 4;
            mode = 'position';
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const trainer = challenges(challengeRoot, [
    {
      text: 'Use the lesson data and compare A and D with Euclidean distance.',
      check: state => state.mode === 'position' && [state.first, state.second].sort().join() === '0,3' &&
        samePoint(state.points[0], start[0]) && samePoint(state.points[3], start[3]),
      why: 'A and D are on the same row, so the straight string is six units long.',
    },
    {
      text: 'Use cosine distance to find two stations in different positions with distance zero.',
      check: state => state.mode === 'direction' && state.distance > 0 && state.cosine === 0,
      why: 'The arrows have the same direction even though the station counts differ.',
    },
    {
      text: 'Move one of your two stations to zero leaving and zero returning, then check cosine distance.',
      check: state => state.mode === 'direction' && state.cosine === null,
      why: 'A station at zero has an arrow of length zero, so it has no direction to compare.',
    },
  ]);
  challengeRoot.addEventListener('click', checkCurrentChallenge);

  const x0 = 39;
  const y0 = 355;
  const unit = 31;
  const x = value => x0 + value * unit;
  const y = value => y0 - value * unit;
  function segment(a, b, color, width = 1, opacity = 1) {
    return s('line', {
      x1: x(a[0]), y1: y(a[1]), x2: x(b[0]), y2: y(b[1]),
      stroke: color, 'stroke-width': width, 'stroke-opacity': opacity, 'stroke-linecap': 'round',
    });
  }
  function text(content, px, py, color, size = 15, anchor = 'middle') {
    return s('text', {
      x: px, y: py, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace', 'pointer-events': 'none',
    }, content);
  }
  const grid = [];
  for (let i = 0; i <= max; i++) {
    grid.push(segment([i, 0], [i, max], i === 0 ? C.muted : C.line),
      segment([0, i], [max, i], i === 0 ? C.muted : C.line),
      text(i, x(i), y0 + 22, C.muted));
    if (i > 0) grid.push(text(i, x0 - 12, y(i) + 5, C.muted, 15, 'end'));
  }
  grid.push(text('↑ Bicycles returning', x0, 25, C.ink, 17, 'start'),
    text('Bicycles leaving →', x(max / 2), 404, C.ink, 17));

  function arrow(point, color, width) {
    const [dx, dy] = point;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      return [s('circle', { cx: x0, cy: y0, r: 13, fill: 'none', stroke: color, 'stroke-width': 2 })];
    }
    const ux = dx / length;
    const uy = dy / length;
    const tip = [dx - 0.2 * ux, dy - 0.2 * uy];
    const base = [tip[0] - 0.3 * ux, tip[1] - 0.3 * uy];
    const left = [base[0] - 0.14 * uy, base[1] + 0.14 * ux];
    const right = [base[0] + 0.14 * uy, base[1] - 0.14 * ux];
    return [segment([0, 0], base, color, width),
      s('polygon', { points: [tip, left, right].map(([a, b]) => `${x(a)},${y(b)}`).join(' '), fill: color })];
  }

  function toGrid(event) {
    const position = svg.createSVGPoint();
    position.x = event.clientX;
    position.y = event.clientY;
    const local = position.matrixTransform(svg.getScreenCTM().inverse());
    return [(local.x - x0) / unit, (y0 - local.y) / unit];
  }

  svg.addEventListener('pointerdown', event => {
    if (dragging || event.button !== 0) return;
    const station = event.target.closest('[data-station]');
    if (!station) return;
    const index = Number(station.getAttribute('data-station'));
    const [px, py] = toGrid(event);
    dragging = {
      pointer: event.pointerId, index,
      offset: [points[index][0] - px, points[index][1] - py],
    };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.pointer) return;
    const [px, py] = toGrid(event);
    const next = [clamp(px + dragging.offset[0]), clamp(py + dragging.offset[1])];
    if (samePoint(next, points[dragging.index])) return;
    points[dragging.index] = next;
    draw();
  });
  function endDrag(event) {
    if (dragging?.pointer === event.pointerId) dragging = null;
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('lostpointercapture', endDrag);

  function measure() {
    const [ax, ay] = points[first];
    const [bx, by] = points[second];
    const across = bx - ax;
    const up = by - ay;
    const distance = Math.hypot(across, up);
    const horizontal = ax * bx;
    const vertical = ay * by;
    const lengths = Math.hypot(ax, ay) * Math.hypot(bx, by);
    const agreement = lengths === 0 ? null : Math.min(1, (horizontal + vertical) / lengths);
    const cosine = agreement === null ? null : ax * by === ay * bx ? 0 : 1 - agreement;
    return { points, first, second, mode, across, up, distance, horizontal, vertical, lengths, agreement, cosine };
  }

  function checkCurrentChallenge() {
    trainer.update(measure());
  }

  function draw() {
    const state = measure();
    const { across, up, distance, horizontal, vertical, lengths, cosine } = state;
    const a = points[first];
    const b = points[second];
    const colors = i => i === first ? C.cyan : i === second ? C.amber : C.ink;
    const format = (number, digits) => Number.isInteger(number) ? String(number) : number.toFixed(digits);
    const content = [...grid];
    if (mode === 'position') {
      content.push(segment(a, b, C.amber, 3));
    } else {
      // Draw the longer shaft first so both heads show on a shared direction.
      const pair = [first, second].sort((i, j) => Math.hypot(...points[j]) - Math.hypot(...points[i]));
      pair.forEach(i => content.push(...arrow(points[i], colors(i), 3)));
    }

    // Coincident dots share a location. Keep both labels and draw the To dot on top.
    const stacks = new Map();
    const order = names.map((_, i) => i).filter(i => i !== first && i !== second).concat(first, second);
    for (const i of order) {
      const [px, py] = points[i];
      const key = `${px},${py}`;
      const stack = stacks.get(key) ?? [];
      stack.push(i);
      stacks.set(key, stack);
      const color = colors(i);
      content.push(s('circle', { cx: x(px), cy: y(py), r: 12, fill: color, 'fill-opacity': '.16' }),
        s('circle', { cx: x(px), cy: y(py), r: i === second ? 5 : 7, fill: color, stroke: C.bg, 'stroke-width': 1.2 }),
        s('circle', { cx: x(px), cy: y(py), r: 13, fill: 'transparent', 'data-station': i, style: 'cursor:grab' }));
    }
    for (const ids of stacks.values()) {
      const [px, py] = points[ids[0]];
      const lineHeight = 15;
      const toLeft = px === max;
      ids.forEach((i, row) => content.push(text(names[i], x(px) + (toLeft ? -10 : 10),
        Math.min(y0 - 4 - (ids.length - 1) * lineHeight, y(py) - 7) + row * lineHeight,
        colors(i), 15, toLeft ? 'end' : 'start')));
    }
    svg.replaceChildren(...content);

    reference.select.value = String(first);
    comparison.select.value = String(second);
    leaving.input.value = leaving.value.textContent = String(b[0]);
    returning.input.value = returning.value.textContent = String(b[1]);
    positionButton.classList.toggle('go', mode === 'position');
    directionButton.classList.toggle('go', mode === 'direction');
    positionButton.setAttribute('aria-pressed', String(mode === 'position'));
    directionButton.setAttribute('aria-pressed', String(mode === 'direction'));
    status.replaceChildren(pill(mode === 'position' ? 'EUCLIDEAN DISTANCE' : 'COSINE DISTANCE',
      mode === 'position' ? C.amber : C.violet));

    const pairLabel = `${names[first]} (${a.join(', ')}) to ${names[second]} (${b.join(', ')})`;
    if (mode === 'position') {
      fbox(box, [
        pairLabel,
        `Across: ${b[0]} − ${a[0]} = ${across}`,
        `Up: ${b[1]} − ${a[1]} = ${up}`,
        [`√((${across})² + (${up})²) = ${format(distance, 2)}`, C.amber],
      ]);
      note.textContent = 'Euclidean distance measures the length of the straight string.';
    } else {
      const sum = horizontal + vertical;
      fbox(box, [
        pairLabel,
        `Products: ${a[0]} × ${b[0]} + ${a[1]} × ${b[1]} = ${sum}`,
        `Arrow lengths: √${a[0] ** 2 + a[1] ** 2} × √${b[0] ** 2 + b[1] ** 2} ≈ ${format(lengths, 3)}`.replace('≈ 0', '= 0'),
        cosine === null ? ['Cosine distance is undefined', C.pink]
          : [`1 − (${sum} ÷ product) ≈ ${format(cosine, 3)}`, C.violet],
      ]);
      note.textContent = cosine === null ? 'A zero-length arrow has no direction.' : 'Cosine distance measures the difference in arrow directions.';
    }
    trainer.update(state);
  }

  draw();
  return () => {
    if (dragging && svg.hasPointerCapture(dragging.pointer)) svg.releasePointerCapture(dragging.pointer);
    challengeRoot.removeEventListener('click', checkCurrentChallenge);
  };
}
