// 12.2.2 Try it: change a brand and read the three switches.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const BRANDS = ['Falcon', 'Ridge', 'Swift'];
  const COLORS = [C.cyan, C.amber, C.pink];
  const IDS = ['1', '2', '3', '4', '5', '6', '7', '8', 'N1', 'N2'];
  const START = ['Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge', 'Swift', 'Falcon', 'Ridge', 'Comet', 'Falcon'];
  const UNSEEN = ['Comet', 'Harbor', 'Juniper', 'Lumen'];
  const key = value => value.trim().toLowerCase();
  const encode = brand => BRANDS.map(name => Number(key(name) === key(brand)));

  let names = START.slice();
  let selected = 0;
  let assignedBikeFive = false;
  let predictedUnseen = false;
  let blockedSecondLight = false;

  const formula = h('div', { 'aria-live': 'polite' });
  const result = h('div', { class: 'sim-note', role: 'status' });
  const challengePanel = h('div');
  const selectedLabel = h('p', { class: 'sim-note' });
  const input = h('input', {
    id: 'one-hot-brand',
    type: 'text',
    maxlength: 40,
    autocomplete: 'off',
    required: true,
    placeholder: 'e.g. Comet',
    style: {
      width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '.45rem .6rem',
      background: C.bg, color: C.ink, border: `1px solid ${C.muted}`, borderRadius: '.55rem',
      font: 'inherit',
    },
  });
  const pick = h('select', {
    id: 'one-hot-prediction',
    class: 'sim-btn',
    style: { width: '100%', marginTop: '.25rem' },
  },
  h('option', { value: '' }, 'Choose a prediction'),
  ...BRANDS.map(brand => h('option', { value: brand }, `${brand} only`)),
  h('option', { value: 'none' }, 'All switches off'));

  const checks = challenges(challengePanel, [
    {
      text: 'Give bike 5 a brand so its switches read 0, 0, 1.',
      check: state => state.assignedBikeFive && encode(state.names[4]).join() === '0,0,1',
      why: 'Swift is the third column, so choosing Swift lights only the last switch.',
    },
    {
      text: 'Type an unseen brand, predict which switches will turn on, then press Enter or Apply brand.',
      check: state => state.predictedUnseen,
      why: 'The columns come from the training brands, so an unseen brand leaves every switch off.',
    },
    {
      text: 'Choose a known brand, then try turning on a second switch for the same bike.',
      check: state => state.blockedSecondLight,
      why: 'Each bike has one brand, so the three switches can record at most one yes.',
    },
  ]);

  const switchButtons = BRANDS.map((brand, j) => {
    const button = btn(brand, () => trySwitch(j));
    button.style.flex = '1 1 5.7rem';
    return button;
  });

  const form = h('form', { onsubmit: applyTypedBrand },
    h('p', { class: 'sim-note' }, 'Type a brand for the selected bike. Choose a prediction before applying it.'),
    h('div', { style: { display: 'grid', gap: '.45rem' } },
      h('label', { for: 'one-hot-brand' }, 'Brand name'),
      input,
      h('label', { for: 'one-hot-prediction' }, 'Which switches will turn on?'),
      pick,
      h('button', { type: 'submit', class: 'sim-btn go' }, 'Apply brand'),
    ),
  );
  input.addEventListener('input', () => {
    input.setCustomValidity('');
    pick.value = '';
  });

  const cellStyle = {
    padding: '.23rem .08rem', textAlign: 'center', borderBottom: `1px solid ${C.line}`,
  };
  const rows = IDS.map((id, i) => {
    const selector = h('select', {
      'aria-label': `Brand for bike ${id}`,
      onfocus: () => selectBike(i),
      onchange: event => {
        const brand = event.target.value;
        if (brand === '') {
          input.value = '';
          input.setCustomValidity('');
          pick.value = '';
          result.textContent = `Type a brand for bike ${id}.`;
          draw();
          input.focus();
          return;
        }
        setBrand(i, brand);
        result.textContent = `Bike ${id} is now ${brand}.`;
        draw();
      },
      style: {
        width: '100%', minWidth: 0, minHeight: '44px', padding: '.12rem',
        borderRadius: '.4rem', border: `1px solid ${C.line}`, color: C.ink,
        background: C.bg, font: 'inherit',
      },
    });
    const select = btn(id, () => selectBike(i));
    select.setAttribute('aria-label', `Select bike ${id}`);
    Object.assign(select.style, { width: '100%', padding: '.15rem', borderRadius: '.4rem' });
    const cells = BRANDS.map(() => h('td', { style: { ...cellStyle, fontFamily: 'Consolas, monospace' } }));
    const row = h('tr', {},
      h('th', { scope: 'row', style: cellStyle }, select),
      h('td', { style: cellStyle }, selector),
      cells,
    );
    return { row, select, selector, cells };
  });

  const table = h('table', {
    'aria-label': 'Bike brands and their one-hot switches',
    style: { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 'clamp(.75rem, 2.8vw, 1rem)' },
  },
  h('thead', {}, h('tr', {}, ['Bike', 'Brand', ...BRANDS].map((label, j) =>
    h('th', {
      scope: 'col',
      style: { ...cellStyle, width: ['13%', '30%', '19%', '19%', '19%'][j], color: COLORS[j - 2] || C.ink },
    }, label)))),
  h('tbody', {}, rows.map(item => item.row)));

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one switch per brand'),
    h('p', { class: 'sub' }, 'Change a bike’s brand and watch its switches. The columns stay set to Falcon, Ridge and Swift.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, table,
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Start again', () => reset(START, 'The original bikes are back.')))),
      h('div', {},
        h('div', { class: 'sim-card' }, formula, selectedLabel,
          h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Try the selected bike’s switches' }, switchButtons),
          form, result),
        h('div', { class: 'sim-card' }, challengePanel),
      ),
    ),
  );
  root.append(panel);

  function selectBike(i) {
    if (selected === i) return;
    selected = i;
    input.value = '';
    input.setCustomValidity('');
    pick.value = '';
    result.textContent = '';
    draw();
  }

  function setBrand(i, brand) {
    selected = i;
    names[i] = brand;
    if (i === 4) assignedBikeFive = true;
  }

  function applyTypedBrand(event) {
    event.preventDefault();
    const typed = input.value.trim();
    if (!typed) {
      input.setCustomValidity('Enter a brand name.');
      input.reportValidity();
      return;
    }
    const brand = BRANDS.find(name => key(name) === key(typed)) || typed;
    const known = BRANDS.includes(brand);
    const prediction = pick.value;
    const correct = prediction === (known ? brand : 'none');
    if (!known && correct) predictedUnseen = true;
    setBrand(selected, brand);

    const explanation = known
      ? `Only the ${brand} switch turns on.`
      : 'This brand has no column, so all switches are off.';
    result.textContent = prediction
      ? `${correct ? 'Your prediction matched.' : 'Compare your prediction with the row.'} ${explanation}`
      : explanation;
    input.value = '';
    input.setCustomValidity('');
    pick.value = '';
    draw();
  }

  function trySwitch(j) {
    const on = encode(names[selected]).indexOf(1);
    if (on >= 0 && on !== j) {
      blockedSecondLight = true;
      result.textContent = `${BRANDS[on]} is already on. A bike has one brand. Change its brand to light ${BRANDS[j]}.`;
    } else if (on === j) {
      result.textContent = `${BRANDS[j]} is on because it matches the bike’s brand. Change the brand to change the switches.`;
    } else {
      result.textContent = `${BRANDS[j]} is off because it does not match the bike’s brand. Choose ${BRANDS[j]} to turn it on.`;
    }
    draw();
  }

  function reset(data, message) {
    names = data.slice();
    selected = 0;
    assignedBikeFive = false;
    predictedUnseen = false;
    blockedSecondLight = false;
    input.value = '';
    input.setCustomValidity('');
    pick.value = '';
    result.textContent = message;
    draw();
  }

  function newData() {
    const data = IDS.map((_, i) => i === 8 ? UNSEEN[rnd(0, UNSEEN.length - 1)] : BRANDS[rnd(0, 2)]);
    if (data.every((brand, i) => brand === names[i])) {
      data[0] = BRANDS[(BRANDS.indexOf(data[0]) + 1) % BRANDS.length];
    }
    reset(data, 'Fresh bike brands. The three switch columns are the same.');
  }

  function draw() {
    rows.forEach(({ row, select, selector, cells }, i) => {
      const brand = names[i];
      const choice = BRANDS.includes(brand) ? 'known' : brand;
      if (selector.dataset.choices !== choice) {
        selector.replaceChildren(
          ...BRANDS.map(name => h('option', { value: name }, name)),
          ...(choice === 'known' ? [] : [h('option', { value: brand }, brand)]),
          h('option', { value: '' }, 'Type a brand…'),
        );
        selector.dataset.choices = choice;
      }
      selector.value = brand;
      select.setAttribute('aria-pressed', String(i === selected));
      select.style.borderColor = i === selected ? C.violet : C.line;
      row.style.background = i === selected ? '#252044' : 'transparent';

      encode(brand).forEach((value, j) => {
        cells[j].textContent = String(value);
        cells[j].style.color = value ? COLORS[j] : C.muted;
        cells[j].style.fontWeight = value ? '700' : '400';
        cells[j].style.background = value ? `${COLORS[j]}24` : 'transparent';
      });
    });

    const brand = names[selected];
    const values = encode(brand);
    const on = values.indexOf(1);
    selectedLabel.textContent = `Bike ${IDS[selected]} switches. Tap a switch to test it.`;
    switchButtons.forEach((button, j) => {
      const lit = values[j] === 1;
      button.textContent = `${BRANDS[j]} · ${lit ? 'On' : 'Off'}`;
      button.setAttribute('aria-pressed', String(lit));
      button.style.color = lit ? COLORS[j] : C.ink;
      button.style.borderColor = lit ? COLORS[j] : C.muted;
      button.style.background = lit ? `${COLORS[j]}24` : C.card;
    });
    fbox(formula, [
      `Bike ${IDS[selected]} · ${brand}`,
      'Falcon · Ridge · Swift',
      [`    ${values[0]}       ${values[1]}       ${values[2]}`, on === -1 ? C.muted : COLORS[on]],
      on === -1 ? 'Unseen brand → all switches off' : `${BRANDS[on]} matches → one switch on`,
    ]);
    checks.update({ names, assignedBikeFive, predictedUnseen, blockedSecondLight });
  }

  draw();
  return () => panel.remove();
}
