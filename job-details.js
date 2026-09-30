let jobDetailsSupabase = null;

document.addEventListener('DOMContentLoaded', async function () {
  const loadingMessage = document.getElementById('loadingMessage');
  const jobContent = document.getElementById('jobContent');
  const errorMessage = document.getElementById('errorMessage');

  try {
    jobDetailsSupabase = await getSupabaseClient();

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (!jobId) {
      throw new Error('No job was specified.');
    }

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
      console.error('Job query error:', error);
      throw new Error('This job could not be found.');
    }

    document.title = `${job.title} | Rolling Mill World`;

    document.getElementById('jobTitle').textContent =
      job.title || 'Untitled Job';

    document.getElementById('jobLocation').textContent =
      formatValue(job.location, job.country);

    document.getElementById('jobEmployment').textContent =
      formatValue(job.employment_type);

    document.getElementById('jobExperience').textContent =
      formatValue(job.experience_required);

    document.getElementById('jobSalary').textContent =
      formatValue(job.salary_range);

    document.getElementById('jobAccommodation').textContent =
      formatValue(job.accommodation);

    document.getElementById('jobDeadline').textContent =
      formatDate(job.application_deadline);

    document.getElementById('jobDescription').textContent =
      job.description || 'No description provided.';

    document.getElementById('jobSkills').textContent =
      job.skills_required || 'Not specified';

    const applyButton = document.getElementById('applyButton');

    if (applyButton) {
      applyButton.href =
        `job-apply.html?id=${encodeURIComponent(job.id)}`;
    }

    loadingMessage.style.display = 'none';
    jobContent.style.display = 'block';

  } catch (error) {
    console.error('Job details error:', error);

    loadingMessage.style.display = 'none';

    errorMessage.textContent =
      error.message || 'Could not load this job.';

    errorMessage.style.display = 'block';
  }
});


function formatValue(value, secondValue) {
  const values = [];

  if (value !== null && value !== undefined && String(value).trim()) {
    values.push(String(value).trim());
  }

  if (
    secondValue !== null &&
    secondValue !== undefined &&
    String(secondValue).trim()
  ) {
    values.push(String(secondValue).trim());
  }

  return values.length ? values.join(', ') : 'Not specified';
}


function formatDate(value) {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

