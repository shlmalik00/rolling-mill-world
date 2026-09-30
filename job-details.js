const supabaseClient = getSupabaseClient();

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

async function loadJobDetails() {
  const container = document.getElementById('jobDetails');
  const jobId = getJobId();

  if (!jobId) {
    container.innerHTML = `
      <div class="job-card">
        <h2>Job not found</h2>
        <p>No job ID was provided.</p>
        <a class="btn blue" href="jobs.html">Back to Find Jobs</a>
      </div>
    `;
    return;
  }

  const { data: job, error } = await supabaseClient
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
      application_deadline,
      created_at
    `)
    .eq('id', jobId)
    .eq('status', 'published')
    .single();

  if (error || !job) {
    console.error('Job details error:', error);

    container.innerHTML = `
      <div class="job-card">
        <h2>Could not load job</h2>
        <p>${escapeHtml(error?.message || 'Job not found.')}</p>
        <a class="btn blue" href="jobs.html">Back to Find Jobs</a>
      </div>
    `;

    return;
  }

  const location = [job.location, job.country]
    .filter(Boolean)
    .join(', ');

  const skills = job.skills_required
    ? escapeHtml(job.skills_required)
    : 'Not specified';

  const description = job.description
    ? escapeHtml(job.description)
    : 'No description provided.';

  const salary = job.salary_range
    ? escapeHtml(job.salary_range)
    : 'Not specified';

  const accommodation = job.accommodation
    ? escapeHtml(job.accommodation)
    : 'Not specified';

  const deadline = job.application_deadline
    ? escapeHtml(job.application_deadline)
    : 'Not specified';

  container.innerHTML = `
    <div class="job-card">

      <h1>${escapeHtml(job.title)}</h1>

      <div class="job-meta">

        <p>
          <strong>Location:</strong>
          ${escapeHtml(location || 'Not specified')}
        </p>

        <p>
          <strong>Employment:</strong>
          ${escapeHtml(job.employment_type || 'Not specified')}
        </p>

        <p>
          <strong>Experience:</strong>
          ${escapeHtml(job.experience_required || 'Not specified')}
        </p>

        <p>
          <strong>Salary:</strong>
          ${salary}
        </p>

        <p>
          <strong>Accommodation:</strong>
          ${accommodation}
        </p>

        <p>
          <strong>Application Deadline:</strong>
          ${deadline}
        </p>

      </div>

      <hr>

      <h2>Job Description</h2>

      <p>
        ${description}
      </p>

      <h2>Required Skills</h2>

      <p>
        ${skills}
      </p>

      <div class="job-actions">

        <a
          class="btn blue"
          href="job-apply.html?id=${encodeURIComponent(job.id)}"
        >
          Apply for This Job
        </a>

        <a
          class="btn gray"
          href="jobs.html"
        >
          Back to Find Jobs
        </a>

      </div>

    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadJobDetails();
});

