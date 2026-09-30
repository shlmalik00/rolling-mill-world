let postJobClient = null;

async function getPostJobClient() {
if (postJobClient) return postJobClient;

if (typeof getSupabaseClient !== 'function') {
throw new Error('Authentication system is not available.');
}

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

try {


if (button) {
  button.disabled = true;
  button.textContent = 'Posting...';
}

showJobMessage('Posting your job...');

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
  title: title,
  description: description,
  location: document.getElementById('location').value.trim() || null,
  country: document.getElementById('country').value.trim() || null,
  employment_type: document.getElementById('employmentType').value || null,
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

console.log('Submitting job:', payload);

const { data, error } = await sb
  .from('jobs')
  .insert(payload)
  .select('id, title, status')
  .single();

if (error) {
  console.error('Supabase job error:', error);
  throw new Error(error.message);
}

console.log('Job created:', data);

document.getElementById('postJobForm').reset();

showJobMessage(
  'Job saved successfully as a draft. Job ID: ' + data.id,
  true
);


} catch (err) {


console.error('Post Job failed:', err);

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

document.addEventListener('DOMContentLoaded', () => {

const form = document.getElementById('postJobForm');

if (!form) {
console.error('postJobForm was not found.');
return;
}

console.log('Post Job form ready.');

form.addEventListener('submit', submitJob);

});
