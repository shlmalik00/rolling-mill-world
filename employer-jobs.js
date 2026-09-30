let employerJobsClient = null;

async function getEmployerJobsClient() {
if (employerJobsClient) return employerJobsClient;

employerJobsClient = await getSupabaseClient();

return employerJobsClient;
}

function showEmployerJobsMessage(message, ok = false) {
const el = document.getElementById('employerJobsMsg');

if (!el) return;

el.textContent = message;
el.className = ok ? 'ok' : '';
}

function escapeHtml(value) {
return String(value ?? '')
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"')
.replace(/'/g, ''');
}

async function getEmployer() {

const sb = await getEmployerJobsClient();

const { data, error } = await sb.auth.getSession();

if (error) throw error;

if (!data.session || !data.session.user) {
throw new Error('Please sign in to manage your jobs.');
}

return {
sb,
user: data.session.user
};
}

async function loadEmployerJobs() {

const results = document.getElementById('employerJobsResults');

if (!results) return;

results.innerHTML = '<p>Loading your jobs...</p>';

try {

const { sb, user } = await getEmployer();

const { data, error } = await sb
  .from('jobs')
  .select(`
    id,
    title,
    description,
    location,
    country,
    employment_type,
    experience_required,
    salary_range,
    application_deadline,
    status,
    created_at
  `)
  .eq('employer_user_id', user.id)
  .order('created_at', { ascending: false });

if (error) throw error;

const jobs = data || [];

if (!jobs.length) {

  results.innerHTML = `
    <section class="card">
      <h2>No jobs yet</h2>
      <p>
        You have not posted any jobs yet.
      </p>
      <a class="btn blue" href="post-job.html">
        Post Your First Job
      </a>
    </section>
  `;

  return;
}

results.innerHTML = jobs.map(job => {

  const location = [
    job.location,
    job.country
  ]
    .filter(Boolean)
    .join(', ');

  return `
    <article class="card">

      <h2>${escapeHtml(job.title)}</h2>

      <p>
        <strong>Status:</strong>
        ${escapeHtml(job.status)}
      </p>

      ${
        location
          ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>`
          : ''
      }

      ${
        job.employment_type
          ? `<p><strong>Employment:</strong> ${escapeHtml(job.employment_type)}</p>`
          : ''
      }

      ${
        job.experience_required
          ? `<p><strong>Experience:</strong> ${escapeHtml(job.experience_required)}</p>`
          : ''
      }

      ${
        job.salary_range
          ? `<p><strong>Salary:</strong> ${escapeHtml(job.salary_range)}</p>`
          : ''
      }

      ${
        job.application_deadline
          ? `<p><strong>Deadline:</strong> ${escapeHtml(job.application_deadline)}</p>`
          : ''
      }

      <p>
        ${escapeHtml(job.description)}
      </p>

      <div>

        ${
          job.status === 'draft'
            ? `
              <button
                class="btn blue"
                type="button"
                onclick="changeJobStatus('${job.id}', 'published')"
              >
                Publish
              </button>
            `
            : ''
        }

        ${
          job.status === 'published'
            ? `
              <button
                class="btn dark"
                type="button"
                onclick="changeJobStatus('${job.id}', 'closed')"
              >
                Close Job
              </button>
            `
            : ''
        }

        ${
          job.status === 'closed'
            ? `
              <button
                class="btn blue"
                type="button"
                onclick="changeJobStatus('${job.id}', 'published')"
              >
                Reopen Job
              </button>
            `
            : ''
        }

        ${
          job.status === 'published'
            ? `
              <a
                class="btn blue"
                href="job-details.html?id=${encodeURIComponent(job.id)}"
              >
                View Public Job
              </a>
            `
            : ''
        }

      </div>

    </article>
  `;

}).join('');

} catch (err) {

console.error('Could not load employer jobs:', err);

showEmployerJobsMessage(
  err.message || 'Could not load your jobs.'
);

results.innerHTML = '';

}
}

async function changeJobStatus(jobId, newStatus) {

try {

const { sb, user } = await getEmployer();

const { error } = await sb
  .from('jobs')
  .update({
    status: newStatus,
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId)
  .eq('employer_user_id', user.id);

if (error) throw error;

showEmployerJobsMessage(
  'Job status updated successfully.',
  true
);

await loadEmployerJobs();

} catch (err) {

console.error('Could not update job:', err);

showEmployerJobsMessage(
  err.message || 'Could not update the job.'
);

}
}

document.addEventListener('DOMContentLoaded', async () => {

try {
await getEmployer();

await loadEmployerJobs();


} catch (err) {

console.error(err);

showEmployerJobsMessage(
  err.message || 'Please sign in to continue.'
);

}

});
