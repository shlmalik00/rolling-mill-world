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

function getJobId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function showStatus(message, type) {
  const box = document.getElementById('statusMessage');

  if (!box) return;

  box.textContent = message;
  box.className = 'status-message show ' + (type || 'error');
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

async function loadJob() {
  const jobId = getJobId();

  if (!jobId) {
    throw new Error('No job ID was provided.');
  }

  const result = await supabaseClient
    .from('jobs')
    .select(
      'id,title,location,country,employment_type,experience_required,salary_range'
    )
    .eq('id', jobId)
    .eq('status', 'published')
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error('This job was not found or is no longer published.');
  }

  currentJob = result.data;

  document.getElementById('jobTitle').textContent =
    currentJob.title || 'Untitled Job';

  document.getElementById('jobLocation').textContent =
    [currentJob.location, currentJob.country]
      .filter(Boolean)
      .join(', ') || 'Not specified';

  document.getElementById('jobEmployment').textContent =
    currentJob.employment_type || 'Not specified';

  document.getElementById('jobExperience').textContent =
    currentJob.experience_required || 'Not specified';

  document.getElementById('jobSalary').textContent =
    currentJob.salary_range || 'Not specified';
}

async function checkLogin() {
  const result = await supabaseClient.auth.getSession();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const session = result.data.session;

  if (!session || !session.user) {
    document.getElementById('profileArea').innerHTML =
      '<div class="profile-warning">' +
      '<strong>Sign in required</strong>' +
      '<p>Please sign in before applying for this job.</p>' +
      '<div class="apply-actions">' +
      '<button type="button" class="btn blue" id="loginButton">Sign In</button>' +
      '<a href="jobs.html" class="btn gray">Back to Find Jobs</a>' +
      '</div>' +
      '</div>';

    const button = document.getElementById('loginButton');

    if (button) {
      button.addEventListener('click', function () {
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

async function loadProfile() {
  const result = await supabaseClient
    .from('job_seekers')
    .select('id,full_name,professional_title,resume_path')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    document.getElementById('profileArea').innerHTML =
      '<div class="profile-warning">' +
      '<strong>Job seeker profile required</strong>' +
      '<p>Create your job seeker profile before applying.</p>' +
      '<div class="apply-actions">' +
      '<a href="job-seeker.html" class="btn blue">Create Profile</a>' +
      '<a href="jobs.html" class="btn gray">Back to Find Jobs</a>' +
      '</div>' +
      '</div>';

    return false;
  }

  currentJobSeeker = result.data;

  document.getElementById('profileArea').innerHTML =
    '<div class="profile-warning" style="background:#f5f7fa;border-color:#ddd;">' +
    '<strong>Applying as ' +
    escapeHtml(currentJobSeeker.full_name || 'Job Seeker') +
    '</strong>' +
    '<p>' +
    escapeHtml(currentJobSeeker.professional_title || 'Job Seeker') +
    '</p>' +
    '<p>' +
    (currentJobSeeker.resume_path
      ? 'Resume uploaded'
      : 'No resume uploaded') +
    '</p>' +
    '</div>';

  return true;
}

async function checkExistingApplication() {
  const result = await supabaseClient
    .from('job_applications')
    .select('id,status,created_at')
    .eq('job_id', currentJob.id)
    .eq('job_seeker_id', currentJobSeeker.id)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    return false;
  }

  document.getElementById('applicationForm').style.display = 'none';

  document.getElementById('profileArea').insertAdjacentHTML(
    'afterend',
    '<div class="profile-warning">' +
    '<strong>Application already submitted</strong>' +
    '<p>You have already applied for this job.</p>' +
    '<p>Application status: <strong>' +
    escapeHtml(result.data.status || 'submitted') +
    '</strong></p>' +
    '<div class="apply-actions">' +
    '<a href="jobs.html" class="btn blue">Find More Jobs</a>' +
    '</div>' +
    '</div>'
  );

  return true;
}

async function submitApplication(event) {
  event.preventDefault();

  const button = document.getElementById('submitApplication');
  const message = document.getElementById('coverMessage').value.trim();

  button.disabled = true;
  button.textContent = 'Submitting...';

  const result = await supabaseClient
    .from('job_applications')
    .insert({
      job_id: currentJob.id,
      job_seeker_id: currentJobSeeker.id,
      cover_message: message || null,
      status: 'submitted'
    })
    .select('id')
    .single();

  if (result.error) {
    console.error(result.error);

    if (result.error.code === '23505') {
      showStatus('You have already applied for this job.', 'error');
    } else {
      showStatus(
        result.error.message || 'Unable to submit application.',
        'error'
      );
    }

    button.disabled = false;
    button.textContent = 'Submit Application';

    return;
  }

  document.getElementById('applicationForm').style.display = 'none';

  document.getElementById('profileArea').innerHTML =
    '<div class="status-message show success">' +
    '<strong>Application submitted successfully.</strong>' +
    '<p>Your application has been sent for this position.</p>' +
    '<div class="apply-actions">' +
    '<a href="jobs.html" class="btn blue">Find More Jobs</a>' +
    '<a href="job-seeker.html" class="btn gray">View My Profile</a>' +
    '</div>' +
    '</div>';
}

async function initialize() {
  try {
    if (typeof getSupabaseClient !== 'function') {
      throw new Error('auth.js did not load correctly.');
    }

    supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      throw new Error('Supabase could not be initialized.');
    }

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

    const alreadyApplied = await checkExistingApplication();

    if (alreadyApplied) {
      return;
    }

    document.getElementById('applicationForm').style.display = 'block';

  } catch (error) {
    console.error('Application page error:', error);

    showContent();

    showStatus(
      error.message || 'Could not load the application page.',
      'error'
    );
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('applicationForm');

  if (form) {
    form.addEventListener('submit', submitApplication);
  }

  initialize();
});
