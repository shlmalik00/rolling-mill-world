console.log('MY APPLICATIONS JS v13 LOADED');

var myApplicationsSupabase = null;

async function getMyApplicationsSupabase() {
if (myApplicationsSupabase) {
return myApplicationsSupabase;
}

var response = await fetch('/api/config');

if (!response.ok) {
throw new Error(
'Could not load Supabase configuration.'
);
}

var config = await response.json();

if (!config.url || !config.key) {
throw new Error(
'Supabase configuration is missing.'
);
}

if (!window.supabase) {
throw new Error(
'Supabase library did not load.'
);
}

myApplicationsSupabase =
window.supabase.createClient(
config.url,
config.key
);

return myApplicationsSupabase;
}

document.addEventListener(
'DOMContentLoaded',
async function () {


console.log(
  'MY APPLICATIONS DOM READY'
);

try {
  await loadMyApplications();

} catch (error) {

  console.error(
    'MY APPLICATIONS ERROR:',
    error
  );

  var loading =
    document.getElementById(
      'loadingMessage'
    );

  if (loading) {
    loading.style.display = 'none';
  }

  var message =
    document.getElementById(
      'statusMessage'
    );

  if (message) {
    message.textContent =
      error.message ||
      'Could not load your applications.';
  }
}


}
);

async function loadMyApplications() {

var loading =
document.getElementById(
'loadingMessage'
);

if (loading) {
loading.textContent =
'Checking your sign-in...';
loading.style.display = 'block';
}

var sb =
await getMyApplicationsSupabase();

console.log(
'SUPABASE CLIENT READY'
);

var sessionResult =
await sb.auth.getSession();

if (sessionResult.error) {
throw sessionResult.error;
}

var session =
sessionResult.data.session;

console.log(
'SESSION:',
session ? 'SIGNED IN' : 'SIGNED OUT'
);

if (!session) {


if (loading) {
  loading.style.display = 'none';
}

var message =
  document.getElementById(
    'statusMessage'
  );

if (message) {
  message.innerHTML =
    'Please sign in to view your job applications.' +
    ' <a href="javascript:openApplicationsLogin()">Sign In</a>';
}

return;


}

if (loading) {
loading.textContent =
'Loading your Job Seeker profile...';
}

var seekerResult =
await sb
.from('job_seekers')
.select(
'id, full_name, professional_title'
)
.eq(
'user_id',
session.user.id
)
.maybeSingle();

if (seekerResult.error) {
throw seekerResult.error;
}

var seeker =
seekerResult.data;

console.log(
'JOB SEEKER:',
seeker
);

if (!seeker) {


if (loading) {
  loading.style.display = 'none';
}

var profileMessage =
  document.getElementById(
    'statusMessage'
  );

if (profileMessage) {
  profileMessage.textContent =
    'No Job Seeker profile was found for this account.';
}

return;


}

if (loading) {
loading.textContent =
'Loading your applications...';
}

var applicationsResult =
await sb
.from('job_applications')
.select(
'id, job_id, status, created_at'
)
.eq(
'job_seeker_id',
seeker.id
)
.order(
'created_at',
{
ascending: false
}
);

if (applicationsResult.error) {
throw applicationsResult.error;
}

var applications =
applicationsResult.data || [];

console.log(
'APPLICATIONS:',
applications
);

if (loading) {
loading.style.display = 'none';
}

var content =
document.getElementById(
'applicationsContent'
);

var list =
document.getElementById(
'applicationList'
);

if (!content || !list) {
throw new Error(
'Application page elements were not found.'
);
}

content.style.display = 'block';

if (applications.length === 0) {


list.innerHTML =
  '<div class="card">' +
  '<h3>No applications yet</h3>' +
  '<p>You have not applied for any jobs yet.</p>' +
  '<a class="btn blue" href="jobs.html">' +
  'Find Jobs' +
  '</a>' +
  '</div>';

return;


}

var jobIds =
applications.map(
function (application) {
return application.job_id;
}
);

var jobsResult =
await sb
.from('jobs')
.select(
'id, title, location, country, employment_type, experience_required'
)
.in(
'id',
jobIds
);

if (jobsResult.error) {
throw jobsResult.error;
}

var jobs =
jobsResult.data || [];

var jobMap = {};

jobs.forEach(
function (job) {
jobMap[job.id] = job;
}
);

list.innerHTML =
applications.map(
function (application) {


    var job =
      jobMap[application.job_id];

    if (!job) {

      return (
        '<div class="card">' +
        '<h3>Job no longer available</h3>' +
        '<p>Status: ' +
        (application.status || 'submitted') +
        '</p>' +
        '</div>'
      );
    }

    var location = '';

    if (job.location) {
      location = job.location;
    }

    if (job.country) {

      if (location) {
        location += ', ';
      }

      location += job.country;
    }

    var appliedDate =
      new Date(
        application.created_at
      ).toLocaleDateString();

    return (
      '<div class="card applicationCard">' +

      '<h3>' +
      job.title +
      '</h3>' +

      '<p>' +
      location +
      '</p>' +

      '<p>' +
      '<strong>Employment:</strong> ' +
      (job.employment_type || '') +
      '</p>' +

      '<p>' +
      '<strong>Experience:</strong> ' +
      (job.experience_required || '') +
      '</p>' +

      '<p>' +
      '<strong>Applied:</strong> ' +
      appliedDate +
      '</p>' +

      '<p>' +
      '<strong>Status:</strong> ' +
      (application.status || 'submitted') +
      '</p>' +

      '<a class="btn blue" href="job-details.html?id=' +
      encodeURIComponent(job.id) +
      '">' +
      'View Job' +
      '</a>' +

      '</div>'
    );
  }
).join('');


}

function openApplicationsLogin() {

alert(
'Please use My Account to sign in, then return to My Applications.'
);

window.location.href =
'account.html';
}
