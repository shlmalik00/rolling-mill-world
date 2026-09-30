let jobsClient = null;

async function getJobsClient() {
if (jobsClient) return jobsClient;

jobsClient = await getSupabaseClient();

return jobsClient;
}

function escapeHtml(value) {
return String(value ?? '')
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"')
.replace(/'/g, ''');
}

async function loadJobs() {

const results = document.getElementById('jobsResults');
const count = document.getElementById('jobsCount');

if (!results) return;

results.innerHTML = '<p>Loading jobs...</p>';

try {

const sb = await getJobsClient();

const search =
  document.getElementById('search').value.trim().toLowerCase();

const country =
  document.getElementById('country').value.trim().toLowerCase();

const employmentType =
  document.getElementById('employmentType').value;

const { data, error } = await sb
  .from('jobs')
  .select(`
    id,
    title,
    description,
    location,
    country,
    employment_type,
    experience_required,
    skills_required,
    salary_range,
    accommodation,
    application_deadline,
    created_at
  `)
  .eq('status', 'published')
  .order('created_at', { ascending: false });

if (error) throw error;

let jobs = data || [];

if (search) {
  jobs = jobs.filter(job => {

    const text = [
      job.title,
      job.description,
      job.skills_required,
      job.experience_required
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return text.includes(search);
  });
}

if (country) {
  jobs = jobs.filter(job =>
    (job.country || '').toLowerCase().includes(country)
  );
}

if (employmentType) {
  jobs = jobs.filter(job =>
    job.employment_type === employmentType
  );
}

count.textContent =
  jobs.length + (jobs.length === 1 ? ' job found' : ' jobs found');

if (!jobs.length) {
  results.innerHTML = `
    <section class="card">
      <h2>No jobs found</h2>
      <p>
        No published jobs match your search.
      </p>
    </section>
  `;

  return;
}

results.innerHTML = jobs.map(job => {

  const location = [
    job.location,
    job.country
  ]
    .filter(Boolean)
    .join(', ');

  return `
    <article class="card">

      <h2>${escapeHtml(job.title)}</h2>

      ${
        location
          ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>`
          : ''
      }

      ${
        job.employment_type
          ? `<p><strong>Employment:</strong> ${escapeHtml(job.employment_type)}</p>`
          : ''
      }

      ${
        job.experience_required
          ? `<p><strong>Experience:</strong> ${escapeHtml(job.experience_required)}</p>`
          : ''
      }

      ${
        job.salary_range
          ? `<p><strong>Salary:</strong> ${escapeHtml(job.salary_range)}</p>`
          : ''
      }

      <p>
        ${escapeHtml(job.description)}
      </p>

      ${
        job.skills_required
          ? `<p><strong>Skills:</strong> ${escapeHtml(job.skills_required)}</p>`
          : ''
      }

      ${
        job.accommodation
          ? `<p><strong>Accommodation:</strong> ${escapeHtml(job.accommodation)}</p>`
          : ''
      }

      ${
        job.application_deadline
          ? `<p><strong>Application deadline:</strong> ${escapeHtml(job.application_deadline)}</p>`
          : ''
      }

      <a
        class="btn blue"
        href="job-details.html?id=${encodeURIComponent(job.id)}"
      >
        View Job
      </a>

    </article>
  `;

}).join('');

} catch (err) {

console.error('Could not load jobs:', err);

count.textContent = '';

results.innerHTML = `
  <section class="card">
    <h2>Could not load jobs</h2>
    <p>${escapeHtml(err.message || 'Please try again.')}</p>
  </section>
`;

}
}

document.addEventListener('DOMContentLoaded', async () => {

const searchButton = document.getElementById('searchJobs');

if (searchButton) {
searchButton.addEventListener('click', loadJobs);
}

await loadJobs();

});
