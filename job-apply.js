let applicationSupabase = null;
let currentJob = null;
let currentJobSeeker = null;
let currentUser = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getJobId() {
  return new URLSearchParams(window.location.search).get('id');
}

function showContent() {
  const loading = document.getElementById('loadingMessage');
  const content = document.getElementById('applicationContent');

  if (loading) {
    loading.style.display = 'none';
  }

  if (content) {
    content.style.display = 'block';
  }
}

function showError(message) {
  showContent();

  const status = document.getElementById('statusMessage');

  if (status) {
    status.textContent = 'ERROR: ' + message;
    status.className = 'status-message show error';
  }

  console.error('JOB APPLY ERROR:', message);
}

async function initializeSupabase() {
  if (typeof getSupabaseClient !== 'function') {
    throw new Error('auth.js did not load correctly.');
  }

  applicationSupabase = await getSupabaseClient();

  if (
    !applicationSupabase ||
    typeof applicationSupabase.from !== 'function'
  ) {
    throw new Error('Supabase client was not initialized correctly.');
  }

  return applicationSupabase;
}

async function loadJob() {
  const jobId = getJobId();

  if (!jobId) {
    throw new Error('No job ID was provided.');
  }

  const { data, error } = await applicationSupabase
    .from('jobs')
    .select(`
      id,
      title,
      location,
      country,
      employment_type,
      experience_required,
      salary_range
    `)
    .eq('id', jobId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'This job was not found or is no longer published.'
    );
  }

  currentJob = data;

  document.getElementById('jobTitle').textContent =
    data.title || 'Untitled Job';

  document.getElementById('jobLocation').textContent =
    [data.location, data.country]
      .filter(Boolean)
      .join(', ') || 'Not specified';

  document.getElementById('jobEmployment').textContent =
    data.employment_type || 'Not specified';

  document.getElementById('jobExperience').textContent =
    data.experience_required || 'Not specified';

  document.getElementById('jobSalary').textContent =
    data.salary_range || 'Not specified';
}

async function checkLogin() {
  const { data, error } =
    await applicationSupabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">
        <strong>Sign in required</strong>
        <p>Please sign in before applying for this job.</p>

        <div class="apply-actions">
          <button
            type="button"
            class="btn blue"
            id="loginButton"
          >
            Sign In
          </button>

          <a href="jobs.html" class="btn gray">
            Back to Find Jobs
          </a>
        </div>
      </div>
    `;

    const loginButton =
      document.getElementById('loginButton');

    if (loginButton) {
      loginButton.addEventListener(
        'click',
        function () {
          if (typeof openAuth === 'function') {
            openAuth('login');
          } else {
            window.location.href = 'index.html';
          }
        }
      );
    }

    return false;
  }

  currentUser = data.session.user;

  return true;
}

async function loadProfile() {
  const { data, error } =
    await applicationSupabase
      .from('job_seekers')
      .select(`
        id,
        full_name,
        professional_title,
        resume_path
      `)
      .eq('user_id', currentUser.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">
        <strong>Job seeker profile required</strong>

        <p>
          Create your job seeker profile before applying.
        </p>

        <div class="apply-actions">
          <a href="job-seeker.html" class="btn blue">
            Create Profile
          </a>

          <a href="jobs.html" class="btn gray">
            Back to Find Jobs
          </a>
        </div>
      </div>
    `;

    return false;
  }

  currentJobSeeker = data;

  document.getElementById('profileArea').innerHTML = `
    <div
      class="profile-warning"
      style="background:#f5f7fa;border-color:#ddd;"
    >
      <strong>
        Applying as
        ${escapeHtml(data.full_name || 'Job Seeker')}
      </strong>

      <p>
        ${escapeHtml(
          data.professional_title || 'Job Seeker'
        )}
      </p>

      <p>
        ${
          data.resume_path
            ? 'Resume uploaded'
            : 'No resume uploaded'
        }
      </p>
    </div>
  `;

  return true;
}

async function checkExistingApplication() {
  const { data, error } =
    await applicationSupabase
      .from('job_applications')
      .select('id,status,created_at')
      .eq('job_id', currentJob.id)
      .eq('job_seeker_id', currentJobSeeker.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return false;
  }

  document.getElementById(
    'applicationForm'
  ).style.display = 'none';

  document.getElementById(
    'profileArea'
  ).insertAdjacentHTML(
    'afterend',
    `
      <div class="profile-warning">
        <strong>Application already submitted</strong>

        <p>
          You have already applied for this job.
        </p>

        <p>
          Application status:
          <strong>
            ${escapeHtml(data.status || 'submitted')}
          </strong>
        </p>

        <div class="apply-actions">
          <a href="jobs.html" class="btn blue">
            Find More Jobs
          </a>
        </div>
      </div>
    `
  );

  return true;
}

async function submitApplication(event) {
  event.preventDefault();

  const button =
    document.getElementById('submitApplication');

  const coverMessage =
    document.getElementById('coverMessage')
      .value
      .trim();

  button.disabled = true;
  button.textContent = 'Submitting...';

  const { error } =
    await applicationSupabase
      .from('job_applications')
      .insert({
        job_id: currentJob.id,
        job_seeker_id: currentJobSeeker.id,
        cover_message: coverMessage || null,
        status: 'submitted'
      });

  if (error) {
    console.error(
      'APPLICATION INSERT ERROR:',
      error
    );

    if (error.code === '23505') {
      showError(
        'You have already applied for this job.'
      );
    } else {
      showError(
        error.message ||
        'Unable to submit application.'
      );
    }

    button.disabled = false;
    button.textContent = 'Submit Application';

    return;
  }

  document.getElementById(
    'applicationForm'
  ).style.display = 'none';

  document.getElementById(
    'profileArea'
  ).innerHTML = `
    <div class="status-message show success">
      <strong>
        Application submitted successfully.
      </strong>

      <p>
        Your application has been sent for this position.
      </p>

      <div class="apply-actions">
        <a href="jobs.html" class="btn blue">
          Find More Jobs
        </a>

        <a href="job-seeker.html" class="btn gray">
          View My Profile
        </a>
      </div>
    </div>
  `;
}

async function initialize() {
  try {
    await initializeSupabase();

    await loadJob();

    showContent();

    const loggedIn = await checkLogin();

    if (!loggedIn) {
      return;
    }

    const profileLoaded = await loadProfile();

    if (!profileLoaded) {
      return;
    }

    const alreadyApplied =
      await checkExistingApplication();

    if (alreadyApplied) {
      return;
    }

    document.getElementById(
      'applicationForm'
    ).style.display = 'block';

  } catch (error) {
    console.error(
      'Application page error:',
      error
    );

    showError(
      error.message ||
      'Could not load the application page.'
    );
  }
}

document.addEventListener(
  'DOMContentLoaded',
  function () {

    const form =
      document.getElementById('applicationForm');

    if (form) {
      form.addEventListener(
        'submit',
        submitApplication
      );
    }

    initialize();
  }
);

