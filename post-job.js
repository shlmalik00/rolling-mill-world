let postJobClient = null;

async function getPostJobClient() {
if (postJobClient) return postJobClient;

postJobClient = await getSupabaseClient();

return postJobClient;
}

function showJobMessage(message, ok = false) {
const el = document.getElementById('jobMsg');

if (!el) return;

el.textContent = message;
el.className = ok ? 'ok' : '';
}

async function getEmployerUser() {
const sb = await getPostJobClient();

const { data, error } = await sb.auth.getSession();

if (error) throw error;

if (!data.session || !data.session.user) {
throw new Error('Please sign in before posting a job.');
}

return {
sb,
user: data.session.user
};
}

async function submitJob(e) {
e.preventDefault();

const button = document.getElementById('postJobButton');

if (button) {
button.disabled = true;
button.textContent = 'Posting...';
}

showJobMessage('Posting your job...');

try {
const { sb, user } = await getEmployerUser();

const title = document.getElementById('title').value.trim();
const companyName = document.getElementById('companyName').value.trim();
const description = document.getElementById('description').value.trim();

if (!title) {
  throw new Error('Job title is required.');
}

if (!companyName) {
  throw new Error('Company name is required.');
}

if (!description) {
  throw new Error('Job description is required.');
}

const payload = {
  employer_user_id: user.id,
  title,
  description,
  location:
    document.getElementById('location').value.trim() || null,
  country:
    document.getElementById('country').value.trim() || null,
  employment_type:
    document.getElementById('employmentType').value || null,
  experience_required:
    document.getElementById('experienceRequired').value.trim() || null,
  skills_required:
    document.getElementById('skillsRequired').value.trim() || null,
  salary_range:
    document.getElementById('salaryRange').value.trim() || null,
  accommodation:
    document.getElementById('accommodation').value || null,
  application_deadline:
    document.getElementById('applicationDeadline').value || null,

  status: 'draft'
};

const { data, error } = await sb
  .from('jobs')
  .insert(payload)
  .select('id')
  .single();

if (error) throw error;

document.getElementById('postJobForm').reset();

showJobMessage(
  'Job saved successfully as a draft. Job ID: ' + data.id,
  true
);

} catch (err) {

console.error('Job posting failed:', err);

showJobMessage(
  err.message || 'Could not post the job.'
);

} finally {

if (button) {
  button.disabled = false;
  button.textContent = 'Post Job';
}

}
}

document.addEventListener('DOMContentLoaded', async () => {

const form = document.getElementById('postJobForm');

if (form) {
form.addEventListener('submit', submitJob);
}

try {
await getEmployerUser();
} catch (err) {
console.error(err);

showJobMessage(
  err.message || 'Please sign in to continue.'
);

}

});
