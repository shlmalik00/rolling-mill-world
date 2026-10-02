console.log("RMW JOBS JS v7 LOADED");

var jobsClient = null;
var allJobs = [];

function getJobsClient() {
if (jobsClient) {
return Promise.resolve(jobsClient);
}

return getSupabaseClient().then(function(client) {
jobsClient = client;
return client;
});
}

function escapeHtml(value) {
if (value === null || value === undefined) {
return '';
}

return String(value)
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"')
.replace(/'/g, ''');
}

function renderJobs(jobs) {
var results = document.getElementById('jobsResults');
var count = document.getElementById('jobsCount');

if (!results) {
return;
}

if (count) {
count.textContent =
jobs.length === 1
? '1 job found'
: jobs.length + ' jobs found';
}

if (jobs.length === 0) {
results.innerHTML =
'<section class="card">' +
'<h2>No jobs found</h2>' +
'<p>No published jobs match your search.</p>' +
'</section>';


return;


}

var html = '';

jobs.forEach(function(job) {


var location = [
  job.location,
  job.country
]
  .filter(Boolean)
  .join(', ');

html += '<article class="card">';

html += '<h2>' +
  escapeHtml(job.title) +
  '</h2>';

if (location) {
  html += '<p>' +
    '<strong>Location:</strong> ' +
    escapeHtml(location) +
    '</p>';
}

if (job.employment_type) {
  html += '<p>' +
    '<strong>Employment:</strong> ' +
    escapeHtml(job.employment_type) +
    '</p>';
}

if (job.experience_required) {
  html += '<p>' +
    '<strong>Experience:</strong> ' +
    escapeHtml(job.experience_required) +
    '</p>';
}

if (job.salary_range) {
  html += '<p>' +
    '<strong>Salary:</strong> ' +
    escapeHtml(job.salary_range) +
    '</p>';
}

if (job.description) {
  html += '<p>' +
    escapeHtml(job.description) +
    '</p>';
}

if (job.skills_required) {
  html += '<p>' +
    '<strong>Skills:</strong> ' +
    escapeHtml(job.skills_required) +
    '</p>';
}

if (job.accommodation) {
  html += '<p>' +
    '<strong>Accommodation:</strong> ' +
    escapeHtml(job.accommodation) +
    '</p>';
}

if (job.application_deadline) {
  html += '<p>' +
    '<strong>Application deadline:</strong> ' +
    escapeHtml(job.application_deadline) +
    '</p>';
}

html +=
  '<a class="btn blue" href="job-details.html?id=' +
  encodeURIComponent(job.id) +
  '">' +
  'View Job' +
  '</a>';

html += '</article>';


});

results.innerHTML = html;
}

function loadJobs() {
var results = document.getElementById('jobsResults');

if (results) {
results.innerHTML = '<p>Loading jobs...</p>';
}

getJobsClient()
.then(function(sb) {


  return sb
    .from('jobs')
    .select(
      'id, title, description, location, country, employment_type, experience_required, skills_required, salary_range, accommodation, application_deadline, created_at'
    )
    .eq('status', 'published')
    .order('created_at', {
      ascending: false
    });

})
.then(function(response) {

  if (response.error) {
    throw response.error;
  }

  allJobs = response.data || [];

  console.log(
    'PUBLISHED JOBS:',
    allJobs.length
  );

  renderJobs(allJobs);
})
.catch(function(error) {

  console.error(
    'Could not load jobs:',
    error
  );

  var count =
    document.getElementById('jobsCount');

  if (count) {
    count.textContent = '';
  }

  if (results) {
    results.innerHTML =
      '<section class="card">' +
        '<h2>Could not load jobs</h2>' +
        '<p>' +
          escapeHtml(
            error.message ||
            'Please try again.'
          ) +
        '</p>' +
      '</section>';
  }
});


}

function applyFilters() {

console.log('SEARCH JOBS CLICKED');

var search =
document.getElementById('search')
.value
.trim()
.toLowerCase();

var country =
document.getElementById('country')
.value
.trim()
.toLowerCase();

var location =
document.getElementById('location')
.value
.trim()
.toLowerCase();

var employment =
document.getElementById('employmentType')
.value;

var experience =
document.getElementById('experience')
.value;

var filteredJobs = allJobs.slice();

if (search) {
filteredJobs = filteredJobs.filter(function(job) {


  var text = [
    job.title,
    job.description,
    job.skills_required,
    job.experience_required,
    job.location,
    job.country
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.indexOf(search) !== -1;
});


}

if (country) {
filteredJobs = filteredJobs.filter(function(job) {
return String(job.country || '')
.toLowerCase()
.indexOf(country) !== -1;
});
}

if (location) {
filteredJobs = filteredJobs.filter(function(job) {
return String(job.location || '')
.toLowerCase()
.indexOf(location) !== -1;
});
}

if (employment) {
filteredJobs = filteredJobs.filter(function(job) {
return job.employment_type === employment;
});
}

if (experience) {


var minimum =
  parseInt(experience, 10);

filteredJobs = filteredJobs.filter(function(job) {

  var text =
    String(job.experience_required || '');

  var match =
    text.match(/[0-9]+/);

  if (!match) {
    return false;
  }

  var years =
    parseInt(match[0], 10);

  if (minimum === 0) {
    return years <= 2;
  }

  if (minimum === 3) {
    return years >= 3 && years <= 5;
  }

  if (minimum === 6) {
    return years >= 6 && years <= 10;
  }

  if (minimum === 11) {
    return years >= 11;
  }

  return true;
});


}

renderJobs(filteredJobs);
}

function clearFilters() {

console.log('CLEAR FILTERS CLICKED');

document.getElementById('search').value = '';
document.getElementById('country').value = '';
document.getElementById('location').value = '';
document.getElementById('employmentType').value = '';
document.getElementById('experience').value = '';

renderJobs(allJobs);
}

document.addEventListener(
'DOMContentLoaded',
function() {


console.log('RMW JOBS DOM READY');

var searchButton =
  document.getElementById('searchJobs');

var clearButton =
  document.getElementById('clearFilters');

console.log(
  'SEARCH BUTTON:',
  searchButton
);

console.log(
  'CLEAR BUTTON:',
  clearButton
);

if (searchButton) {
  searchButton.onclick = applyFilters;
}

if (clearButton) {
  clearButton.onclick = clearFilters;
}

document.getElementById('search')
  .onkeydown = function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFilters();
    }
  };

document.getElementById('country')
  .onkeydown = function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFilters();
    }
  };

document.getElementById('location')
  .onkeydown = function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFilters();
    }
  };

loadJobs();


}
);
