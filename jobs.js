console.log("RMW JOBS JS v5 LOADED");

var jobsClient = null;

function getJobsClient() {
if (jobsClient) {
return Promise.resolve(jobsClient);
}

return getSupabaseClient().then(function(client) {
jobsClient = client;
return jobsClient;
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

function getExperienceNumber(value) {
if (!value) {
return null;
}

var match = String(value).match(/[0-9]+/);

if (!match) {
return null;
}

return parseInt(match[0], 10);
}

function loadJobs() {
var results = document.getElementById('jobsResults');
var count = document.getElementById('jobsCount');

if (!results) {
return;
}

results.innerHTML = '<p>Loading jobs...</p>';

getJobsClient()
.then(function(sb) {


  var searchElement =
    document.getElementById('search');

  var countryElement =
    document.getElementById('country');

  var locationElement =
    document.getElementById('location');

  var employmentElement =
    document.getElementById('employmentType');

  var experienceElement =
    document.getElementById('experience');

  var search =
    searchElement.value.trim().toLowerCase();

  var country =
    countryElement.value.trim().toLowerCase();

  var locationFilter =
    locationElement.value.trim().toLowerCase();

  var employmentType =
    employmentElement.value;

  var experienceFilter =
    experienceElement.value;

  return sb
    .from('jobs')
    .select(
      'id, title, description, location, country, employment_type, experience_required, skills_required, salary_range, accommodation, application_deadline, created_at'
    )
    .eq('status', 'published')
    .order('created_at', {
      ascending: false
    })
    .then(function(response) {

      if (response.error) {
        throw response.error;
      }

      var jobs = response.data || [];

      if (search) {
        jobs = jobs.filter(function(job) {

          var text = [
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

          return text.indexOf(search) !== -1;
        });
      }

      if (country) {
        jobs = jobs.filter(function(job) {
          return String(job.country || '')
            .toLowerCase()
            .indexOf(country) !== -1;
        });
      }

      if (locationFilter) {
        jobs = jobs.filter(function(job) {
          return String(job.location || '')
            .toLowerCase()
            .indexOf(locationFilter) !== -1;
        });
      }

      if (employmentType) {
        jobs = jobs.filter(function(job) {
          return job.employment_type === employmentType;
        });
      }

      if (experienceFilter) {

        var minimumExperience =
          parseInt(experienceFilter, 10);

        jobs = jobs.filter(function(job) {

          var years =
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

      if (count) {
        if (jobs.length === 1) {
          count.textContent = '1 job found';
        } else {
          count.textContent =
            jobs.length + ' jobs found';
        }
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
    });
})
.catch(function(error) {

  console.error(
    'Could not load jobs:',
    error
  );

  if (count) {
    count.textContent = '';
  }

  results.innerHTML =
    '<section class="card">' +
      '<h2>Could not load jobs</h2>' +
      '<p>' +
      escapeHtml(
        error.message || 'Please try again.'
      ) +
      '</p>' +
    '</section>';
});


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

document.addEventListener(
'DOMContentLoaded',
function() {


console.log('JOBS DOM READY');

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
  searchButton.addEventListener(
    'click',
    function() {
      console.log('SEARCH JOBS CLICKED');
      loadJobs();
    }
  );
}

if (clearButton) {
  clearButton.addEventListener(
    'click',
    function() {
      clearFilters();
    }
  );
}

document
  .getElementById('search')
  .addEventListener(
    'keydown',
    function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadJobs();
      }
    }
  );

document
  .getElementById('country')
  .addEventListener(
    'keydown',
    function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadJobs();
      }
    }
  );

document
  .getElementById('location')
  .addEventListener(
    'keydown',
    function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadJobs();
      }
    }
  );

loadJobs();


}
);
