async function getRfQClientAndUser() {
  if (typeof getSupabaseClient !== 'function') throw new Error('Authentication system is not available.');
  const sb = await getSupabaseClient();
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  if (!data.session || !data.session.user) {
    throw new Error('Please sign in before submitting an RFQ.');
  }
  return { sb, user: data.session.user };
}

async function getRfqSchema(sb) {
  const { data: cfg } = await (async () => {
    const res = await fetch('/api/config');
    return res.ok ? { data: await res.json() } : { data: null };
  })();
  if (!cfg || !cfg.url || !cfg.key) throw new Error('Supabase configuration is missing.');

  const res = await fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/', {
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key
    }
  });
  if (!res.ok) throw new Error('Could not inspect the RFQ database schema.');
  return await res.json();
}

function getRfqsDefinition(openapi) {
  const defs = openapi && openapi.definitions ? openapi.definitions : {};
  if (defs.rfqs) return defs.rfqs;
  if (defs.Rfqs) return defs.Rfqs;
  const paths = openapi && openapi.paths ? openapi.paths : {};
  const rfqPath = paths['/rfqs'];
  if (rfqPath && rfqPath.post && rfqPath.post.parameters) {
    const body = rfqPath.post.parameters.find(p => p && p.in === 'body');
    if (body && body.schema && body.schema.properties) return body.schema;
  }
  return null;
}

function propertyInfo(def, name) {
  return def && def.properties && def.properties[name] ? def.properties[name] : null;
}

function buildRfqPayload(def, values) {
  const props = def && def.properties ? def.properties : {};
  const payload = {};
  const has = name => Object.prototype.hasOwnProperty.call(props, name);
  const put = (name, value) => { if (has(name) && value !== undefined && value !== null && value !== '') payload[name] = value; };

  // Identity / ownership
  ['buyer_id', 'created_by', 'user_id'].forEach(k => put(k, values.userId));
  ['buyer_email', 'email', 'contact_email'].forEach(k => put(k, values.email));
  ['buyer_name', 'company_name', 'buyer_company', 'company'].forEach(k => put(k, values.company));

  // Core RFQ fields
  ['title', 'rfq_title', 'name'].forEach(k => put(k, values.title));
  ['description', 'technical_details', 'details', 'requirements', 'requirement', 'message'].forEach(k => put(k, values.details));
  ['delivery_country', 'country', 'destination_country'].forEach(k => put(k, values.country));

  // Category: use UUID when the schema expects an ID; otherwise use text.
  const catId = values.categoryId;
  if (catId) ['category_id', 'rfq_category_id'].forEach(k => put(k, catId));
  ['category', 'category_name', 'type'].forEach(k => {
    const info = propertyInfo(def, k);
    if (info && typeof info.type === 'string' && info.type === 'string') put(k, values.categoryLabel);
  });

  // Common optional commercial fields
  ['quantity', 'capacity'].forEach(k => put(k, values.capacity));
  ['consent_to_share', 'share_with_suppliers'].forEach(k => put(k, values.consent));
  ['status'].forEach(k => put(k, 'open'));

  return payload;
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
  const { data, error } = await sb.from('categories').select('id,name').eq('name', name).maybeSingle();
  if (error) return null;
  return data && data.id ? data.id : null;
}

async function submitRfq(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const msg = document.getElementById('msg');
  const button = form.querySelector('button[type="submit"]');
  if (msg) msg.textContent = 'Submitting RFQ…';
  if (button) button.disabled = true;

  try {
    const company = document.getElementById('rfqCompany').value.trim();
    const email = document.getElementById('rfqEmail').value.trim();
    const country = document.getElementById('rfqCountry').value.trim();
    const categoryLabel = document.getElementById('rfqCategory').value;
    const details = document.getElementById('rfqDetails').value.trim();
    const consent = document.getElementById('rfqConsent').checked;

    const { sb, user } = await getRfQClientAndUser();
    const categoryId = await findCategoryId(sb, categoryLabel);
    const schema = await getRfqSchema(sb);
    const def = getRfqsDefinition(schema);
    if (!def) throw new Error('Could not read the RFQ table schema.');

    const payload = buildRfqPayload(def, {
      userId: user.id,
      company,
      email,
      country,
      categoryId,
      categoryLabel,
      details,
      consent,
      title: 'Rolling Mill RFQ — ' + company
    });

    const { data, error } = await sb.from('rfqs').insert(payload).select('id').single();
    if (error) throw error;

    form.reset();
    if (msg) {
      msg.className = 'ok';
      msg.textContent = 'RFQ submitted successfully. Reference: ' + data.id;
    }
  } catch (err) {
    console.error('RFQ submission failed', err);
    if (msg) {
      msg.className = '';
      msg.textContent = err.message || 'Could not submit RFQ.';
    }
  } finally {
    if (button) button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('rfqForm');
  if (f) f.addEventListener('submit', submitRfq);
  const s = document.getElementById('supplierForm');
  if (s) s.onsubmit = e => {
    e.preventDefault();
    const el = document.getElementById('supplierMsg');
    if (el) el.textContent = 'Supplier profile captured in this prototype. Next step: connect supplier dashboard + database.';
  };
});
