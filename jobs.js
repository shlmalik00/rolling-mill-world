console.log("RMW JOBS JS v4 LOADED");

let jobsClient = null;

async function getJobsClient() {
if (jobsClient) {
return jobsClient;
}

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
if (!value) {
return null;
}

const match = String(value).match(/\d+/);

if (!match) {
return null;
}

return parseInt(match[0], 10);
}

async function loadJobs() {
const results = document.getElementById('jobsResults');
const count = document.getElementById('jobsCount');

if (!results) {
return;
}

results.innerHTML = '<p>Loading jobs...</p>';

try {
const sb = await getJobsClient();


const searchInput = document.getElementById('search');
const countryInput = document.getElementById('country');
const locationInput = document.getElementById('location');
const employmentInput = document.getElementById('employmentType');
const experienceInput = document.getElementById('experience');

const search = searchInput.value.trim().toLowerCase();
const country = countryInput.value.trim().toLowerCase();
const locationFilter = locationInput.value.trim().toLowerCase();
const employmentType = employmentInput.value;
const experienceFilter = experienceInput.value;

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

if (error) {
  throw error;
}

let jobs = data || [];

if (search) {
  jobs = jobs.filter(function (job) {
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

if (country) {
  jobs = jobs.filter(function (job) {
    return String(job.country || '')
      .toLowerCase()
      .includes(country);
  });
}

if (locationFilter) {
  jobs = jobs.filter(function (job) {
    return String(job.location || '')
      .toLowerCase()
      .includes(locationFilter);
  });
}

if (employmentType) {
  jobs = jobs.filter(function (job) {
    return job.employment_type === employmentType;
  });
}

if (experienceFilter) {
  const minimumExperience = parseInt(
    experienceFilter,
    10
  );

  jobs = jobs.filter(function (job) {
    const years = getExperienceNumber(
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

if (count) {
  count.textContent =
    jobs.length === 1
      ? '1 job found'
      : jobs.length + ' jobs found';
}

if (!jobs.length) {
  results.innerHTML = `
    <section class="card">
      <h2>No jobs found</h2>
      <p>No published jobs match your search.</p>
    </section>
  `;

  return;
}

results.innerHTML = jobs.map(function (job) {
  const location = [
    job.location,
    job.country
  ]
    .filter(Boolean)
    .join(', ');

  let html = '<article class="card">';

  html += '<h2>' +
    escapeHtml(job.title) +
    '</h2>';

  if (location) {
    html += '<p><strong>Location:</strong> ' +
      escapeHtml(location) +
      '</p>';
  }

  if (job.employment_type) {
    html += '<p><strong>Employment:</strong> ' +
      escapeHtml(job.employment_type) +
      '</p>';
  }

  if (job.experience_required) {
    html += '<p><strong>Experience:</strong> ' +
      escapeHtml(job.experience_required) +
      '</p>';
  }

  if (job.salary_range) {
    html += '<p><strong>Salary:</strong> ' +
      escapeHtml(job.salary_range) +
      '</p>';
  }

  if (job.description) {
    html += '<p>' +
      escapeHtml(job.description) +
      '</p>';
  }

  if (job.skills_required) {
    html += '<p><strong>Skills:</strong> ' +
      escapeHtml(job.skills_required) +
      '</p>';
  }

  if (job.accommodation) {
    html += '<p><strong>Accommodation:</strong> ' +
      escapeHtml(job.accommodation) +
      '</p>';
  }

  if (job.application_deadline) {
    html += '<p><strong>Application deadline:</strong> ' +
      escapeHtml(job.application_deadline) +
      '</p>';
  }

  html += '<a class="btn blue" href="job-details.html?id=' +
    encodeURIComponent(job.id) +
    '">View Job</a>';

  html += '</article>';

  return html;
}).join('');


} catch (err) {
console.error('Could not load jobs:', err);


if (count) {
  count.textContent = '';
}

results.innerHTML = `
  <section class="card">
    <h2>Could not load jobs</h2>
    <p>${escapeHtml(
      err.message || 'Please try again.'
    )}</p>
  </section>
`;


}
}

function clearFilters() {
console.log('CLEAR FILTERS CLICKED');

document.getElementById('search').value = '';
document.getElementById('country').value = '';
document.getElementById('location').value = '';
document.getElementById('employmentType').value = '';
document.getElementById('experience').value = '';

loadJobs();
}

document.addEventListener('DOMContentLoaded', function () {
console.log('JOBS DOM READY');

const searchButton =
document.getElementById('searchJobs');

const clearButton =
document.getElementById('clearFilters');

console.log('SEARCH BUTTON:', searchButton);
console.log('CLEAR BUTTON:', clearButton);

if (searchButton) {
searchButton.addEventListener(
'click',
function () {
console.log('SEARCH JOBS CLICKED');
loadJobs();
}
);
}

if (clearButton) {
clearButton.addEventListener(
'click',
function () {
clearFilters();
}
);
}

const filterFields = [
'search',
'country',
'location'
];

filterFields.forEach(function (id) {
const field = document.getElementById(id);


if (field) {
  field.addEventListener(
    'keydown',
    function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadJobs();
      }
    }
  );
}


});

loadJobs();
});
