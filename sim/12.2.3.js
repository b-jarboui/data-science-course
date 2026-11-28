// 12.2.3 Try it: change the grade order and see what happens to the price dots.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const natural = ['Poor', 'Fair', 'Good', 'Excellent'];
  const alphabetical = ['Excellent', 'Fair', 'Good', 'Poor'];
  const colors = { Poor: C.pink, Fair: C.amber, Good: C.cyan, Excellent: C.green };
  const startingPrices = { Poor: [200], Fair: [200, 300], Good: [400, 300, 500, 600], Excellent: [700] };
  const randomBands = { Poor: [6, 11], Fair: [12, 17], Good: [18, 28], Excellent: [30, 39] };
  const order = [...natural];
  let prices = startingPrices;
  let drag = null;

  const list = h('ol', { 'aria-label': 'Grade order', style: {
    display: 'grid', gap: '0.45rem', listStyle: 'none', padding: '0', margin: '0 0 0.75rem',
  } });
  const svg = s('svg', { viewBox: '0 0 420 262', role: 'img' });
  const box = h('div');
  const challengeRoot = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const rows = order.map((_, slot) => {
    const handle = h('span', { 'data-slot': slot, style: {
      touchAction: 'none', cursor: 'grab', userSelect: 'none', flex: '1 1 8rem',
      fontWeight: '650', minHeight: '44px', display: 'flex', alignItems: 'center',
    } });
    const up = btn('↑', () => moveWithButton(slot, slot - 1));
    const down = btn('↓', () => moveWithButton(slot, slot + 1));
    const row = h('li', { style: {
      display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.4rem 0.2rem 0.6rem',
      border: `1px solid ${C.line}`, borderRadius: '0.6rem', background: C.bg,
    } }, handle, up, down);
    list.append(row);
    return { row, handle, up, down };
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: order the bike grades'),
    h('p', { class: 'sub' }, 'Drag the grade names or use the arrow buttons. The first grade gets code 1. Watch what happens to the mean price dots.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, list, svg, status,
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            prices = Object.fromEntries(natural.map(grade => {
              const [low, high] = randomBands[grade];
              return [grade, startingPrices[grade].map(() => 20 * rnd(low, high))];
            }));
            draw();
          }, 'go'),
          btn('Start again', () => {
            prices = startingPrices;
            order.splice(0, order.length, ...natural);
            draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const sameOrder = (a, b) => a.every((grade, i) => grade === b[i]);
  const mean = grade => prices[grade].reduce((sum, price) => sum + price, 0) / prices[grade].length;
  const chal = challenges(challengeRoot, [
    {
      text: 'Put the grades in alphabetical order and look for a drop in the dots.',
      check: state => sameOrder(state.order, alphabetical),
      why: 'Excellent now gets code 1 and Poor gets 4, so the dots no longer climb.',
    },
    {
      text: 'Put the grades in condition order, starting with the worst, to make the dots climb.',
      check: state => sameOrder(state.order, natural) && state.rising,
      why: 'Each higher code now goes with a higher mean price.',
    },
    {
      text: 'Keep Poor first and Excellent last, and make the dots drop between codes 2 and 3.',
      check: state => state.order[0] === 'Poor' && state.order[3] === 'Excellent' && state.means[1] > state.means[2],
      why: 'Good has a higher mean price than Fair, so putting Good second makes the dots dip in the middle.',
    },
  ]);

  function chart(values) {
    const left = 50, right = 410, base = 205, top = 24;
    const x = i => left + (i + 0.5) * (right - left) / 4;
    const y = value => base - (base - top) * value / 800;
    const text = (value, tx, ty, color, size, anchor = 'middle') => s('text', {
      x: tx, y: ty, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, String(value));
    const items = [];
    for (let tick = 0; tick <= 800; tick += 200) {
      items.push(
        s('line', { x1: left, x2: right, y1: y(tick), y2: y(tick), stroke: tick ? C.line : C.muted }),
        text(`$${tick}`, left - 5, y(tick) + 5, C.ink, 16, 'end'));
    }
    items.push(s('line', { x1: left, x2: left, y1: top, y2: base, stroke: C.muted }),
      s('polyline', {
        points: values.map((value, i) => `${x(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: C.violet, 'stroke-width': 2.5, 'stroke-linejoin': 'round',
      }));
    values.forEach((value, i) => {
      const color = colors[order[i]];
      items.push(s('circle', { cx: x(i), cy: y(value), r: 12, fill: color, 'fill-opacity': 0.19 }),
        s('circle', { cx: x(i), cy: y(value), r: 5.5, fill: color }),
        text(`$${fmt(value)}`, x(i), y(value) - 14, color, 18),
        text(order[i], x(i), base + 22, color, 17),
        text(`Code ${i + 1}`, x(i), base + 43, C.ink, 16));
    });
    svg.replaceChildren(...items);
    svg.setAttribute('aria-label', `Mean price by code. ${order.map((grade, i) =>
      `Code ${i + 1}, ${grade}, ${fmt(values[i])} dollars`).join('. ')}.`);
  }

  function checkChallenge() {
    const means = order.map(mean);
    chal.update({
      order,
      means,
      rising: means.every((value, i) => i === 0 || value > means[i - 1]),
    });
  }

  function draw() {
    rows.forEach(({ handle, up, down }, i) => {
      const grade = order[i];
      handle.textContent = `↕  ${i + 1}. ${grade}`;
      handle.style.color = colors[grade];
      up.disabled = i === 0;
      down.disabled = i === order.length - 1;
      up.setAttribute('aria-label', `Move ${grade} earlier`);
      down.setAttribute('aria-label', `Move ${grade} later`);
    });
    const means = order.map(mean);
    chart(means);
    const gaps = means.slice(1).map((value, i) => value - means[i]);
    const signedMoney = value => `${value < 0 ? '−' : value > 0 ? '+' : ''}$${fmt(Math.abs(value))}`;
    fbox(box, [
      ['Code = position, starting at 1', C.cyan],
      ...order.map((grade, i) => {
        const values = prices[grade];
        const price = `$${fmt(means[i])}`;
        const work = values.length === 1 ? price : `(${values.join(' + ')}) ÷ ${values.length} = ${price}`;
        return [`${i + 1}  ${grade}  ${work}`, colors[grade]];
      }),
      ['Code steps: +1, +1, +1', C.cyan],
      [`Price changes: ${gaps.map(signedMoney).join(', ')}`, C.amber],
    ]);
    status.textContent = gaps.every(gap => gap > 0)
      ? 'The mean price rises at every step.'
      : gaps.some(gap => gap < 0)
        ? 'The mean price falls at one or more steps.'
        : 'Two neighboring grades have the same mean price.';
    checkChallenge();
  }

  function reorder(from, to) {
    if (from === to || to < 0 || to >= order.length) return;
    const [grade] = order.splice(from, 1);
    order.splice(to, 0, grade);
    draw();
  }

  function moveWithButton(from, to) {
    reorder(from, to);
    const row = rows[to];
    const preferred = to < from ? row.up : row.down;
    const alternate = to < from ? row.down : row.up;
    (preferred.disabled ? alternate : preferred).focus();
  }

  function grab(event) {
    const handle = event.target.closest('[data-slot]');
    if (!handle || drag || event.button !== 0) return;
    event.preventDefault();
    drag = { pointerId: event.pointerId, slot: Number(handle.dataset.slot) };
    list.setPointerCapture(event.pointerId);
  }

  function move(event) {
    if (drag?.pointerId !== event.pointerId) return;
    const next = rows.findIndex(({ row }) => {
      const bounds = row.getBoundingClientRect();
      return event.clientY < (bounds.top + bounds.bottom) / 2;
    });
    const to = next < 0 ? rows.length - 1 : Math.max(0, next - (next > drag.slot ? 1 : 0));
    if (to === drag.slot) return;
    reorder(drag.slot, to);
    drag.slot = to;
  }

  function release(event) {
    if (drag?.pointerId !== event.pointerId) return;
    drag = null;
  }

  const events = [
    ['pointerdown', grab], ['pointermove', move], ['pointerup', release],
    ['pointercancel', release], ['lostpointercapture', release],
  ];
  events.forEach(([name, handler]) => list.addEventListener(name, handler));
  challengeRoot.addEventListener('click', checkChallenge);
  draw();

  return () => {
    if (drag && list.hasPointerCapture(drag.pointerId)) list.releasePointerCapture(drag.pointerId);
    drag = null;
    events.forEach(([name, handler]) => list.removeEventListener(name, handler));
    challengeRoot.removeEventListener('click', checkChallenge);
  };
}
