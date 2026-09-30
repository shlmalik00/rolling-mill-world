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

  box.textContent = message;
  box.className = `status-message show ${type}`;
}

function hideStatus() {
  const box = document.getElementById('statusMessage');

  box.textContent = '';
  box.className = 'status-message';
}

function getJobId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getLoginRedirectUrl() {
  return `job-apply.html?id=${encodeURIComponent(getJobId() || '')}`;
}

async function loadJob() {
  const jobId = getJobId();

  if (!jobId) {
    throw new Error('No job was selected.');
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
    .single();

  if (error || !data) {
    console.error('Job load error:', error);
    throw new Error('This job could not be found or is no longer available.');
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
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session || !session.user) {
    currentUser = null;

    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">
        <strong>Sign in required</strong>
        <p>
          Please sign in to your Rolling Mill World account before
          applying for this job.
        </p>

        <div class="apply-actions">
          <button
            type="button"
            class="btn blue"
            id="loginToApply"
          >
            Sign In
          </button>

          <a href="jobs.html" class="btn gray">
            Back to Find Jobs
          </a>
        </div>
      </div>
    `;

    document.getElementById('loginToApply').addEventListener('click', () => {
      if (typeof openAuth === 'function') {
        openAuth('login');
      } else {
        window.location.href =
          `index.html?return_to=${encodeURIComponent(getLoginRedirectUrl())}`;
      }
    });

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
    throw new Error('Unable to check your job seeker profile.');
  }

  currentJobSeeker = data;

  if (!data) {
    document.getElementById('profileArea').innerHTML = `
      <div class="profile-warning">
        <strong>Job seeker profile required</strong>

        <p>
          You need to create your job seeker profile before
          applying for a job.
        </p>

        <div class="apply-actions">
          <a href="job-seeker.html" class="btn blue">
            Create Job Seeker Profile
          </a>

          <a href="jobs.html" class="btn gray">
            Back to Find Jobs
          </a>
        </div>
      </div>
    `;

    return false;
  }

  const resumeStatus = data.resume_path
    ? 'Resume uploaded'
    : 'No resume uploaded';

  document.getElementById('profileArea').innerHTML = `
    <div class="profile-warning" style="background:#f5f7fa;border-color:#ddd;">
      <strong>
        Applying as ${escapeHtml(data.full_name || 'Job Seeker')}
      </strong>

      <p>
        ${escapeHtml(data.professional_title || 'Job Seeker')}
      </p>

      <p>
        ${escapeHtml(resumeStatus)}
      </p>
    </div>
  `;

  return true;
}

async function checkExistingApplication() {
  const { data, error } = await supabaseClient
    .from('job_applications')
    .select('id, status, created_at')
    .eq('job_id', currentJob.id)
    .eq('job_seeker_id', currentJobSeeker.id)
    .maybeSingle();

  if (error) {
    console.error('Application check error:', error);
    throw new Error('Unable to check your application status.');
  }

  if (!data) {
    return false;
  }

  document.getElementById('applicationForm').style.display = 'none';

  document.getElementById('profileArea').insertAdjacentHTML(
    'afterend',
    `
      <div class="profile-warning">
        <strong>Application already submitted</strong>

        <p>
          You have already applied for this job.
        </p>

        <p>
          Application status:
          <strong>${escapeHtml(data.status || 'submitted')}</strong>
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

  hideStatus();

  if (!currentUser || !currentJob || !currentJobSeeker) {
    showStatus('Your session or profile could not be verified.');
    return;
  }

  const button = document.getElementById('submitApplication');
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
    console.error('Application submit error:', error);

    if (error.code === '23505') {
      showStatus(
        'You have already applied for this job.',
        'error'
      );
    } else {
      showStatus(
        error.message || 'Unable to submit your application.',
        'error'
      );
    }

    button.disabled = false;
    button.textContent = 'Submit Application';
    return;
  }

  console.log('Application submitted:', data);

  document.getElementById('applicationForm').style.display = 'none';

  document.getElementById('profileArea').innerHTML = `
    <div class="status-message show success">
      <strong>Application submitted successfully.</strong>

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

async function initializeApplicationPage() {
  const loading = document.getElementById('loadingMessage');
  const content = document.getElementById('applicationContent');

  try {
    supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      throw new Error('Supabase could not be initialized.');
    }

    await loadJob();

    content.style.display = 'block';
    loading.style.display = 'none';

    const authenticated = await checkAuthentication();

    if (!authenticated) {
      return;
    }

    const profileExists = await loadJobSeekerProfile();

    if (!profileExists) {
      return;
    }

    const alreadyApplied = await checkExistingApplication();

    if (alreadyApplied) {
      return;
    }

    document.getElementById('applicationForm').style.display = 'block';

  } catch (error) {
    console.error('Application page error:', error);

    loading.style.display = 'none';
    content.style.display = 'block';

    showStatus(
      error.message || 'Something went wrong while loading this page.',
      'error'
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApplicationPage();

  const form = document.getElementById('applicationForm');

  if (form) {
    form.addEventListener('submit', submitApplication);
  }
});

