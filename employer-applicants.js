let applicantsSupabase = null;
let currentUser = null;
let currentJobId = null;

document.addEventListener('DOMContentLoaded', async function () {
try {
applicantsSupabase = await getSupabaseClient();

```
const {
  data: {
    user
  },
  error: userError
} = await applicantsSupabase.auth.getUser();

if (userError) {
  throw userError;
}

if (!user) {
  showError('Please sign in to view job applicants.');
  return;
}

currentUser = user;

const params = new URLSearchParams(window.location.search);
currentJobId = params.get('id');

if (!currentJobId) {
  showError('No job was selected.');
  return;
}

await loadApplicants();
```

} catch (error) {
console.error('Employer applicants page error:', error);
showError(error.message || 'Could not load applicants.');
}
});

async function loadApplicants() {
setLoading(true);

try {
// --------------------------------------------------
// 1. Load the job and verify employer ownership
// --------------------------------------------------

```
const {
  data: job,
  error: jobError
} = await applicantsSupabase
  .from('jobs')
  .select(`
    id,
    title,
    location,
    country,
    employer_user_id
  `)
  .eq('id', currentJobId)
  .eq('employer_user_id', currentUser.id)
  .single();

if (jobError) {
  throw new Error(
    'This job was not found or you do not have permission to view it.'
  );
}

document.getElementById('jobTitle').textContent =
  job.title || 'Untitled Job';

const locationParts = [
  job.location,
  job.country
].filter(Boolean);

document.getElementById('jobLocation').textContent =
  locationParts.length
    ? locationParts.join(', ')
    : 'Location not specified';

const jobInfo = document.getElementById('jobInfo');

if (jobInfo) {
  jobInfo.style.display = 'block';
}


// --------------------------------------------------
// 2. Load applications
// --------------------------------------------------

const {
  data: applications,
  error: applicationsError
} = await applicantsSupabase
  .from('job_applications')
  .select(`
    id,
    job_id,
    job_seeker_id,
    cover_message,
    status,
    created_at,
    updated_at,
    job_seekers (
      id,
      full_name,
      professional_title,
      phone,
      location,
      preferred_locations,
      skills,
      experience_years,
      rolling_mill_experience,
      availability,
      expected_salary,
      resume_path
    )
  `)
  .eq('job_id', currentJobId)
  .order('created_at', {
    ascending: false
  });

if (applicationsError) {
  throw applicationsError;
}

renderApplicants(applications || []);
```

} finally {
setLoading(false);
}
}

// --------------------------------------------------
// Render applicants
// --------------------------------------------------

function renderApplicants(applications) {
const container = document.getElementById('applicantsResults');

if (!container) {
throw new Error('Applicants results container was not found.');
}

if (!applications.length) {
container.innerHTML = `       <div class="empty-state">         <h2>No applicants yet</h2>         <p>No applications have been submitted for this job.</p>       </div>
    `;

```
return;
```

}

container.innerHTML = applications.map(application => {

```
const applicant = Array.isArray(application.job_seekers)
  ? application.job_seekers[0]
  : application.job_seekers;

if (!applicant) {
  return '';
}

const name =
  applicant.full_name || 'Unnamed Applicant';

const professionalTitle =
  applicant.professional_title ||
  'Professional title not provided';

const location =
  applicant.location || 'Not provided';

const preferredLocations =
  applicant.preferred_locations || 'Not provided';

const experience =
  applicant.experience_years !== null &&
  applicant.experience_years !== undefined
    ? `${applicant.experience_years} years`
    : 'Not provided';

const rollingMillExperience =
  applicant.rolling_mill_experience || 'Not provided';

const skills =
  applicant.skills || 'Not provided';

const availability =
  applicant.availability || 'Not provided';

const expectedSalary =
  applicant.expected_salary || 'Not provided';

const phone =
  applicant.phone || 'Not provided';

const coverMessage =
  application.cover_message ||
  'No cover message provided.';

const appliedDate =
  application.created_at
    ? new Date(application.created_at).toLocaleString()
    : 'Unknown';

const status =
  application.status || 'submitted';


// Resume button

let resumeHtml = '<span>No resume uploaded.</span>';

if (applicant.resume_path) {
  resumeHtml = `
    <button
      type="button"
      class="btn blue view-resume-button"
      data-resume-path="${escapeHtml(applicant.resume_path)}"
    >
      View Resume
    </button>
  `;
}


return `
  <article class="applicant-card">

    <div class="applicant-header">

      <div>
        <h2 class="applicant-name">
          ${escapeHtml(name)}
        </h2>

        <p class="applicant-title">
          ${escapeHtml(professionalTitle)}
        </p>
      </div>


      <div class="status-control">

        <label for="status-${application.id}">
          Application Status
        </label>

        <select
          id="status-${application.id}"
          data-application-id="${application.id}"
          data-previous-value="${escapeHtml(status)}"
          class="application-status"
        >

          <option
            value="submitted"
            ${status === 'submitted' ? 'selected' : ''}
          >
            Submitted
          </option>

          <option
            value="reviewing"
            ${status === 'reviewing' ? 'selected' : ''}
          >
            Reviewing
          </option>

          <option
            value="shortlisted"
            ${status === 'shortlisted' ? 'selected' : ''}
          >
            Shortlisted
          </option>

          <option
            value="rejected"
            ${status === 'rejected' ? 'selected' : ''}
          >
            Rejected
          </option>

          <option
            value="hired"
            ${status === 'hired' ? 'selected' : ''}
          >
            Hired
          </option>

        </select>

      </div>

    </div>


    <div class="applicant-grid">

      <div class="info-item">
        <strong>Phone</strong>
        <span>${escapeHtml(phone)}</span>
      </div>

      <div class="info-item">
        <strong>Location</strong>
        <span>${escapeHtml(location)}</span>
      </div>

      <div class="info-item">
        <strong>Preferred Locations</strong>
        <span>${escapeHtml(preferredLocations)}</span>
      </div>

      <div class="info-item">
        <strong>Experience</strong>
        <span>${escapeHtml(experience)}</span>
      </div>

      <div class="info-item">
        <strong>Rolling Mill Experience</strong>
        <span>${escapeHtml(rollingMillExperience)}</span>
      </div>

      <div class="info-item">
        <strong>Availability</strong>
        <span>${escapeHtml(availability)}</span>
      </div>

      <div class="info-item">
        <strong>Expected Salary</strong>
        <span>${escapeHtml(expectedSalary)}</span>
      </div>

      <div class="info-item">
        <strong>Resume</strong>
        ${resumeHtml}
      </div>

    </div>


    <div class="info-item">
      <strong>Skills</strong>
      <span>${escapeHtml(skills)}</span>
    </div>


    <div class="cover-message">

      <strong>Cover Message</strong>

      <div>
        ${escapeHtml(coverMessage)}
      </div>

    </div>


    <div class="applied-date">
      Applied: ${escapeHtml(appliedDate)}
    </div>

  </article>
`;
```

}).join('');

// IMPORTANT:
// The HTML has now been inserted into the page,
// so attach both sets of button handlers here.

attachStatusHandlers();
attachResumeHandlers();
}

// --------------------------------------------------
// Application status handlers
// --------------------------------------------------

function attachStatusHandlers() {

const selects =
document.querySelectorAll('.application-status');

selects.forEach(select => {

```
select.addEventListener('change', async function () {

  const applicationId =
    this.dataset.applicationId;

  const newStatus =
    this.value;

  await updateApplicationStatus(
    applicationId,
    newStatus,
    this
  );

});
```

});
}

// --------------------------------------------------
// Update application status
// --------------------------------------------------

async function updateApplicationStatus(
applicationId,
newStatus,
selectElement
) {

const originalValue =
selectElement.dataset.previousValue ||
selectElement.value;

selectElement.disabled = true;

try {

```
const {
  error
} = await applicantsSupabase
  .from('job_applications')
  .update({
    status: newStatus,
    updated_at: new Date().toISOString()
  })
  .eq('id', applicationId);

if (error) {
  throw error;
}

selectElement.dataset.previousValue =
  newStatus;

alert(
  'Application status updated successfully.'
);
```

} catch (error) {

```
console.error(
  'Application status update failed:',
  error
);

alert(
  error.message ||
  'Could not update the application status.'
);

selectElement.value =
  originalValue;
```

} finally {

```
selectElement.disabled = false;
```

}
}

// --------------------------------------------------
// Resume handlers
// --------------------------------------------------

function attachResumeHandlers() {

const buttons =
document.querySelectorAll('.view-resume-button');

buttons.forEach(button => {

```
button.addEventListener(
  'click',
  async function () {

    const resumePath =
      this.dataset.resumePath;

    console.log(
      'Resume path:',
      resumePath
    );

    console.log(
      'Current user:',
      currentUser?.id
    );


    if (!resumePath) {

      alert(
        'Resume path is missing.'
      );

      return;
    }


    const originalText =
      this.textContent;


    this.disabled = true;

    this.textContent =
      'Opening...';


    try {

      const {
        data,
        error
      } = await applicantsSupabase
        .storage
        .from('resumes')
        .createSignedUrl(
          resumePath,
          300
        );


      console.log(
        'Signed URL response:',
        data
      );

      console.log(
        'Signed URL error:',
        error
      );


      if (error) {
        throw error;
      }


      if (
        !data ||
        !data.signedUrl
      ) {

        throw new Error(
          'Supabase did not return a signed URL.'
        );

      }


      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      );


    } catch (error) {

      console.error(
        'Resume access error:',
        error
      );

      alert(
        'Resume could not be opened.\n\n' +
        (
          error.message ||
          'Unknown error'
        )
      );


    } finally {

      this.disabled = false;

      this.textContent =
        originalText;

    }

  }
);
```

});
}

// --------------------------------------------------
// Loading
// --------------------------------------------------

function setLoading(isLoading) {

const loading =
document.getElementById(
'loadingMessage'
);

if (loading) {

```
loading.style.display =
  isLoading
    ? 'block'
    : 'none';
```

}
}

// --------------------------------------------------
// Error display
// --------------------------------------------------

function showError(message) {

setLoading(false);

const errorElement =
document.getElementById(
'errorMessage'
);

if (errorElement) {

```
errorElement.textContent =
  message;

errorElement.style.display =
  'block';
```

} else {

```
console.error(
  'Page error:',
  message
);
```

}
}

// --------------------------------------------------
// HTML escaping
// --------------------------------------------------

function escapeHtml(value) {

return String(value ?? '')
.replace(
/&/g,
'&'
)
.replace(
/</g,
'<'
)
.replace(
/>/g,
'>'
)
.replace(
/"/g,
'"'
)
.replace(
/'/g,
'''
);

}
