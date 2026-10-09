
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

async function findCategoryId(sb, categoryLabel) {
  const map = {
    'Complete rolling mill': 'Complete Rolling Mill Plants',
    'Machinery': 'Rolling Mill Machinery',
    'Spare parts': 'Spare Parts',
    'Service / maintenance': 'Maintenance Services',
    'Used machinery': 'Used Machinery'
  };

  const name = map[categoryLabel];
  if (!name) return null;

  const { data, error } = await sb
    .from('categories')
    .select('id,name')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    console.warn('RFQ category lookup failed:', error);
    return null;
  }

  return data && data.id ? data.id : null;
}

async function findPublicSupplier(sb, supplierId) {
  if (!supplierId) return null;

  const { data, error } = await sb.rpc('get_public_suppliers');
  if (error) throw error;

  return (data || []).find(
    row => String(row.id) === String(supplierId)
  ) || null;
}

// Keep the selected supplier even after the URL is cleaned up.
const initialRfqParams = new URLSearchParams(window.location.search);
let selectedRfqSupplierId =
  (initialRfqParams.get('rfq_supplier') || '').trim();

const initialRfqSupplierName =
  (initialRfqParams.get('rfq_supplier_name') || '').trim();

function getSelectedSupplierId() {
  if (selectedRfqSupplierId) return selectedRfqSupplierId;

  selectedRfqSupplierId =
    (new URLSearchParams(window.location.search)
      .get('rfq_supplier') || '').trim();

  return selectedRfqSupplierId;
}

function escapeHtmlForRfq(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSelectedSupplier(name, label = 'RFQ for:') {
  const form = document.getElementById('rfqForm');
  if (!form || !name) return;

  let target = document.getElementById('rfqSupplierTarget');

  if (!target) {
    target = document.createElement('div');
    target.id = 'rfqSupplierTarget';
    target.style.margin = '0 0 14px';
    target.style.padding = '10px 12px';
    target.style.borderRadius = '8px';
    target.style.background = '#eef6ff';
    target.style.border = '1px solid #cfe5ff';
    target.style.fontSize = '14px';

    const firstField = form.querySelector('input, select, textarea');

    if (firstField) {
      form.insertBefore(target, firstField);
    } else {
      form.appendChild(target);
    }
  }

  target.innerHTML =
    '<strong>' + escapeHtmlForRfq(label) + '</strong> ' +
    escapeHtmlForRfq(name);
}

async function showSelectedSupplier(sb, supplierId) {
  if (!supplierId) return null;

  const supplier = await findPublicSupplier(sb, supplierId);

  if (!supplier) {
    throw new Error(
      'The selected supplier could not be found. Please return to the supplier directory and try again.'
    );
  }

  // Use the supplier name verified by the database.
  renderSelectedSupplier(supplier.name || 'Selected supplier');

  return supplier;
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
    const supplierId = getSelectedSupplierId();

    if (!company || !email || !country || !details) {
      throw new Error('Please complete all required RFQ fields.');
    }

    if (!supplierId) {
      throw new Error(
        'Please select a supplier from the supplier directory before submitting this RFQ.'
      );
    }

    if (!consent) {
      throw new Error(
        'Please confirm that Rolling Mill World may share this RFQ with the selected supplier.'
      );
    }

    const { sb } = await getRfQClientAndUser();

    // Always verify the supplier against the database.
    const supplier = await showSelectedSupplier(sb, supplierId);

    const categoryId = await findCategoryId(sb, categoryLabel);

    if (!categoryId) {
      throw new Error(
        'The selected RFQ category could not be matched in the marketplace database.'
      );
    }

    const payload = {
      company_id: supplier.id,
      category_id: categoryId,
      title: 'Rolling Mill RFQ — ' + company,
      description: details,
      delivery_country: country,
      status: 'open'
    };

    const { data, error } = await sb.rpc('submit_rfq', {
      p_payload: payload
    });

    if (error) throw error;

    const result = data && typeof data === 'object' ? data : {};
    const rfqId = result.id || '';

    form.reset();

    // Keep the supplier selection visible after submission.
    renderSelectedSupplier(
      supplier.name || 'Selected supplier',
      'RFQ sent to:'
    );

    if (msg) {
      msg.className = 'ok';
      msg.textContent =
        'RFQ submitted successfully to ' +
        (supplier.name || 'the selected supplier') +
        (rfqId ? '. Reference: ' + rfqId : '.');
    }

    // Remove query parameters from the address bar without losing
    // the selected supplier stored in selectedRfqSupplierId.
    if (window.history && window.history.replaceState) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash
      );
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

async function initialiseSupplierSpecificRfq() {
  const supplierId = getSelectedSupplierId();
  const form = document.getElementById('rfqForm');

  if (!form || !supplierId) return;

  // Display the name immediately while the database lookup runs.
  if (initialRfqSupplierName) {
    renderSelectedSupplier(initialRfqSupplierName);
  }

  if (typeof getSupabaseClient !== 'function') return;

  try {
    const sb = await getSupabaseClient();
    await showSelectedSupplier(sb, supplierId);
  } catch (err) {
    console.error('Selected supplier could not be loaded:', err);

    const msg = document.getElementById('msg');

    if (msg) {
      msg.className = '';
      msg.textContent =
        err.message || 'Could not load the selected supplier.';
    }
  }
}

async function submitSupplier(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const msg = document.getElementById('supplierMsg');
  const button = form.querySelector('button[type="submit"]');

  if (msg) {
    msg.className = '';
    msg.textContent = 'Creating supplier profile…';
  }

  if (button) button.disabled = true;

  try {
    const sb = await getSupabaseClient();

    const { data: sessionData, error: sessionError } =
      await sb.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session || !sessionData.session.user) {
      throw new Error(
        'Please sign in before creating a supplier profile.'
      );
    }

    const formFields = form.querySelectorAll('input, select, textarea');

    const company = formFields[0].value.trim();
    const email = formFields[1].value.trim();
    const website = formFields[2].value.trim();
    const country = formFields[3].value.trim();
    const type = formFields[4].value;
    const capabilities = formFields[5].value.trim();

    if (!company || !email) {
      throw new Error(
        'Company name and business email are required.'
      );
    }

    const { data, error } = await sb.rpc('register_supplier', {
      p_company: company,
      p_email: email,
      p_website: website || null,
      p_country: country || null,
      p_type: type || null,
      p_capabilities: capabilities || null
    });

    if (error) throw error;

    const supplierId = data && data.id ? data.id : '';

    form.reset();

    if (msg) {
      msg.className = 'ok';
      msg.textContent =
        'Supplier profile created successfully. Reference: ' +
        supplierId;
    }
  } catch (err) {
    console.error('Supplier registration failed:', err);

    if (msg) {
      msg.className = '';
      msg.textContent =
        err.message || 'Could not create supplier profile.';
    }
  } finally {
    if (button) button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('rfqForm');
  if (f) f.addEventListener('submit', submitRfq);

  const s = document.getElementById('supplierForm');
  if (s) s.addEventListener('submit', submitSupplier);

  initialiseSupplierSpecificRfq();
});

function setPublicStat(label, value) {
  const target = String(label || '').trim().toLowerCase();

  if (!target) return;

  const idMap = {
    suppliers: ['supplierCount', 'suppliersCount'],
    'open rfqs': ['rfqCount', 'rfqsCount'],
    rfqs: ['rfqCount', 'rfqsCount'],
    jobs: ['jobCount', 'jobsCount']
  };

  for (const id of (idMap[target] || [])) {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = String(value);
      return;
    }
  }

  document.querySelectorAll('.stats > div').forEach(card => {
    const spans = Array.from(card.querySelectorAll('span'));
    const labels = spans.map(span => span.textContent.trim().toLowerCase());
    const cardText = card.textContent.trim().toLowerCase();

    const matches =
      (target === 'suppliers' &&
        (labels.includes('suppliers') || cardText.includes('suppliers'))) ||
      (target === 'open rfqs' &&
        (labels.includes('open rfqs') ||
          labels.includes('rfqs') ||
          cardText.includes('open rfqs') ||
          /\brfqs?\b/.test(cardText))) ||
      (target === 'rfqs' &&
        (labels.includes('rfqs') || cardText.includes('rfqs'))) ||
      (target === 'jobs' &&
        (labels.includes('jobs') || cardText.includes('jobs')));

    if (matches) {
      const number = card.querySelector('b');
      if (number) number.textContent = String(value);
    }
  });
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

document.addEventListener('DOMContentLoaded', loadPublicMarketplaceStats);
