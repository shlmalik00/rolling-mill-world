let applicationSupabase = null;
let currentJob = null;
let currentJobSeeker = null;
let currentUser = null;

let applicationInitialized = false;
let applicationStateLoading = false;
let authListener = null;

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
  const loading =
    document.getElementById('loadingMessage');

  const content =
    document.getElementById('applicationContent');

  if (loading) {
    loading.style.display = 'none';
  }

  if (content) {
    content.style.display = 'block';
  }
}

function showError(message) {
  showContent();

  const status =
    document.getElementById('statusMessage');

  if (status) {
    status.textContent = 'ERROR: ' + message;
    status.className =
      'status-message show error';
  }

  console.error(
    'JOB APPLY ERROR:',
    message
  );
}

async function initializeSupabase() {
  if (
    typeof getSupabaseClient !== 'function'
  ) {
    throw new Error(
      'auth.js did not load correctly.'
    );
  }

  applicationSupabase =
    await getSupabaseClient();

  if (
    !applicationSupabase ||
    typeof applicationSupabase.from !== 'function'
  ) {
    throw new Error(
      'Supabase client was not initialized correctly.'
    );
  }

  return applicationSupabase;
}

async function loadJob() {
  const jobId = getJobId();

  if (!jobId) {
    throw new Error(
      'No job ID was provided.'
    );
  }

  const { data, error } =
    await applicationSupabase
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

  const title =
    document.getElementById('jobTitle');

  const location =
    document.getElementById('jobLocation');

  const employment =
    document.getElementById('jobEmployment');

  const experience =
    document.getElementById('jobExperience');

  const salary =
    document.getElementById('jobSalary');

  if (title) {
    title.textContent =
      data.title || 'Untitled Job';
  }

  if (location) {
    location.textContent =
      [data.location, data.country]
        .filter(Boolean)
        .join(', ') ||
      'Not specified';
  }

  if (employment) {
    employment.textContent =
      data.employment_type ||
      'Not specified';
  }

  if (experience) {
    experience.textContent =
      data.experience_required ||
      'Not specified';
  }

  if (salary) {
    salary.textContent =
      data.salary_range ||
      'Not specified';
  }
}

function clearApplicationExtraMessages() {
  const profileArea =
    document.getElementById('profileArea');

  if (!profileArea) {
    return;
  }

  /*
   * Remove any previously-created duplicate
   * application status boxes.
   */
  profileArea
    .parentNode
    ?.querySelectorAll(
      '.duplicate-application-status'
    )
    .forEach(function (element) {
      element.remove();
    });
}

function renderLoginRequired() {
  const profileArea =
    document.getElementById('profileArea');

  const applicationForm =
    document.getElementById('applicationForm');

  if (!profileArea) {
    return;
  }

  if (applicationForm) {
    applicationForm.style.display =
      'none';
  }

  clearApplicationExtraMessages();

  profileArea.innerHTML = `
    <div class="profile-warning">

      <strong>
        Sign in required
      </strong>

      <p>
        Please sign in before applying for this job.
      </p>

      <div class="apply-actions">

        <button
          type="button"
          class="btn blue"
          id="loginButton"
        >
          Sign In
        </button>

        <a
          href="jobs.html"
          class="btn gray"
        >
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

async function checkLogin() {
  const { data, error } =
    await applicationSupabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    currentUser = null;

    renderLoginRequired();

    return false;
  }

  currentUser =
    data.session.user;

  return true;
}

async function loadProfile() {
  const profileArea =
    document.getElementById('profileArea');

  if (!profileArea) {
    throw new Error(
      'Profile area was not found.'
    );
  }

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

    currentJobSeeker = null;

    profileArea.innerHTML = `
      <div class="profile-warning">

        <strong>
          Job seeker profile required
        </strong>

        <p>
          Create your job seeker profile before applying.
        </p>

        <div class="apply-actions">

          <a
            href="job-seeker.html"
            class="btn blue"
          >
            Create Profile
          </a>

          <a
            href="jobs.html"
            class="btn gray"
          >
            Back to Find Jobs
          </a>

        </div>

      </div>
    `;

    return false;
  }

  currentJobSeeker = data;

  profileArea.innerHTML = `
    <div
      class="profile-warning"
      style="background:#f5f7fa;border-color:#ddd;"
    >

      <strong>
        Applying as
        ${escapeHtml(
          data.full_name ||
          'Job Seeker'
        )}
      </strong>

      <p>
        ${escapeHtml(
          data.professional_title ||
          'Job Seeker'
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
  if (
    !currentJob ||
    !currentJobSeeker
  ) {
    return false;
  }

  const { data, error } =
    await applicationSupabase
      .from('job_applications')
      .select(
        'id,status,created_at'
      )
      .eq(
        'job_id',
        currentJob.id
      )
      .eq(
        'job_seeker_id',
        currentJobSeeker.id
      )
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  /*
   * Always remove an old status box before
   * rendering a new one.
   */
  clearApplicationExtraMessages();

  if (!data) {
    return false;
  }

  const applicationForm =
    document.getElementById(
      'applicationForm'
    );

  if (applicationForm) {
    applicationForm.style.display =
      'none';
  }

  const existingStatus =
    document.querySelector(
      '.duplicate-application-status'
    );

  if (existingStatus) {
    return true;
  }

  const statusBox =
    document.createElement('div');

  statusBox.className =
    'profile-warning duplicate-application-status';

  statusBox.innerHTML = `
    <strong>
      Application already submitted
    </strong>

    <p>
      You have already applied for this job.
    </p>

    <p>
      Application status:
      <strong>
        ${escapeHtml(
          data.status ||
          'submitted'
        )}
      </strong>
    </p>

    <div class="apply-actions">

      <a
        href="jobs.html"
        class="btn blue"
      >
        Find More Jobs
      </a>

    </div>
  `;

  const profileArea =
    document.getElementById(
      'profileArea'
    );

  if (profileArea) {
    profileArea.insertAdjacentElement(
      'afterend',
      statusBox
    );
  }

  return true;
}

function showApplicationForm() {
  /*
   * Remove any old duplicate status
   * messages before showing the form.
   */
  clearApplicationExtraMessages();

  const form =
    document.getElementById(
      'applicationForm'
    );

  if (form) {
    form.style.display =
      'block';
  }
}

async function loadApplicationState() {

  /*
   * Prevent the initial load and the
   * SIGNED_IN event from running this
   * function at the same time.
   */
  if (applicationStateLoading) {
    return;
  }

  applicationStateLoading = true;

  try {

    currentJobSeeker = null;

    const loggedIn =
      await checkLogin();

    if (!loggedIn) {
      return;
    }

    const profileLoaded =
      await loadProfile();

    if (!profileLoaded) {
      return;
    }

    const alreadyApplied =
      await checkExistingApplication();

    if (alreadyApplied) {
      return;
    }

    showApplicationForm();

  } catch (error) {

    console.error(
      'Could not load application state:',
      error
    );

    showError(
      error.message ||
      'Could not load your application information.'
    );

  } finally {

    applicationStateLoading = false;

  }
}

async function submitApplication(event) {
  event.preventDefault();

  if (!currentUser) {
    renderLoginRequired();
    return;
  }

  if (!currentJobSeeker) {
    showError(
      'Please create your job seeker profile first.'
    );
    return;
  }

  const button =
    document.getElementById(
      'submitApplication'
    );

  const coverMessage =
    document.getElementById(
      'coverMessage'
    )?.value.trim() || '';

  if (button) {
    button.disabled = true;
    button.textContent =
      'Submitting...';
  }

  try {

    const { error } =
      await applicationSupabase
        .from('job_applications')
        .insert({
          job_id:
            currentJob.id,

          job_seeker_id:
            currentJobSeeker.id,

          cover_message:
            coverMessage || null,

          status:
            'submitted'
        });

    if (error) {

      console.error(
        'APPLICATION INSERT ERROR:',
        error
      );

      if (
        error.code === '23505'
      ) {

        showError(
          'You have already applied for this job.'
        );

      } else {

        showError(
          error.message ||
          'Unable to submit application.'
        );

      }

      return;
    }

    const applicationForm =
      document.getElementById(
        'applicationForm'
      );

    if (applicationForm) {
      applicationForm.style.display =
        'none';
    }

    clearApplicationExtraMessages();

    const profileArea =
      document.getElementById(
        'profileArea'
      );

    if (profileArea) {

      profileArea.innerHTML = `
        <div class="status-message show success">

          <strong>
            Application submitted successfully.
          </strong>

          <p>
            Your application has been sent for this position.
          </p>

          <div class="apply-actions">

            <a
              href="jobs.html"
              class="btn blue"
            >
              Find More Jobs
            </a>

            <a
              href="job-seeker.html"
              class="btn gray"
            >
              View My Profile
            </a>

          </div>

        </div>
      `;
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        'Submit Application';
    }

  }
}

function watchForLogin() {

  if (authListener) {
    return;
  }

  authListener =
    applicationSupabase.auth.onAuthStateChange(
      function (event, session) {

        console.log(
          'Application page auth event:',
          event
        );

        if (
          event === 'SIGNED_IN' &&
          session &&
          session.user
        ) {

          currentUser =
            session.user;

          /*
           * Do not reload the page.
           *
           * The initial initialization may
           * still be running, so loadApplicationState()
           * will safely ignore this event if another
           * state load is already in progress.
           */
          setTimeout(
            function () {
              loadApplicationState();
            },
            150
          );
        }

        if (
          event === 'SIGNED_OUT'
        ) {

          currentUser = null;
          currentJobSeeker = null;

          renderLoginRequired();
        }

      }
    );
}

async function initialize() {

  if (applicationInitialized) {
    return;
  }

  applicationInitialized = true;

  try {

    await initializeSupabase();

    /*
     * Register the auth listener once.
     */
    watchForLogin();

    /*
     * Load the job only once.
     */
    await loadJob();

    showContent();

    /*
     * Determine whether the user is
     * logged in and load the correct
     * application state.
     */
    await loadApplicationState();

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
      document.getElementById(
        'applicationForm'
      );

    if (form) {
      form.addEventListener(
        'submit',
        submitApplication
      );
    }

    initialize();

  }
);



