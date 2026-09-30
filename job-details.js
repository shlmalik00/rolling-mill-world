let jobDetailsSupabase = null;

document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('jobDetails');

  if (!container) {
    return;
  }

  try {
    // Get the initialized Supabase client from auth.js
    jobDetailsSupabase = await getSupabaseClient();

    // Get job ID from URL
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (!jobId) {
      throw new Error('No job was specified.');
    }

    // Load published job
    const {
      data: job,
      error
    } = await jobDetailsSupabase
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

    if (error) {
      console.error('Supabase job error:', error);
      throw new Error('This job could not be found.');
    }

    if (!job) {
      throw new Error('This job could not be found.');
    }

    // Update browser title
    document.title =
      `${job.title || 'Job Details'} | Rolling Mill World`;

    // Build location
    const location = [
      job.location,
      job.country
    ]
      .filter(value => value && String(value).trim())
      .join(', ');

    // Render job
    container.innerHTML = `
      <div style="
        max-width: 850px;
        margin-top: 25px;
        background: #ffffff;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 30px;
      ">

        <h1 style="margin-top:0;">
          ${escapeHtml(job.title || 'Untitled Job')}
        </h1>

        <div style="
          color:#555;
          margin-bottom:25px;
          line-height:1.8;
        ">
          <div>
            <strong>Location:</strong>
            ${escapeHtml(location || 'Not specified')}
          </div>

          <div>
            <strong>Employment:</strong>
            ${escapeHtml(job.employment_type || 'Not specified')}
          </div>

          <div>
            <strong>Experience:</strong>
            ${escapeHtml(job.experience_required || 'Not specified')}
          </div>

          <div>
            <strong>Salary:</strong>
            ${escapeHtml(job.salary_range || 'Not specified')}
          </div>

          <div>
            <strong>Accommodation:</strong>
            ${escapeHtml(job.accommodation || 'Not specified')}
          </div>

          <div>
            <strong>Application Deadline:</strong>
            ${formatDate(job.application_deadline)}
          </div>
        </div>

        <hr style="
          border:0;
          border-top:1px solid #eee;
          margin:25px 0;
        ">

        <h2>Job Description</h2>

        <div style="
          line-height:1.7;
          white-space:pre-wrap;
          margin-bottom:30px;
        ">
          ${escapeHtml(
            job.description || 'No description provided.'
          )}
        </div>

        <h2>Required Skills</h2>

        <div style="
          line-height:1.7;
          white-space:pre-wrap;
          margin-bottom:30px;
        ">
          ${escapeHtml(
            job.skills_required || 'Not specified'
          )}
        </div>

        <div style="
          margin-top:30px;
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        ">

          <a
            id="applyButton"
            class="btn blue"
            href="job-apply.html?id=${encodeURIComponent(job.id)}"
          >
            Apply for This Job
          </a>

          <a
            class="btn"
            href="jobs.html"
          >
            Back to Find Jobs
          </a>

        </div>

      </div>
    `;

  } catch (error) {
    console.error('Job details error:', error);

    container.innerHTML = `
      <div style="
        max-width:850px;
        margin-top:25px;
        padding:25px;
        border:1px solid #f0b7b7;
        border-radius:10px;
        background:#fff5f5;
      ">
        <h2>Unable to load this job</h2>

        <p>
          ${escapeHtml(
            error.message || 'Something went wrong.'
          )}
        </p>

        <p>
          <a href="jobs.html">
            Return to Find Jobs
          </a>
        </p>
      </div>
    `;
  }
});


function formatDate(value) {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value));
  }

  return escapeHtml(
    date.toLocaleDateString()
  );
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

