let employerJobsClient = null;


async function getEmployerJobsClient() {
  if (employerJobsClient) {
    return employerJobsClient;
  }

  if (typeof getSupabaseClient !== 'function') {
    throw new Error('Authentication system is not available.');
  }

  employerJobsClient =
    await getSupabaseClient();

  return employerJobsClient;
}


function showEmployerJobsMessage(message, ok = false) {
  const el =
    document.getElementById('employerJobsMsg');

  if (!el) return;

  el.textContent = message;
  el.className = ok
    ? 'authMsg ok'
    : 'authMsg';
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function showEmployerJobsArea(isLoggedIn) {
  const login =
    document.getElementById('employerJobsLogin');

  const area =
    document.getElementById('employerJobsArea');

  if (isLoggedIn) {

    if (login) {
      login.style.display = 'none';
    }

    if (area) {
      area.style.display = 'block';
    }

  } else {

    if (login) {
      login.style.display = 'block';
    }

    if (area) {
      area.style.display = 'none';
    }
  }
}


async function getEmployer() {
  const sb =
    await getEmployerJobsClient();

  const { data, error } =
    await sb.auth.getSession();

  if (error) {
    throw error;
  }

  if (
    !data.session ||
    !data.session.user
  ) {
    throw new Error(
      'Please sign in to manage your jobs.'
    );
  }

  return {
    sb,
    user: data.session.user
  };
}


async function loadEmployerJobs() {
  const results =
    document.getElementById(
      'employerJobsResults'
    );

  if (!results) return;

  results.innerHTML =
    '<p>Loading your jobs...</p>';

  try {

    const { sb, user } =
      await getEmployer();

    const { data, error } =
      await sb
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
          status,
          created_at,
          updated_at
        `)
        .eq(
          'employer_user_id',
          user.id
        )
        .order(
          'created_at',
          { ascending: false }
        );


    if (error) {
      throw error;
    }


    const jobs = data || [];


    if (!jobs.length) {

      results.innerHTML = `
        <section class="card">

          <h2>No jobs yet</h2>

          <p>
            You have not posted any jobs yet.
          </p>

          <a
            class="btn blue"
            href="post-job.html"
          >
            Post Your First Job
          </a>

        </section>
      `;

      return;
    }


    results.innerHTML =
      jobs.map(job => {

        const location = [
          job.location,
          job.country
        ]
          .filter(Boolean)
          .join(', ');


        const createdDate =
          job.created_at
            ? new Date(
                job.created_at
              ).toLocaleDateString()
            : '';


        const deadline =
          job.application_deadline
            ? new Date(
                job.application_deadline +
                'T00:00:00'
              ).toLocaleDateString()
            : '';


        return `
          <article class="card">

            <h2>
              ${escapeHtml(job.title)}
            </h2>


            <p>
              <strong>Status:</strong>
              ${escapeHtml(job.status)}
            </p>


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
                    ${escapeHtml(
                      job.employment_type
                    )}
                  </p>
                `
                : ''
            }


            ${
              job.experience_required
                ? `
                  <p>
                    <strong>Experience:</strong>
                    ${escapeHtml(
                      job.experience_required
                    )}
                  </p>
                `
                : ''
            }


            ${
              job.skills_required
                ? `
                  <p>
                    <strong>Skills:</strong>
                    ${escapeHtml(
                      job.skills_required
                    )}
                  </p>
                `
                : ''
            }


            ${
              job.salary_range
                ? `
                  <p>
                    <strong>Salary:</strong>
                    ${escapeHtml(
                      job.salary_range
                    )}
                  </p>
                `
                : ''
            }


            ${
              job.accommodation
                ? `
                  <p>
                    <strong>Accommodation:</strong>
                    ${escapeHtml(
                      job.accommodation
                    )}
                  </p>
                `
                : ''
            }


            ${
              deadline
                ? `
                  <p>
                    <strong>Application deadline:</strong>
                    ${escapeHtml(deadline)}
                  </p>
                `
                : ''
            }


            ${
              createdDate
                ? `
                  <p>
                    <strong>Posted:</strong>
                    ${escapeHtml(createdDate)}
                  </p>
                `
                : ''
            }


            <p>
              ${escapeHtml(
                job.description
              )}
            </p>


            <div
              style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-top:18px;
              "
            >

              ${
                job.status === 'draft'
                  ? `
                    <button
                      class="btn blue"
                      type="button"
                      onclick="changeJobStatus(
                        '${job.id}',
                        'published'
                      )"
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
                      onclick="changeJobStatus(
                        '${job.id}',
                        'closed'
                      )"
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
                      onclick="changeJobStatus(
                        '${job.id}',
                        'published'
                      )"
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
                      href="job-details.html?id=${encodeURIComponent(
                        job.id
                      )}"
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

    console.error(
      'Could not load employer jobs:',
      err
    );

    showEmployerJobsMessage(
      err.message ||
      'Could not load your jobs.'
    );

    results.innerHTML = '';
  }
}


async function changeJobStatus(
  jobId,
  newStatus
) {

  try {

    const { sb, user } =
      await getEmployer();


    let confirmationMessage = '';

    if (newStatus === 'published') {
      confirmationMessage =
        'Publish this job? It will become visible on Jobs / Find Jobs.';
    }

    if (newStatus === 'closed') {
      confirmationMessage =
        'Close this job? It will no longer appear in public job searches.';
    }


    if (
      confirmationMessage &&
      !window.confirm(confirmationMessage)
    ) {
      return;
    }


    showEmployerJobsMessage(
      'Updating job status...'
    );


    const { error } =
      await sb
        .from('jobs')
        .update({
          status: newStatus,
          updated_at:
            new Date().toISOString()
        })
        .eq('id', jobId)
        .eq(
          'employer_user_id',
          user.id
        );


    if (error) {
      throw error;
    }


    showEmployerJobsMessage(
      'Job status updated successfully.',
      true
    );


    await loadEmployerJobs();


  } catch (err) {

    console.error(
      'Could not update job:',
      err
    );

    showEmployerJobsMessage(
      err.message ||
      'Could not update the job.'
    );
  }
}


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    try {

      const { user } =
        await getEmployer();

      if (user) {

        showEmployerJobsArea(true);

        await loadEmployerJobs();

      }

    } catch (err) {

      console.error(
        'Employer jobs authentication:',
        err
      );

      showEmployerJobsArea(false);

      showEmployerJobsMessage(
        err.message ||
        'Please sign in to continue.'
      );
    }


    try {

      const sb =
        await getEmployerJobsClient();


      sb.auth.onAuthStateChange(
        () => {

          setTimeout(
            async () => {

              try {

                const { user } =
                  await getEmployer();

                if (user) {

                  showEmployerJobsArea(
                    true
                  );

                  await loadEmployerJobs();

                } else {

                  showEmployerJobsArea(
                    false
                  );
                }

              } catch (err) {

                showEmployerJobsArea(
                  false
                );
              }

            },
            0
          );

        }
      );

    } catch (err) {

      console.error(
        'Employer auth listener failed:',
        err
      );
    }

  }
);

