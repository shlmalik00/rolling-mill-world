let jobDetailsClient = null;

async function getJobDetailsClient() {
  if (jobDetailsClient) return jobDetailsClient;

  jobDetailsClient = await getSupabaseClient();

  return jobDetailsClient;
}

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

  if (!container) return;

  const jobId = getJobId();

  if (!jobId) {
    container.innerHTML = `
      <section class="card">
        <h2>Job not found</h2>
        <p>No job ID was provided.</p>
        <a class="btn blue" href="jobs.html">Back to Find Jobs</a>
      </section>
    `;

    return;
  }

  container.innerHTML = '<p>Loading job...</p>';

  try {
    const sb = await getJobDetailsClient();

    const { data: job, error } = await sb
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
      .maybeSingle();

    if (error) throw error;

    if (!job) {
      container.innerHTML = `
        <section class="card">
          <h2>Job not found</h2>
          <p>
            This job may no longer be published or may have been removed.
          </p>
          <a class="btn blue" href="jobs.html">
            Back to Find Jobs
          </a>
        </section>
      `;

      return;
    }

    const location = [
      job.location,
      job.country
    ]
      .filter(Boolean)
      .join(', ');

    container.innerHTML = `
      <section class="card">

        <h1>${escapeHtml(job.title)}</h1>

        ${
          location
            ? `
              <p>
                <strong>Location:</strong>
                ${escapeHtml(location)}
              </p>
            `
            : ''
        }

        ${
          job.employment_type
            ? `
              <p>
                <strong>Employment:</strong>
                ${escapeHtml(job.employment_type)}
              </p>
            `
            : ''
        }

        ${
          job.experience_required
            ? `
              <p>
                <strong>Experience:</strong>
                ${escapeHtml(job.experience_required)}
              </p>
            `
            : ''
        }

        ${
          job.salary_range
            ? `
              <p>
                <strong>Salary:</strong>
                ${escapeHtml(job.salary_range)}
              </p>
            `
            : ''
        }

        ${
          job.accommodation
            ? `
              <p>
                <strong>Accommodation:</strong>
                ${escapeHtml(job.accommodation)}
              </p>
            `
            : ''
        }

        ${
          job.application_deadline
            ? `
              <p>
                <strong>Application deadline:</strong>
                ${escapeHtml(job.application_deadline)}
              </p>
            `
            : ''
        }

        <hr>

        <h2>Job Description</h2>

        <p>
          ${escapeHtml(job.description)}
        </p>

        ${
          job.skills_required
            ? `
              <h2>Required Skills</h2>
              <p>
                ${escapeHtml(job.skills_required)}
              </p>
            `
            : ''
        }

        <div style="margin-top:24px;">

          <a
            class="btn blue"
            href="job-seeker.html"
          >
            Apply for This Job
          </a>

          <a
            class="btn"
            href="jobs.html"
            style="margin-left:10px;"
          >
            Back to Find Jobs
          </a>

        </div>

      </section>
    `;

  } catch (err) {

    console.error('Could not load job details:', err);

    container.innerHTML = `
      <section class="card">
        <h2>Could not load job</h2>
        <p>
          ${escapeHtml(
            err.message || 'Please try again later.'
          )}
        </p>

        <a class="btn blue" href="jobs.html">
          Back to Find Jobs
        </a>
      </section>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadJobDetails);

