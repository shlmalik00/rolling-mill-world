let applicationsSupabase = null;
let currentUser = null;
let currentJobSeeker = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showError(message) {
  const status =
    document.getElementById('statusMessage');

  if (status) {
    status.textContent = message;
    status.className =
      'status-message show error';
  }

  console.error(
    'MY APPLICATIONS ERROR:',
    message
  );
}

function showContent() {
  const loading =
    document.getElementById('loadingMessage');

  const content =
    document.getElementById('applicationsContent');

  if (loading) {
    loading.style.display = 'none';
  }

  if (content) {
    content.style.display = 'block';
  }
}

async function initializeSupabase() {
  if (
    typeof getSupabaseClient !== 'function'
  ) {
    throw new Error(
      'auth.js did not load correctly.'
    );
  }

  applicationsSupabase =
    await getSupabaseClient();

  return applicationsSupabase;
}

async function getCurrentUser() {
  const { data, error } =
    await applicationsSupabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (
    !data.session ||
    !data.session.user
  ) {
    return null;
  }

  return data.session.user;
}

async function loadJobSeeker() {
  const { data, error } =
    await applicationsSupabase
      .from('job_seekers')
      .select(`
        id,
        full_name
      `)
      .eq(
        'user_id',
        currentUser.id
      )
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  currentJobSeeker = data;

  return data;
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
}

function renderNotSignedIn() {
  const list =
    document.getElementById(
      'applicationList'
    );

  if (!list) {
    return;
  }

  list.innerHTML = `
    <div class="empty-state">

      <h2>Sign in required</h2>

      <p>
        Please sign in to view your job applications.
      </p>

      <div class="application-actions">

        <button
          type="button"
          class="btn blue"
          id="applicationsLoginButton"
        >
          Sign In
        </button>

        <a
          href="jobs.html"
          class="btn gray"
        >
          Find Jobs
        </a>

      </div>

    </div>
  `;

  const button =
    document.getElementById(
      'applicationsLoginButton'
    );

  if (button) {
    button.addEventListener(
      'click',
      function () {

        if (
          typeof openAuth === 'function'
        ) {
          openAuth('login');
        } else {
          console.error(
            'openAuth() is not available.'
          );
        }

      }
    );
  }
}

function renderNoProfile() {
  const list =
    document.getElementById(
      'applicationList'
    );

  if (!list) {
    return;
  }

  list.innerHTML = `
    <div class="empty-state">

      <h2>Job seeker profile required</h2>

      <p>
        Create your job seeker profile before applying
        for jobs.
      </p>

      <a
        href="job-seeker.html"
        class="btn blue"
      >
        Create Job Seeker Profile
      </a>

    </div>
  `;
}

function renderEmptyApplications() {
  const list =
    document.getElementById(
      'applicationList'
    );

  if (!list) {
    return;
  }

  list.innerHTML = `
    <div class="empty-state">

      <h2>No applications yet</h2>

      <p>
        You have not applied for any jobs yet.
      </p>

      <a
        href="jobs.html"
        class="btn blue"
      >
        Find Jobs
      </a>

    </div>
  `;
}

async function loadApplications() {

  const { data, error } =
    await applicationsSupabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        status,
        created_at
      `)
      .eq(
        'job_seeker_id',
        currentJobSeeker.id
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    renderEmptyApplications();
    return;
  }

  const jobIds =
    data.map(
      application => application.job_id
    );

  const { data: jobs, error: jobsError } =
    await applicationsSupabase
      .from('jobs')
      .select(`
        id,
        title,
        location,
        country,
        employment_type,
        company_id
      `)
      .in(
        'id',
        jobIds
      );

  if (jobsError) {
    throw new Error(
      jobsError.message
    );
  }

  const jobMap =
    new Map(
      (jobs || []).map(
        job => [job.id, job]
      )
    );

  const companyIds =
    (jobs || [])
      .map(job => job.company_id)
      .filter(Boolean);

  let companies = [];

  if (companyIds.length > 0) {

    const { data: companyData, error: companyError } =
      await applicationsSupabase
        .from('companies')
        .select(`
          id,
          company_name
        `)
        .in(
          'id',
          companyIds
        );

    if (companyError) {
      throw new Error(
        companyError.message
      );
    }

    companies =
      companyData || [];
  }

  const companyMap =
    new Map(
      companies.map(
        company => [
          company.id,
          company.company_name
        ]
      )
    );

  const list =
    document.getElementById(
      'applicationList'
    );

  if (!list) {
    return;
  }

  list.innerHTML =
    data.map(
      application => {

        const job =
          jobMap.get(
            application.job_id
          );

        if (!job) {
          return `
            <div class="application-item">

              <h2>Job no longer available</h2>

              <div class="application-meta">
                <div>
                  <strong>Status:</strong>
                  <span class="application-status">
                    ${escapeHtml(
                      application.status ||
                      'submitted'
                    )}
                  </span>
                </div>

                <div>
                  <strong>Applied:</strong>
                  ${escapeHtml(
                    formatDate(
                      application.created_at
                    )
                  )}
                </div>
              </div>

            </div>
          `;
        }

        const companyName =
          companyMap.get(
            job.company_id
          ) ||
          'Company not specified';

        return `
          <div class="application-item">

            <h2>
              ${escapeHtml(
                job.title ||
                'Untitled Job'
              )}
            </h2>

            <div class="application-company">
              ${escapeHtml(
                companyName
              )}
            </div>

            <div class="application-meta">

              <div>
                <strong>Location:</strong>
                ${escapeHtml(
                  [
                    job.location,
                    job.country
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                  'Not specified'
                )}
              </div>

              <div>
                <strong>Employment:</strong>
                ${escapeHtml(
                  job.employment_type ||
                  'Not specified'
                )}
              </div>

              <div>
                <strong>Applied:</strong>
                ${escapeHtml(
                  formatDate(
                    application.created_at
                  )
                )}
              </div>

              <div>
                <strong>Status:</strong>
                <span class="application-status">
                  ${escapeHtml(
                    application.status ||
                    'submitted'
                  )}
                </span>
              </div>

            </div>

            <div class="application-actions">

              <a
                href="job-details.html?id=${encodeURIComponent(
                  job.id
                )}"
                class="btn blue"
              >
                View Job
              </a>

            </div>

          </div>
        `;
      }
    ).join('');
}

async function initialize() {
  try {

    await initializeSupabase();

    currentUser =
      await getCurrentUser();

    if (!currentUser) {
      showContent();
      renderNotSignedIn();
      return;
    }

    currentJobSeeker =
      await loadJobSeeker();

    if (!currentJobSeeker) {
      showContent();
      renderNoProfile();
      return;
    }

    await loadApplications();

    showContent();

  } catch (error) {

    console.error(
      'My applications page error:',
      error
    );

    showContent();

    showError(
      error.message ||
      'Could not load your applications.'
    );
  }
}

document.addEventListener(
  'DOMContentLoaded',
  function () {
    initialize();
  }
);

