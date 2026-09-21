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

  return {
    sb,
    user: data.session.user
  };
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
    const categoryMap = {
  'Complete rolling mill': '00dcae93-6a04-4ec2-9f18-0f6680b175a2',
  'Spare parts': '297c4c57-c260-464a-93d8-7a965c47e1d3',
  'Machinery': 'c229a626-7474-457c-8c00-e1533d5a1fcc',
  'Used machinery': 'e0a278b3-42c8-43d1-8edd-50c80ec3ce06',
  'Service / maintenance': '7e84ad76-f1d6-4ced-8b17-b2e2cf211e90'
};

const categoryId = categoryMap[categoryLabel];
    const details = document.getElementById('rfqDetails').value.trim();
    const consent = document.getElementById('rfqConsent').checked;

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

    const { data, error } = await sb
      .from('rfqs')
      .insert(payload)
      .select('id')
      .single();

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

  if (f) {
    f.addEventListener('submit', submitRfq);
  }
});
