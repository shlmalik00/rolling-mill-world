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

function getExperienceNumber(value) {
if (!value) return null;

const text = String(value).toLowerCase();

const match = text.match(/\d+/);

if (!match) return null;

return parseInt(match[0], 10);
}

async function loadJobs() {
const results = document.getElementById('jobsResults');
const count = document.getElementById('jobsCount');

if (!results) return;

results.innerHTML = '<p>Loading jobs...</p>';

try {
const sb = await getJobsClient();


const search = document
  .getElementById('search')
  .value
  .trim()
  .toLowerCase();

const country = document
  .getElementById('country')
  .value
  .trim()
  .toLowerCase();

const locationFilter = document
  .getElementById('location')
  .value
  .trim()
  .toLowerCase();

const employmentType =
  document.getElementById('employmentType').value;

const experienceFilter =
  document.getElementById('experience').value;

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

/*
 * Keyword search
 */
if (search) {
  jobs = jobs.filter(job => {
    const text = [
      job.title,
      job.description,
      job.skills_required,
      job.experience_required,
      job.location,
      job.country,
      job.employment_type,
      job.salary_range
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return text.includes(search);
  });
}

/*
 * Country filter
 */
if (country) {
  jobs = jobs.filter(job =>
    (job.country || '')
      .toLowerCase()
      .includes(country)
  );
}

/*
 * Location filter
 */
if (locationFilter) {
  jobs = jobs.filter(job =>
    (job.location || '')
      .toLowerCase()
      .includes(locationFilter)
  );
}

/*
 * Employment type filter
 */
if (employmentType) {
  jobs = jobs.filter(job =>
    job.employment_type === employmentType
  );
}

/*
 * Experience filter
 */
if (experienceFilter) {
  const minimumExperience =
    parseInt(experienceFilter, 10);

  jobs = jobs.filter(job => {
    const years =
      getExperienceNumber(
        job.experience_required
      );

    if (years === null) {
      return false;
    }

    if (minimumExperience === 0) {
      return years <= 2;
    }

    if (minimumExperience === 3) {
      return years >= 3 && years <= 5;
    }

    if (minimumExperience === 6) {
      return years >= 6 && years <= 10;
    }

    if (minimumExperience === 11) {
      return years >= 11;
    }

    return true;
  });
}

/*
 * Result count
 */
count.textContent =
  jobs.length === 1
    ? '1 job found'
    : `${jobs.length} jobs found`;

/*
 * No results
 */
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

/*
 * Render jobs
 */
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


if (count) {
  count.textContent = '';
}

results.innerHTML = `
  <section class="card">
    <h2>Could not load jobs</h2>
    <p>
      ${escapeHtml(err.message || 'Please try again.')}
    </p>
  </section>
`;


}
}

function clearFilters() {
document.getElementById('search').value = '';
document.getElementById('country').value = '';
document.getElementById('location').value = '';
document.getElementById('employmentType').value = '';
document.getElementById('experience').value = '';

loadJobs();
}

document.addEventListener('DOMContentLoaded', async () => {

const searchButton =
document.getElementById('searchJobs');

const clearButton =
document.getElementById('clearFilters');

if (searchButton) {
searchButton.addEventListener(
'click',
loadJobs
);
}

if (clearButton) {
clearButton.addEventListener(
'click',
clearFilters
);
}

/*

* Press Enter in a filter field
* to search.
  */
  const filterFields = [
  'search',
  'country',
  'location'
  ];

filterFields.forEach(id => {
const field =
document.getElementById(id);


if (field) {
  field.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadJobs();
      }
    }
  );
}


});

await loadJobs();
});
