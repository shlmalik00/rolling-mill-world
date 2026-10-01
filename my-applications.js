console.log('MY APPLICATIONS JS LOADED');

document.addEventListener('DOMContentLoaded', function () {
console.log('MY APPLICATIONS DOM READY');

startMyApplications();
});

async function startMyApplications() {
try {
var loading = document.getElementById('loadingMessage');


if (loading) {
  loading.textContent = 'Checking your sign-in...';
  loading.style.display = 'block';
}

var sb = await getSupabaseClient();

console.log('SUPABASE CLIENT READY');

var result = await sb.auth.getSession();

if (result.error) {
  throw result.error;
}

var session = result.data.session;

console.log(
  'SESSION:',
  session ? 'SIGNED IN' : 'SIGNED OUT'
);

if (!session) {
  if (loading) {
    loading.style.display = 'none';
  }

  var message = document.getElementById('statusMessage');

  if (message) {
    message.textContent =
      'Please sign in to view your job applications.';
  }

  return;
}

if (loading) {
  loading.textContent =
    'Loading your Job Seeker profile...';
}

var seekerResult = await sb
  .from('job_seekers')
  .select('id, full_name, professional_title')
  .eq('user_id', session.user.id)
  .maybeSingle();

if (seekerResult.error) {
  throw seekerResult.error;
}

console.log(
  'JOB SEEKER:',
  seekerResult.data
);

if (!seekerResult.data) {
  if (loading) {
    loading.style.display = 'none';
  }

  var profileMessage =
    document.getElementById('statusMessage');

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

var applicationsResult = await sb
  .from('job_applications')
  .select(
    'id, job_id, status, created_at'
  )
  .eq(
    'job_seeker_id',
    seekerResult.data.id
  )
  .order(
    'created_at',
    { ascending: false }
  );

if (applicationsResult.error) {
  throw applicationsResult.error;
}

console.log(
  'APPLICATIONS:',
  applicationsResult.data
);

if (loading) {
  loading.style.display = 'none';
}

var content =
  document.getElementById('applicationsContent');

var list =
  document.getElementById('applicationList');

if (!content || !list) {
  throw new Error(
    'applicationList or applicationsContent was not found.'
  );
}

content.style.display = 'block';

var applications =
  applicationsResult.data || [];

if (applications.length === 0) {
  list.innerHTML =
    '<div class="card">' +
    '<h3>No applications yet</h3>' +
    '<p>You have not applied for any jobs yet.</p>' +
    '<a class="btn blue" href="jobs.html">Find Jobs</a>' +
    '</div>';

  return;
}

var jobIds = applications.map(
  function (application) {
    return application.job_id;
  }
);

var jobsResult = await sb
  .from('jobs')
  .select(
    'id, title, location, country, employment_type, experience_required'
  )
  .in('id', jobIds);

if (jobsResult.error) {
  throw jobsResult.error;
}

var jobs = jobsResult.data || [];

console.log(
  'JOBS:',
  jobs
);

var jobMap = {};

jobs.forEach(
  function (job) {
    jobMap[job.id] = job;
  }
);

list.innerHTML = applications.map(
  function (application) {

    var job =
      jobMap[application.job_id];

    if (!job) {
      return (
        '<div class="card">' +
        '<h3>Job no longer available</h3>' +
        '<p>Status: ' +
        String(application.status || 'submitted') +
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
      (location || '') +
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


} catch (error) {


console.error(
  'MY APPLICATIONS ERROR:',
  error
);

var loadingError =
  document.getElementById('loadingMessage');

if (loadingError) {
  loadingError.style.display = 'none';
}

var status =
  document.getElementById('statusMessage');

if (status) {
  status.textContent =
    error.message ||
    'Could not load your applications.';
}


}
}
