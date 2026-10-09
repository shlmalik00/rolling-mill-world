
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let suppliers = [];

async function loadSuppliers() {
  const results = document.getElementById('results');
  const count = document.getElementById('count');

  if (!results) {
    console.error('Directory error: #results element is missing.');
    return;
  }

  results.innerHTML = '<p>Connecting to supplier directory…</p>';
  if (count) count.textContent = 'Loading suppliers…';

  try {
    if (typeof getSupabaseClient !== 'function') {
      throw new Error('auth.js did not load. Check the script tags in directory.html.');
    }

    const sb = await getSupabaseClient();
    const { data, error } = await sb.rpc('get_public_suppliers');

    if (error) throw error;

    suppliers = (data || []).map(row => ({
      id: row.id || '',
      name: row.name || 'Unnamed supplier',
      country: row.country || '',
      type: row.type || '',
      capabilities: row.capabilities || '',
      website: row.website || '',
      status: row.status || ''
    }));

    render();

    if (suppliers.length === 0) {
      results.innerHTML =
        '<p>No suppliers were returned by the database. Please check supplier records and public access.</p>';
    }
  } catch (err) {
    console.error('Supplier directory error:', err);
    suppliers = [];

    if (count) count.textContent = 'Could not load suppliers';

    results.innerHTML =
      '<p><strong>Unable to load suppliers.</strong></p>' +
      '<p id="directoryError"></p>';

    const errorBox = document.getElementById('directoryError');
    if (errorBox) {
      errorBox.textContent = err.message || 'Unknown error. Open the browser console for details.';
    }
  }
}

function render() {
  const results = document.getElementById('results');
  const count = document.getElementById('count');

  if (!results) return;

  const q = (document.getElementById('q')?.value || '')
    .trim()
    .toLowerCase();

  const category = document.getElementById('cat')?.value || '';
  const country = document.getElementById('country')?.value || '';

  const matches = suppliers.filter(supplier => {
    const searchable = [
      supplier.name,
      supplier.country,
      supplier.type,
      supplier.capabilities
    ].join(' ').toLowerCase();

    return (!q || searchable.includes(q)) &&
      (!category || supplier.type === category) &&
      (!country || supplier.country === country);
  });

  if (count) {
    count.textContent =
      `${matches.length} supplier${matches.length === 1 ? '' : 's'} found`;
  }

  results.innerHTML = matches.map(supplier => {
    const website = String(supplier.website || '').trim();
    const safeWebsite = /^https?:\/\//i.test(website) ? website : '';

    const rfqUrl =
      'index.html?rfq_supplier=' + encodeURIComponent(supplier.id) +
      '&rfq_supplier_name=' + encodeURIComponent(supplier.name) +
      '#rfq';

    return `
      <article class="supplier">
        <h3>${escapeHtml(supplier.name)}</h3>
        ${supplier.country
          ? `<p><strong>Country:</strong> ${escapeHtml(supplier.country)}</p>`
          : ''}
        ${supplier.type
          ? `<p><strong>Type:</strong> ${escapeHtml(supplier.type)}</p>`
          : ''}
        ${supplier.capabilities
          ? `<p>${escapeHtml(supplier.capabilities)}</p>`
          : ''}
        ${safeWebsite
          ? `<p><a href="${escapeHtml(safeWebsite)}" target="_blank" rel="noopener noreferrer">Visit website</a></p>`
          : ''}
        <a class="btn dark" href="${rfqUrl}">Send RFQ</a>
      </article>
    `;
  }).join('') || '<p>No matching suppliers. Clear the search and filters to see all suppliers.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.querySelector('aside button');

  if (searchButton) {
    searchButton.addEventListener('click', event => {
      event.preventDefault();
      render();
    });
  }

  const queryInput = document.getElementById('q');

  if (queryInput) {
    queryInput.addEventListener('input', render);
    queryInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        render();
      }
    });
  }

  document.getElementById('cat')?.addEventListener('change', render);
  document.getElementById('country')?.addEventListener('change', render);

  loadSuppliers();
});
