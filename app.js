async function getRfQClientAndUser() {
  if (typeof getSupabaseClient !== 'function') {
    throw new Error('Authentication system is not available.');
  }

  const sb = await getSupabaseClient();
  const { data, error } = await sb.auth.getSession();

  if (error) throw error;

  if (!data.session || !data.session.user) {
    throw new Error('Please sign in before submitting an RFQ.');
  }

  return { sb, user: data.session.user };
}

function getSelectedSupplier() {
  const params = new URLSearchParams(window.location.search);

  return {
    id: params.get('rfq_supplier') || '',
    name: params.get('rfq_supplier_name') || ''
  };
}

function showSelectedSupplier() {
  const supplier = getSelectedSupplier();
  if (!supplier.id && !supplier.name) return;

  const form = document.getElementById('rfqForm');
  if (!form) return;

  let field = document.getElementById('rfqSupplierId');

  if (!field) {
    field = document.createElement('input');
    field.type = 'hidden';
    field.id = 'rfqSupplierId';
    field.name = 'supplier_id';
    form.appendChild(field);
  }

  field.value = supplier.id;

  const details = document.getElementById('rfqDetails');

  if (supplier.name && details &&
      !details.value.includes('Preferred supplier:')) {
    details.value =
      `Preferred supplier: ${supplier.name}\n\n${details.value}`;
  }

  let notice = document.getElementById('selectedSupplierNotice');

  if (!notice) {
    notice = document.createElement('p');
    notice.id = 'selectedSupplierNotice';
    notice.style.cssText =
      'padding:12px;background:#eef6ff;border-radius:8px;margin:12px 0;';
    form.prepend(notice);
  }

  notice.textContent = supplier.name
    ? `Selected supplier: ${supplier.name}`
    : 'A supplier has been selected for this RFQ.';
}

async function submitRfq(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const msg = document.getElementById('msg');
  const button = form.querySelector('button[type="submit"]');

  if (msg) {
    msg.className = '';
    msg.textContent = 'Submitting RFQ…';
  }
  if (button) button.disabled = true;

  try {
    const company = document.getElementById('rfqCompany').value.trim();
    const email = document.getElementById('rfqEmail').value.trim();
    const country = document.getElementById('rfqCountry').value.trim();
    const categoryLabel = document.getElementById('rfqCategory').value;
    const details = document.getElementById('rfqDetails').value.trim();
    const consent = document.getElementById('rfqConsent').checked;

    const categoryMap = {
      'Complete rolling mill': '00dcae93-6a04-4ec2-9f18-0f6680b175a2',
      'Spare parts': '297c4c57-c260-464a-93d8-7a965c47e1d3',
      'Machinery': 'c229a626-7474-457c-8c00-e1533d5a1fcc',
      'Used machinery': 'e0a278b3-42c8-43d1-8edd-50c80ec3ce06',
      'Service / maintenance': '7e84ad76-f1d6-4ced-8b17-b2e2cf211e90'
    };

    const categoryId = categoryMap[categoryLabel];
    const supplier = getSelectedSupplier();

    const { sb, user } = await getRfQClientAndUser();

    const payload = {
      buyer_id: user.id,
      title: 'Rolling Mill RFQ — ' + company,
      description: details,
      status: 'open'
    };

    if (categoryId) payload.category_id = categoryId;
    if (country) payload.delivery_country = country;
    if (consent) payload.technical_requirements = details;

    /*
     * Only save supplier_id after confirming that this column
     * exists in your rfqs table. See note below.
     */
  
if (supplier.id) {
  payload.supplier_id = supplier.id;
  payload.company_id = supplier.id;
}

    const { data, error } = await sb
      .from('rfqs')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;

    form.reset();

    if (msg) {
      msg.className = 'ok';
      msg.textContent =
        'RFQ submitted successfully. Reference: ' + data.id;
    }

  } catch (err) {
    console.error('RFQ submission failed:', err);

    if (msg) {
      msg.className = '';
      msg.textContent = err.message || 'Could not submit RFQ.';
    }

  } finally {
    if (button) button.disabled = false;
  }
}

/* HOMEPAGE LIVE STATISTICS */

function setPublicStat(label, value) {
  const target = String(label || '').trim().toLowerCase();

  const idMap = {
    suppliers: ['supplierCount', 'suppliersCount'],
    'open rfqs': ['rfqCount', 'rfqsCount'],
    rfqs: ['rfqCount', 'rfqsCount'],
    jobs: ['jobCount', 'jobsCount']
  };

  for (const id of idMap[target] || []) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = String(value);
      return;
    }
  }
}

async function loadPublicMarketplaceStats() {
  const statsRoot = document.querySelector('.stats');

  if (!statsRoot || typeof getSupabaseClient !== 'function') return;

  try {
    const sb = await getSupabaseClient();
    const { data, error } = await sb.rpc('get_public_marketplace_stats');

    if (error) throw error;

    const stats = data && typeof data === 'object' ? data : {};

    if (stats.supplier_count !== undefined) {
      setPublicStat('suppliers', stats.supplier_count);
    }
    if (stats.open_rfq_count !== undefined) {
      setPublicStat('open rfqs', stats.open_rfq_count);
    }
    if (stats.job_count !== undefined) {
      setPublicStat('jobs', stats.job_count);
    }
  } catch (err) {
    console.warn('Public marketplace stats could not be loaded:', err);
  }
}

/* PAGE INITIALIZATION */

document.addEventListener('DOMContentLoaded', () => {
  showSelectedSupplier();

  const form = document.getElementById('rfqForm');

  if (form) {
    form.addEventListener('submit', submitRfq);
  }

  loadPublicMarketplaceStats();
});
