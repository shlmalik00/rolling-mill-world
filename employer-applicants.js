let applicantsSupabase = null;
let currentUser = null;
let currentJobId = null;

document.addEventListener('DOMContentLoaded', async function () {
try {
applicantsSupabase = await getSupabaseClient();


const result = await applicantsSupabase.auth.getUser();

if (result.error) {
  throw result.error;
}

if (!result.data.user) {
  showError('Please sign in to view job applicants.');
  return;
}

currentUser = result.data.user;

const params = new URLSearchParams(window.location.search);
currentJobId = params.get('id');

if (!currentJobId) {
  showError('No job was selected.');
  return;
}

await loadApplicants();


} catch (error) {
console.error('Employer applicants page error:', error);
showError(error.message || 'Could not load applicants.');
}
});

async function loadApplicants() {
setLoading(true);

try {
const jobResult = await applicantsSupabase
.from('jobs')
.select('id, title, location, country, employer_user_id')
.eq('id', currentJobId)
.eq('employer_user_id', currentUser.id)
.single();


if (jobResult.error) {
  throw new Error(
    'This job was not found or you do not have permission to view it.'
  );
}

const job = jobResult.data;

const jobTitle = document.getElementById('jobTitle');
const jobLocation = document.getElementById('jobLocation');
const jobInfo = document.getElementById('jobInfo');

if (jobTitle) {
  jobTitle.textContent = job.title || 'Untitled Job';
}

if (jobLocation) {
  const locationParts = [];

  if (job.location) {
    locationParts.push(job.location);
  }

  if (job.country) {
    locationParts.push(job.country);
  }

  jobLocation.textContent =
    locationParts.length
      ? locationParts.join(', ')
      : 'Location not specified';
}

if (jobInfo) {
  jobInfo.style.display = 'block';
}


const applicationsResult = await applicantsSupabase
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
  .order('created_at', { ascending: false });

if (applicationsResult.error) {
  throw applicationsResult.error;
}

renderApplicants(applicationsResult.data || []);


} finally {
setLoading(false);
}
}

function renderApplicants(applications) {
const container = document.getElementById('applicantsResults');

if (!container) {
throw new Error(
'The applicantsResults element was not found in the HTML.'
);
}

if (!applications.length) {
container.innerHTML =
'<div class="empty-state">' +
'<h2>No applicants yet</h2>' +
'<p>No applications have been submitted for this job.</p>' +
'</div>';


return;


}

let html = '';

applications.forEach(function (application) {


let applicant = application.job_seekers;

if (Array.isArray(applicant)) {
  applicant = applicant[0];
}

if (!applicant) {
  return;
}

const name =
  applicant.full_name || 'Unnamed Applicant';

const professionalTitle =
  applicant.professional_title ||
  'Professional title not provided';

const phone =
  applicant.phone || 'Not provided';

const location =
  applicant.location || 'Not provided';

const preferredLocations =
  applicant.preferred_locations || 'Not provided';

let experience = 'Not provided';

if (
  applicant.experience_years !== null &&
  applicant.experience_years !== undefined
) {
  experience =
    applicant.experience_years + ' years';
}

const rollingMillExperience =
  applicant.rolling_mill_experience ||
  'Not provided';

const skills =
  applicant.skills || 'Not provided';

const availability =
  applicant.availability || 'Not provided';

const expectedSalary =
  applicant.expected_salary || 'Not provided';

const coverMessage =
  application.cover_message ||
  'No cover message provided.';

const appliedDate =
  application.created_at
    ? new Date(application.created_at).toLocaleString()
    : 'Unknown';

const status =
  application.status || 'submitted';


let resumeHtml = '<span>No resume uploaded.</span>';

if (applicant.resume_path) {
  resumeHtml =
    '<button ' +
      'type="button" ' +
      'class="btn blue view-resume-button" ' +
      'data-resume-path="' +
      escapeHtml(applicant.resume_path) +
      '"' +
    '>' +
      'View Resume' +
    '</button>';
}


html +=
  '<article class="applicant-card">' +

    '<div class="applicant-header">' +

      '<div>' +
        '<h2 class="applicant-name">' +
          escapeHtml(name) +
        '</h2>' +

        '<p class="applicant-title">' +
          escapeHtml(professionalTitle) +
        '</p>' +
      '</div>' +

      '<div class="status-control">' +

        '<label for="status-' +
          application.id +
        '">' +
          'Application Status' +
        '</label>' +

        '<select ' +
          'id="status-' +
          application.id + '" ' +
          'data-application-id="' +
          application.id + '" ' +
          'data-previous-value="' +
          escapeHtml(status) +
          '" ' +
          'class="application-status"' +
        '>' +

          '<option value="submitted" ' +
            (status === 'submitted' ? 'selected' : '') +
          '>' +
            'Submitted' +
          '</option>' +

          '<option value="reviewing" ' +
            (status === 'reviewing' ? 'selected' : '') +
          '>' +
            'Reviewing' +
          '</option>' +

          '<option value="shortlisted" ' +
            (status === 'shortlisted' ? 'selected' : '') +
          '>' +
            'Shortlisted' +
          '</option>' +

          '<option value="rejected" ' +
            (status === 'rejected' ? 'selected' : '') +
          '>' +
            'Rejected' +
          '</option>' +

          '<option value="hired" ' +
            (status === 'hired' ? 'selected' : '') +
          '>' +
            'Hired' +
          '</option>' +

        '</select>' +

      '</div>' +

    '</div>' +


    '<div class="applicant-grid">' +

      '<div class="info-item">' +
        '<strong>Phone</strong>' +
        '<span>' +
          escapeHtml(phone) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Location</strong>' +
        '<span>' +
          escapeHtml(location) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Preferred Locations</strong>' +
        '<span>' +
          escapeHtml(preferredLocations) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Experience</strong>' +
        '<span>' +
          escapeHtml(experience) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Rolling Mill Experience</strong>' +
        '<span>' +
          escapeHtml(rollingMillExperience) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Availability</strong>' +
        '<span>' +
          escapeHtml(availability) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Expected Salary</strong>' +
        '<span>' +
          escapeHtml(expectedSalary) +
        '</span>' +
      '</div>' +

      '<div class="info-item">' +
        '<strong>Resume</strong>' +
        resumeHtml +
      '</div>' +

    '</div>' +


    '<div class="info-item">' +
      '<strong>Skills</strong>' +
      '<span>' +
        escapeHtml(skills) +
      '</span>' +
    '</div>' +


    '<div class="cover-message">' +
      '<strong>Cover Message</strong>' +
      '<div>' +
        escapeHtml(coverMessage) +
      '</div>' +
    '</div>' +


    '<div class="applied-date">' +
      'Applied: ' +
      escapeHtml(appliedDate) +
    '</div>' +

  '</article>';


});

container.innerHTML = html;

attachStatusHandlers();
attachResumeHandlers();
}

function attachStatusHandlers() {
const selects =
document.querySelectorAll('.application-status');

selects.forEach(function (select) {


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


});
}

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


const result = await applicantsSupabase
  .from('job_applications')
  .update({
    status: newStatus,
    updated_at: new Date().toISOString()
  })
  .eq('id', applicationId);

if (result.error) {
  throw result.error;
}

selectElement.dataset.previousValue =
  newStatus;

alert(
  'Application status updated successfully.'
);


} catch (error) {


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


} finally {


selectElement.disabled = false;


}
}

function attachResumeHandlers() {
const buttons =
document.querySelectorAll('.view-resume-button');

buttons.forEach(function (button) {


button.addEventListener('click', async function () {

  const resumePath =
    this.dataset.resumePath;

  console.log(
    'Resume path:',
    resumePath
  );

  console.log(
    'Current user:',
    currentUser ? currentUser.id : null
  );

  if (!resumePath) {
    alert('Resume path is missing.');
    return;
  }

  const originalText =
    this.textContent;

  this.disabled = true;
  this.textContent = 'Opening...';

  try {

    const result =
      await applicantsSupabase
        .storage
        .from('resumes')
        .createSignedUrl(
          resumePath,
          300
        );

    console.log(
      'Signed URL response:',
      result.data
    );

    console.log(
      'Signed URL error:',
      result.error
    );

    if (result.error) {
      throw result.error;
    }

    if (
      !result.data ||
      !result.data.signedUrl
    ) {
      throw new Error(
        'Supabase did not return a signed URL.'
      );
    }

    window.open(
      result.data.signedUrl,
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
    this.textContent = originalText;

  }

});


});
}

function setLoading(isLoading) {
const loading =
document.getElementById('loadingMessage');

if (loading) {
loading.style.display =
isLoading ? 'block' : 'none';
}
}

function showError(message) {
setLoading(false);

const errorElement =
document.getElementById('errorMessage');

if (errorElement) {


errorElement.textContent =
  message;

errorElement.style.display =
  'block';


} else {


alert(message);


}
}


function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}




