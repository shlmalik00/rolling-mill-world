let supabaseClient = null;
let currentUser = null;
let currentJob = null;
let currentJobSeeker = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showStatus(message, type = 'error') {
  const box = document.getElementById('statusMessage');

  if (!box) return;

  box.textContent = message;
  box.className = `status-message show ${type}`;
}

function getJobId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function showApplicationContent() {
  const loading = document.getElementById('loadingMessage');
  const content = document.getElementById('applicationContent');

  if (loading) {
    loading.style.display = 'none';
  }

  if (content) {
    content.style.display = 'block';
  }
}

async function loadJob() {
  const jobId = getJobId();

  if (!jobId) {
    throw new Error('No job ID was found in the page URL.');
  }

  const { data, error } = await supabaseClient
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
      application_deadline
    `)
    .eq('id', jobId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('Job query error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'This job could not be found or is no longer published.'
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

async function checkAuthentication() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error('Session error:', error);
    throw new Error('Unable to check your login session.');
  }

  if (!session || !session.user) {
    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">
        <strong>Sign in required</strong>

        <p>
          Please sign in to your Rolling Mill World account
          before applying for this job.
        </p>

        <div class="apply-actions">
          <button
            type="button"
            class="btn blue"
            id="loginToApply"
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

    const loginButton = document.getElementById('loginToApply');

    if (loginButton) {
      loginButton.addEventListener('click', () => {
        if (typeof openAuth === 'function') {
          openAuth('login');
        } else {
          window.location.href = 'index.html';
        }
      });
    }

    return false;
  }

  currentUser = session.user;

  return true;
}

async function loadJobSeekerProfile() {
  const { data, error } = await supabaseClient
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
    console.error('Job seeker profile error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">

        <strong>Job seeker profile required</strong>

        <p>
          You need to create your job seeker profile
          before applying for a job.
        </p>

        <div class="apply-actions">

          <a
            href="job-seeker.html"
            class="btn blue"
          >
            Create Job Seeker Profile
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

  document.getElementById('profileArea').innerHTML = `
    <div
      class="profile-warning"
      style="background:#f5f7fa;border-color:#ddd;"
    >

      <strong>
        Applying as ${escapeHtml(data.full_name || 'Job Seeker')}
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
  const { data, error } = await supabaseClient
    .from('job_applications')
    .select(`
      id,
      status,
      created_at
    `)
    .eq('job_id', currentJob.id)
    .eq('job_seeker_id', currentJobSeeker.id)
    .maybeSingle();

  if (error) {
    console.error('Application check error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    return false;
  }

  document.getElementById('applicationForm').style.display = 'none';

  document.getElementById('profileArea').insertAdjacentHTML(
    'afterend',
    `
      <div class="profile-warning">

        <strong>
          Application already submitted
        </strong>

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

          <a
            href="jobs.html"
            class="btn blue"
          >
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
    document.getElementById('coverMessage').value.trim();

  button.disabled = true;
  button.textContent = 'Submitting...';

  const { data, error } = await supabaseClient
    .from('job_applications')
    .insert({
      job_id: currentJob.id,
      job_seeker_id: currentJobSeeker.id,
      cover_message: coverMessage || null,
      status: 'submitted'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Application submission error:', error);

    if (error.code === '23505') {
      showStatus(
        'You have already applied for this job.',
        'error'
      );
    } else {
      showStatus(
        error.message || 'Unable to submit application.',
        'error'
      );
    }

    button.disabled = false;
    button.textContent = 'Submit Application';

    return;
  }

  console.log('Application created:', data);

  document.getElementById('applicationForm').style.display =
    'none';

  document.getElementById('profileArea').innerHTML = `
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

async function initializeApplicationPage() {
  try {
    console.log('Starting job application page...');

    if (typeof getSupabaseClient !== 'function') {
      throw new Error(
        'auth.js did not load correctly.'
      );
    }

    supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      throw new Error(
        'Supabase client could not be initialized.'
      );
    }

    console.log('Supabase initialized.');

    const jobId = getJobId();

    console.log('Job ID:', jobId);

    await loadJob();

    console.log('Job loaded:', currentJob);

    showApplicationContent();

    const authenticated =
      await checkAuthentication();

    if (!authenticated) {
      return;
    }

    console.log('User authenticated:', currentUser.id);

    const profileExists =
      await loadJobSeekerProfile();

    if (!profileExists) {
      return;
    }

    console.log(
      'Job seeker profile:',
      currentJobSeeker.id
    );

    const alreadyApplied =
      await checkExistingApplication();

    if (alreadyApplied) {
      return;
    }

    document.getElementById(
      'applicationForm'
    ).style.display = 'block';

    console.log(
      'Application form ready.'
    );

  } catch (error) {

    console.error(
      'Application initialization error:',
      error
    );

    showApplicationContent();

    showStatus(
      error.message ||
      'Could not load job application page.',
      'error'
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

    initializeApplicationPage();
  }
);
