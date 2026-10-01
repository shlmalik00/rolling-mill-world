function escapeHtml(value) {
return String(value == null ? '' : value)
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"')
.replace(/'/g, ''');
}

function formatDate(value) {
if (!value) return 'Unknown';

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return value;
}

return date.toLocaleDateString(undefined, {
year: 'numeric',
month: 'short',
day: 'numeric'
});
}

function statusLabel(status) {
const value = String(status || 'submitted');

return value.charAt(0).toUpperCase() +
value.slice(1);
}

function setLoading(message) {
const el = document.getElementById('loadingMessage');

if (el) {
el.textContent = message;
el.style.display = 'block';
}
}

function hideLoading() {
const el = document.getElementById('loadingMessage');

if (el) {
el.style.display = 'none';
}
}

function showMessage(message) {
const el = document.getElementById('statusMessage');

if (!el) return;

el.textContent = message;
el.className = 'statusMessage';
}

async function loadMyApplications() {
setLoading('Checking your sign-in...');

const sb = await getSupabaseClient();

const {
data: sessionData,
error: sessionError
} = await sb.auth.getSession();

if (sessionError) {
throw sessionError;
}

const session = sessionData?.session;

console.log(
'My Applications session:',
session ? 'SIGNED IN' : 'SIGNED OUT'
);

if (!session?.user) {
hideLoading();


showMessage(
  'Please sign in to view your job applications.'
);

return;


}

const user = session.user;

setLoading('Loading your Job Seeker profile...');

const {
data: seeker,
error: seekerError
} = await sb
.from('job_seekers')
.select('id, full_name, professional_title')
.eq('user_id', user.id)
.maybeSingle();

if (seekerError) {
throw seekerError;
}

console.log(
'Job seeker:',
seeker
);

if (!seeker) {
hideLoading();


showMessage(
  'No Job Seeker profile was found for this account.'
);

return;


}

setLoading('Loading your applications...');

const {
data: applications,
error: applicationsError
} = await sb
.from('job_applications')
.select(
'id, job_id, status, created_at, updated_at'
)
.eq('job_seeker_id', seeker.id)
.order('created_at', {
ascending: false
});

if (applicationsError) {
throw applicationsError;
}

console.log(
'Applications:',
applications
);

const content =
document.getElementById('applicationsContent');

const list =
document.getElementById('applicationList');

hideLoading();

if (!content || !list) {
throw new Error(
'Application page elements were not found.'
);
}

content.style.display = 'block';

if (!applications || applications.length === 0) {
list.innerHTML = ` <div class="card"> <h3>No applications yet</h3>


    <p>
      You have not applied for any jobs yet.
    </p>

    <a
      class="btn blue"
      href="jobs.html"
    >
      Find Jobs
    </a>
  </div>
`;

return;


}

setLoading('Loading job information...');

const jobIds = [
...new Set(
applications
.map(application => application.job_id)
.filter(Boolean)
)
];

const {
data: jobs,
error: jobsError
} = await sb
.from('jobs')
.select(
'id, title, location, country, employment_type, experience_required, company_id'
)
.in('id', jobIds);

if (jobsError) {
throw jobsError;
}

console.log(
'Jobs:',
jobs
);

const jobMap = new Map(
(jobs || []).map(job => [
job.id,
job
])
);

const companyIds = [
...new Set(
(jobs || [])
.map(job => job.company_id)
.filter(Boolean)
)
];

const companyMap = new Map();

if (companyIds.length > 0) {
setLoading('Loading company information...');


const {
  data: companies,
  error: companiesError
} = await sb
  .from('companies')
  .select('id, company_name')
  .in('id', companyIds);

if (!companiesError && companies) {
  companies.forEach(company => {
    companyMap.set(
      company.id,
      company.company_name
    );
  });
}


}

hideLoading();

list.innerHTML = applications.map(application => {


const job = jobMap.get(application.job_id);

if (!job) {
  return `
    <div class="card">
      <h3>Job no longer available</h3>

      <p>
        Applied:
        ${escapeHtml(
          formatDate(application.created_at)
        )}
      </p>

      <p>
        Status:
        <strong>
          ${escapeHtml(
            statusLabel(application.status)
          )}
        </strong>
      </p>
    </div>
  `;
}

const companyName =
  companyMap.get(job.company_id) ||
  'Rolling Mill World employer';

const location = [
  job.location,
  job.country
]
  .filter(Boolean)
  .join(', ');

return `
  <div class="card applicationCard">

    <div class="applicationHeader">

      <div>
        <h3>
          ${escapeHtml(job.title)}
        </h3>

        <p>
          ${escapeHtml(companyName)}
        </p>
      </div>

      <div class="applicationStatus">
        ${escapeHtml(
          statusLabel(application.status)
        )}
      </div>

    </div>

    <div class="applicationMeta">

      ${
        location
          ? `
            <span>
              <strong>Location:</strong>
              ${escapeHtml(location)}
            </span>
          `
          : ''
      }

      ${
        job.employment_type
          ? `
            <span>
              <strong>Employment:</strong>
              ${escapeHtml(job.employment_type)}
            </span>
          `
          : ''
      }

      ${
        job.experience_required
          ? `
            <span>
              <strong>Experience:</strong>
              ${escapeHtml(job.experience_required)}
            </span>
          `
          : ''
      }

      <span>
        <strong>Applied:</strong>
        ${escapeHtml(
          formatDate(application.created_at)
        )}
      </span>

    </div>

    <div class="applicationActions">

      <a
        class="btn blue"
        href="job-details.html?id=${encodeURIComponent(job.id)}"
      >
        View Job
      </a>

    </div>

  </div>
`;


}).join('');
}

async function initializeMyApplications() {
try {
showMessage('');


await loadMyApplications();


} catch (error) {


console.error(
  'My Applications error:',
  error
);

hideLoading();

showMessage(
  error.message ||
  'Could not load your applications.'
);


}
}

document.addEventListener(
'DOMContentLoaded',
async () => {


await refreshAuthUI();

await initializeMyApplications();

try {
  const sb = await getSupabaseClient();

  sb.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        'Auth event:',
        event
      );

      if (
        event === 'SIGNED_IN' &&
        session
      ) {
        await initializeMyApplications();
      }

      if (event === 'SIGNED_OUT') {
        window.location.reload();
      }
    }
  );

} catch (error) {
  console.error(
    'Could not initialize auth listener:',
    error
  );
}


}
);
