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
      msg.textContent =
        'RFQ submitted successfully. Reference: ' + data.id;
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
