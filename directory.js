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

  if (results) {
    results.innerHTML = '<p>Loading suppliers…</p>';
  }

  try {
    if (typeof getSupabaseClient !== 'function') {
      throw new Error('Supabase client is not available.');
    }

    const sb = await getSupabaseClient();

    const { data, error } = await sb.rpc('get_public_suppliers');

    if (error) {
      throw error;
    }

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

    const message = err && err.message
      ? err.message
      : String(err);

    if (count) {
      count.textContent = 'Directory error';
    }

    if (results) {
      results.innerHTML =
        '<p><strong>Directory error:</strong> ' +
        escapeHtml(message) +
        '</p>';
    }
  }

function render() {
  const q = (document.getElementById('q').value || '').toLowerCase().trim();
  const c = document.getElementById('cat').value;
  const co = document.getElementById('country').value;

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

  document.getElementById('count').textContent =
    matches.length +
    (matches.length === 1 ? ' supplier' : ' suppliers');

  document.getElementById('results').innerHTML =
    matches.map(x => {

      const website = String(x.website || '').trim();

      const safeWebsite =
        /^https?:\/\//i.test(website)
          ? website
          : '';

      const companyUrl =
        'company.html?name=' +
        encodeURIComponent(x.name);

      return `
        <article class="supplier">
          <div>
            <h3>
              ${escapeHtml(x.name)}
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

            ${x.type
              ? `<span class="tag">${escapeHtml(x.type)}</span>`
              : ''
            }

            <span class="tag">Public Listing</span>

            <a href="${companyUrl}">
              View Company
            </a>

            ${safeWebsite
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
    document.getElementById('cat').value =
      p.get('category');
  }

  if (localStorage.getItem('q')) {
    document.getElementById('q').value =
      localStorage.getItem('q');
  }

  await loadSuppliers();
});
