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
    const sb = await getSupabaseClient();

    const response = await sb.rpc('get_public_suppliers');

    console.log('Supplier RPC response:', response);

    if (response.error) {
      throw new Error(
        response.error.message ||
        response.error.details ||
        response.error.hint ||
        'Supplier RPC failed'
      );
    }

    suppliers = Array.isArray(response.data) ? response.data : [];

    render();

  } catch (err) {
    console.error('Supplier directory failed:', err);

    suppliers = [];

    if (count) {
      count.textContent = '0 suppliers';
    }

    if (results) {
      results.innerHTML =
        '<p>Unable to load suppliers.</p>' +
        '<p style="font-size:12px;color:#777;">Please refresh the page.</p>';
    }
  }
}

function render() {
  const qEl = document.getElementById('q');
  const catEl = document.getElementById('cat');
  const countryEl = document.getElementById('country');

  const q = (qEl?.value || '').toLowerCase().trim();
  const c = catEl?.value || '';
  const co = countryEl?.value || '';

  const matches = suppliers.filter(x => {
    const haystack = [
      x.name,
      x.country,
      x.type,
      x.capabilities
    ].join(' ').toLowerCase();

    return (
      (!q || haystack.includes(q)) &&
      (!c || x.type === c) &&
      (!co || x.country === co)
    );
  });

  const count = document.getElementById('count');
  const results = document.getElementById('results');

  if (count) {
    count.textContent =
      matches.length +
      (matches.length === 1 ? ' supplier' : ' suppliers');
  }

  if (!results) return;

  results.innerHTML = matches.map(x => {
    const website = String(x.website || '').trim();
    const safeWebsite =
      /^https?:\/\//i.test(website) ? website : '';

    return `
      <article class="supplier">
        <div>
          <h3>
            ${escapeHtml(x.name || 'Unnamed supplier')}
            ${x.status === 'verified' ? ' ✓' : ''}
          </h3>

          <p>
            ${escapeHtml(
              [x.country, x.capabilities]
                .filter(Boolean)
                .join(' · ') ||
              'Supplier profile'
            )}
          </p>

          ${
            x.type
              ? `<span class="tag">${escapeHtml(x.type)}</span>`
              : ''
          }

          <span class="tag">RFQ available</span>

          ${
            safeWebsite
              ? `<a href="${escapeHtml(safeWebsite)}"
                    target="_blank"
                    rel="noopener">
                    Website
                 </a>`
              : ''
          }
        </div>

        <a class="btn dark" href="index.html#rfq">
          Send RFQ
        </a>
      </article>
    `;
  }).join('') || '<p>No matching suppliers yet.</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
  const p = new URLSearchParams(location.search);

  if (p.get('category')) {
    const cat = document.getElementById('cat');
    if (cat) cat.value = p.get('category');
  }

  const savedQuery = localStorage.getItem('q');

  if (savedQuery) {
    const q = document.getElementById('q');
    if (q) q.value = savedQuery;
  }

  await loadSuppliers();
});
