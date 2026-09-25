const data = [
  [
    'G.P. Roll Makers India',
    'India',
    'Machinery',
    'Section mills, structural mills, TMT/rebar mills, wire rod mills, strip mills and turnkey rolling-mill solutions',
    0
  ],
  [
    'A.S. Precision Machines Pvt. Ltd.',
    'India',
    'Machinery',
    'Rebar mills, section mills, strip mills, merchant bar mills, wire rod mills and rolling-mill equipment',
    0
  ],
  [
    'J.S Rolling Mill Industries',
    'India',
    'Machinery',
    'Turnkey rolling mills, mill stands, gearboxes, shears, conveyors and quenching systems',
    0
  ],
  [
    'Laxmi Industries',
    'India',
    'Machinery',
    'Rolling mills, wire rod mills, continuous casting machines, mill stands, rolls and spare parts',
    0
  ],
  [
    'Avtar Foundry & Workshop',
    'India',
    'Machinery',
    'Rolling mill plants, housingless stands, gearboxes, cooling beds, shears, rolls and mill components',
    0
  ],
  [
    'Multi Roll Tech',
    'India',
    'Machinery',
    'Section mills, TMT mills, hot-steel mills, wire-rod mills, housingless mills, rolls and gearboxes',
    0
  ],
  [
    'R.S. Udyog',
    'India',
    'Spare Parts',
    'Rolling-mill rolls, indefinite-chilled rolls, CI rolls and rolling-mill machinery',
    0
  ],
  [
    'Vimco Rolls Industries',
    'India',
    'Spare Parts',
    'Adamite rolls, alloy-steel-base rolls, SG iron rolls, chilled cast-iron rolls and forged rolls',
    0
  ],
  [
    'ADK Machines',
    'Turkey',
    'Machinery',
    'Turnkey rolling mills, meltshop technology, machinery, spare parts and commissioning',
    0
  ],
  [
    'Rana Steel',
    'Turkey',
    'Machinery',
    'Rolling mills, rolling-mill equipment, meltshops and turnkey steel-plant solutions',
    0
  ]
];

function render() {
  const q =
    (document.getElementById('q').value || '').toLowerCase();

  const c =
    document.getElementById('cat').value;

  const co =
    document.getElementById('country').value;

  const a = data.filter(
    x =>
      (!q || x.join(' ').toLowerCase().includes(q)) &&
      (!c || x[2] === c) &&
      (!co || x[1] === co)
  );

  document.getElementById('count').textContent =
    a.length + ' suppliers';

  document.getElementById('results').innerHTML =
    a.map(
      x => `
        <article class="supplier">
          <div>
            <h3>${x[0]}</h3>
            <p>${x[1]} · ${x[3]}</p>
            <span class="tag">${x[2]}</span>
            <span class="tag">Public Listing</span>
          </div>

          <a
            class="btn dark"
            href="index.html#rfq"
          >
            Send RFQ
          </a>
        </article>
      `
    ).join('') ||
    '<p>No matching suppliers yet.</p>';
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const p =
      new URLSearchParams(location.search);

    if (p.get('category')) {
      document.getElementById('cat').value =
        p.get('category');
    }

    if (localStorage.getItem('q')) {
      document.getElementById('q').value =
        localStorage.getItem('q');
    }

    render();
  }
);
