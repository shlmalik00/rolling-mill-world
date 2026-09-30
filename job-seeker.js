let jobSeekerClient = null;
let currentJobSeeker = null;

async function getJobSeekerClient() {
  if (jobSeekerClient) return jobSeekerClient;

  jobSeekerClient = await getSupabaseClient();

  return jobSeekerClient;
}

function showJobMessage(message, ok = false) {
  const el = document.getElementById('jobMsg');

  if (!el) return;

  el.textContent = message;
  el.className = ok ? 'ok' : '';
}

async function getCurrentUser() {
  const sb = await getJobSeekerClient();

  const {
    data,
    error
  } = await sb.auth.getSession();

  if (error) throw error;

  if (!data.session || !data.session.user) {
    throw new Error(
      'Please sign in before creating a job seeker profile.'
    );
  }

  return {
    sb,
    user: data.session.user
  };
}

function setValue(id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.value = value ?? '';
  }
}

async function loadJobSeekerProfile() {
  try {
    const {
      sb,
      user
    } = await getCurrentUser();

    const {
      data,
      error
    } = await sb
      .from('job_seekers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const metadataName =
        user.user_metadata?.full_name || '';

      setValue('fullName', metadataName);

      return;
    }

    currentJobSeeker = data;

    setValue('fullName', data.full_name);
    setValue('professionalTitle', data.professional_title);
    setValue('phone', data.phone);
    setValue('location', data.location);
    setValue('preferredLocations', data.preferred_locations);
    setValue('skills', data.skills);
    setValue('experienceYears', data.experience_years);
    setValue(
      'rollingMillExperience',
      data.rolling_mill_experience
    );
    setValue('availability', data.availability);
    setValue('expectedSalary', data.expected_salary);

    if (data.resume_path) {
      document.getElementById('currentResume').textContent =
        'A resume is already uploaded. Upload a new file to replace it.';
    }

  } catch (err) {
    console.error(err);
    showJobMessage(
      err.message || 'Could not load your job seeker profile.'
    );
  }
}

function validateResume(file) {
  if (!file) return;

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error('Resume must be 10 MB or smaller.');
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'Please upload a PDF, DOC or DOCX file.'
    );
  }
}

async function uploadResume(sb, user, file) {
  validateResume(file);

  const extension =
    file.name.split('.').pop().toLowerCase();

  const filePath =
    user.id + '/resume.' + extension;

  /*
   * Remove an existing resume first.
   * We use the known extensions because the database stores
   * only the current resume path.
   */

  const oldPaths = [
    user.id + '/resume.pdf',
    user.id + '/resume.doc',
    user.id + '/resume.docx'
  ];

  await sb.storage
    .from('resumes')
    .remove(oldPaths);

  const {
    error
  } = await sb.storage
    .from('resumes')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  return filePath;
}

async function saveJobSeeker(e) {
  e.preventDefault();

  const button =
    document.getElementById('saveJobSeeker');

  if (button) {
    button.disabled = true;
    button.textContent = 'Saving...';
  }

  showJobMessage('Saving your profile...');

  try {
    const {
      sb,
      user
    } = await getCurrentUser();

    const fullName =
      document.getElementById('fullName').value.trim();

    if (!fullName) {
      throw new Error('Full name is required.');
    }

    const resumeInput =
      document.getElementById('resume');

    const file =
      resumeInput?.files?.[0] || null;

    let resumePath =
      currentJobSeeker?.resume_path || null;

    if (file) {
      resumePath =
        await uploadResume(sb, user, file);
    }

    const payload = {
      user_id: user.id,
      full_name: fullName,
      professional_title:
        document.getElementById('professionalTitle').value.trim() || null,
      phone:
        document.getElementById('phone').value.trim() || null,
      location:
        document.getElementById('location').value.trim() || null,
      preferred_locations:
        document.getElementById('preferredLocations').value.trim() || null,
      skills:
        document.getElementById('skills').value.trim() || null,
      experience_years:
        document.getElementById('experienceYears').value
          ? Number(document.getElementById('experienceYears').value)
          : null,
      rolling_mill_experience:
        document.getElementById('rollingMillExperience').value.trim() || null,
      availability:
        document.getElementById('availability').value || null,
      expected_salary:
        document.getElementById('expectedSalary').value.trim() || null,
      resume_path: resumePath,
      updated_at: new Date().toISOString()
    };

    const {
      data,
      error
    } = await sb
      .from('job_seekers')
      .upsert(payload, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    currentJobSeeker = data;

    if (file) {
      document.getElementById('currentResume').textContent =
        'Resume uploaded successfully.';
      resumeInput.value = '';
    }

    showJobMessage(
      'Your job seeker profile was saved successfully.',
      true
    );

  } catch (err) {
    console.error('Job seeker save failed:', err);

    showJobMessage(
      err.message || 'Could not save your profile.'
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Save Job Seeker Profile';
    }
  }
}

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    const form =
      document.getElementById('jobSeekerForm');

    if (form) {
      form.addEventListener(
        'submit',
        saveJobSeeker
      );
    }

    try {
      await getCurrentUser();
      await loadJobSeekerProfile();

    } catch (err) {
      console.error(err);

      showJobMessage(
        err.message ||
        'Please sign in to continue.'
      );
    }
  }
);
