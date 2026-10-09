
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

  if (results) results.innerHTML = '<p>Loading suppliers…</p>';

  try {
    if (typeof getSupabaseClient !== 'function') {
      throw new Error('Supabase client is not available.');
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
      status: row.status || '',
      role: row.role || ''
    }));

    render();
  } catch (err) {
    console.error('Supplier directory failed to load:', err);
    suppliers = [];

    if (count) count.textContent = 'Supplier directory unavailable';

    if (results) {
      results.innerHTML =
        '<p>We could not load the live supplier directory right now. Please try again shortly.</p>';
    }
  }
}

function render() {
  const resultsEl = document.getElementById('results');
  const countEl = document.getElementById('count');

  if (!resultsEl) return;

  const query = (document.getElementById('q')?.value || '')
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

    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = !category || supplier.type === category;
    const matchesCountry = !country || supplier.country === country;

    return matchesQuery && matchesCategory && matchesCountry;
  });

  if (countEl) {
    countEl.textContent = `${matches.length} supplier${matches.length === 1 ? '' : 's'} found`;
  }

  resultsEl.innerHTML = matches.map(supplier => {
    const rfqUrl =
      'index.html?rfq_supplier=' + encodeURIComponent(supplier.id) +
      '&rfq_supplier_name=' + encodeURIComponent(supplier.name) +
      '#rfq';

    const website = supplier.website
      ? `<p><a href="${escapeHtml(supplier.website)}" target="_blank" rel="noopener noreferrer">Visit website</a></p>`
      : '';

    const countryText = supplier.country
      ? `<p><strong>Country:</strong> ${escapeHtml(supplier.country)}</p>`
      : '';

    const typeText = supplier.type
      ? `<p><strong>Type:</strong> ${escapeHtml(supplier.type)}</p>`
      : '';

    const capabilitiesText = supplier.capabilities
      ? `<p>${escapeHtml(supplier.capabilities)}</p>`
      : '';

    return `
      <article class="supplier">
        <h3>${escapeHtml(supplier.name)}</h3>
        ${countryText}
        ${typeText}
        ${capabilitiesText}
        ${website}
        <a class="btn dark" href="${rfqUrl}">Send RFQ</a>
      </article>
    `;
  }).join('') || '<p>No matching suppliers yet.</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
  const searchButton = document.querySelector('aside button');

  if (searchButton) {
    searchButton.addEventListener('click', event => {
      event.preventDefault();
      render();
    });
  }

  const queryInput = document.getElementById('q');
  if (queryInput) {
    queryInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        render();
      }
    });
  }

  await loadSuppliers();
});
