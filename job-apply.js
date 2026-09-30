document.addEventListener('DOMContentLoaded', async function () {

  const loading = document.getElementById('loadingMessage');
  const content = document.getElementById('applicationContent');
  const status = document.getElementById('statusMessage');

  try {

    loading.textContent = 'JavaScript is running...';

    if (typeof getSupabaseClient !== 'function') {
      throw new Error('auth.js is not loaded.');
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error('Supabase client could not be created.');
    }

    loading.textContent = 'Connecting to Supabase...';

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (!jobId) {
      throw new Error('No job ID in the URL.');
    }

    loading.textContent = 'Loading job from database...';

    const { data, error } = await supabase
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
      throw new Error('Job not found or not published.');
    }

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

    loading.style.display = 'none';
    content.style.display = 'block';

  } catch (error) {

    console.error(error);

    loading.style.display = 'none';
    content.style.display = 'block';

    status.textContent = 'ERROR: ' + error.message;
    status.className = 'status-message show error';
  }

});


