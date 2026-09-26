const companies = [
  {
    name: 'G.P. Roll Makers India',
    country: 'India',
    category: 'Machinery',
    description: 'Section mills, structural mills, TMT/rebar mills, wire rod mills, strip mills and turnkey rolling-mill solutions',
    website: 'https://gprm.in/'
  },
  {
    name: 'A.S. Precision Machines Pvt. Ltd.',
    country: 'India',
    category: 'Machinery',
    description: 'Rebar mills, section mills, strip mills, merchant bar mills, wire rod mills and rolling-mill equipment',
    website: 'https://www.aspm.in/'
  },
  {
    name: 'J.S Rolling Mill Industries',
    country: 'India',
    category: 'Machinery',
    description: 'Turnkey rolling mills, mill stands, gearboxes, shears, conveyors and quenching systems',
    website: 'https://jsrollingmillindustries.com/'
  },
  {
    name: 'Laxmi Industries',
    country: 'India',
    category: 'Machinery',
    description: 'Rolling mills, wire rod mills, continuous casting machines, mill stands, rolls and spare parts',
    website: 'https://www.laxmi.industries/'
  },
  {
    name: 'Avtar Foundry & Workshop',
    country: 'India',
    category: 'Machinery',
    description: 'Rolling mill plants, housingless stands, gearboxes, cooling beds, shears, rolls and mill components',
    website: 'https://www.avtarsteelmillplant.com/'
  },
  {
    name: 'Multi Roll Tech',
    country: 'India',
    category: 'Machinery',
    description: 'Section mills, TMT mills, hot-steel mills, wire-rod mills, housingless mills, rolls and gearboxes',
    website: 'https://multirolltech.com/'
  },
  {
    name: 'R.S. Udyog',
    country: 'India',
    category: 'Spare Parts',
    description: 'Rolling-mill rolls, indefinite-chilled rolls, CI rolls and rolling-mill machinery',
    website: 'https://rsudyog.com/'
  },
  {
    name: 'Vimco Rolls Industries',
    country: 'India',
    category: 'Spare Parts',
    description: 'Adamite rolls, alloy-steel-base rolls, SG iron rolls, chilled cast-iron rolls and forged rolls',
    website: 'https://vimcorolls.com/'
  },
  {
    name: 'ADK Machines',
    country: 'Turkey',
    category: 'Machinery',
    description: 'Turnkey rolling mills, meltshop technology, machinery, spare parts and commissioning',
    website: 'https://www.adkmachines.com/'
  },
  {
    name: 'Rana Steel',
    country: 'Turkey',
    category: 'Machinery',
    description: 'Rolling mills, rolling-mill equipment, meltshops and turnkey steel-plant solutions',
    website: 'https://www.ranademir.com/'
  }
];

const params = new URLSearchParams(window.location.search);
const name = params.get('name');

const company = companies.find(
  item => item.name === name
);

if (company) {
  document.title =
    company.name + ' | Rolling Mill World';

  document.getElementById('companyName').textContent =
    company.name;

  document.getElementById('companyInfo').textContent =
    company.country + ' · ' + company.category;

  document.getElementById('companyCategory').textContent =
    company.category;

  document.getElementById('companyDescription').textContent =
    company.description;

  document.getElementById('websiteLink').href =
    company.website;
} else {
  document.getElementById('companyName').textContent =
    'Company not found';

  document.getElementById('companyInfo').textContent =
    'This supplier could not be found in the directory.';

  document.getElementById('companyDescription').textContent =
    'Please return to the supplier directory and select a supplier.';
}
