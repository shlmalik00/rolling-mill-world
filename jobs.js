console.log("RMW JOBS JS v8 LOADED");

var jobsClient = null;
var allJobs = [];

function getJobsClient() {
if (jobsClient) {
return Promise.resolve(jobsClient);
}

return getSupabaseClient().then(function(client) {
jobsClient = client;
return client;
});
}

function escapeHtml(value) {
if (value === null || value === undefined) {
return "";
}

return String(value)
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function renderJobs(jobs) {
var results = document.getElementById("jobsResults");
var count = document.getElementById("jobsCount");

if (!results) {
return;
}

if (count) {
if (jobs.length === 1) {
count.textContent = "1 job found";
} else {
count.textContent = jobs.length + " jobs found";
}
}

if (jobs.length === 0) {
results.innerHTML =
'<section class="card">' +
"<h2>No jobs found</h2>" +
"<p>No published jobs match your search.</p>" +
"</section>";


return;


}

var html = "";
var i;
var job;
var locationText;

for (i = 0; i < jobs.length; i++) {
job = jobs[i];


locationText = "";

if (job.location) {
  locationText = job.location;
}

if (job.country) {
  if (locationText) {
    locationText = locationText + ", ";
  }

  locationText = locationText + job.country;
}

html = html + '<article class="card">';

html = html +
  "<h2>" +
  escapeHtml(job.title) +
  "</h2>";

if (locationText) {
  html = html +
    "<p><strong>Location:</strong> " +
    escapeHtml(locationText) +
    "</p>";
}

if (job.employment_type) {
  html = html +
    "<p><strong>Employment:</strong> " +
    escapeHtml(job.employment_type) +
    "</p>";
}

if (job.experience_required) {
  html = html +
    "<p><strong>Experience:</strong> " +
    escapeHtml(job.experience_required) +
    "</p>";
}

if (job.salary_range) {
  html = html +
    "<p><strong>Salary:</strong> " +
    escapeHtml(job.salary_range) +
    "</p>";
}

if (job.description) {
  html = html +
    "<p>" +
    escapeHtml(job.description) +
    "</p>";
}

if (job.skills_required) {
  html = html +
    "<p><strong>Skills:</strong> " +
    escapeHtml(job.skills_required) +
    "</p>";
}

if (job.accommodation) {
  html = html +
    "<p><strong>Accommodation:</strong> " +
    escapeHtml(job.accommodation) +
    "</p>";
}

if (job.application_deadline) {
  html = html +
    "<p><strong>Application deadline:</strong> " +
    escapeHtml(job.application_deadline) +
    "</p>";
}

html = html +
  '<a class="btn blue" href="job-details.html?id=' +
  encodeURIComponent(job.id) +
  '">' +
  "View Job" +
  "</a>";

html = html + "</article>";


}

results.innerHTML = html;
}

function loadJobs() {
var results = document.getElementById("jobsResults");

if (results) {
results.innerHTML = "<p>Loading jobs...</p>";
}

getJobsClient()
.then(function(sb) {
return sb
.from("jobs")
.select(
"id, title, description, location, country, employment_type, experience_required, skills_required, salary_range, accommodation, application_deadline, created_at"
)
.eq("status", "published")
.order("created_at", {
ascending: false
});
})
.then(function(response) {
if (response.error) {
throw response.error;
}


  allJobs = response.data || [];

  console.log("PUBLISHED JOBS:", allJobs.length);

  renderJobs(allJobs);
})
.catch(function(error) {
  console.error("Could not load jobs:", error);

  if (results) {
    results.innerHTML =
      '<section class="card">' +
      "<h2>Could not load jobs</h2>" +
      "<p>" +
      escapeHtml(error.message || "Please try again.") +
      "</p>" +
      "</section>";
  }
});


}

function applyFilters() {
console.log("SEARCH JOBS CLICKED");

var searchInput = document.getElementById("search");
var countryInput = document.getElementById("country");
var locationInput = document.getElementById("location");
var employmentInput = document.getElementById("employmentType");
var experienceInput = document.getElementById("experience");

var search = searchInput.value.trim().toLowerCase();
var country = countryInput.value.trim().toLowerCase();
var location = locationInput.value.trim().toLowerCase();
var employment = employmentInput.value;
var experience = experienceInput.value;

var filteredJobs = [];
var i;
var job;
var text;
var years;
var match;

for (i = 0; i < allJobs.length; i++) {
job = allJobs[i];


if (search) {
  text =
    (job.title || "") + " " +
    (job.description || "") + " " +
    (job.skills_required || "") + " " +
    (job.experience_required || "") + " " +
    (job.location || "") + " " +
    (job.country || "");

  text = text.toLowerCase();

  if (text.indexOf(search) === -1) {
    continue;
  }
}

if (country) {
  text = String(job.country || "").toLowerCase();

  if (text.indexOf(country) === -1) {
    continue;
  }
}

if (location) {
  text = String(job.location || "").toLowerCase();

  if (text.indexOf(location) === -1) {
    continue;
  }
}

if (employment) {
  if (job.employment_type !== employment) {
    continue;
  }
}

if (experience) {
  match = String(job.experience_required || "").match(/[0-9]+/);

  if (!match) {
    continue;
  }

  years = parseInt(match[0], 10);

  if (experience === "0" && years > 2) {
    continue;
  }

  if (experience === "3" && (years < 3 || years > 5)) {
    continue;
  }

  if (experience === "6" && (years < 6 || years > 10)) {
    continue;
  }

  if (experience === "11" && years < 11) {
    continue;
  }
}

filteredJobs.push(job);


}

console.log("FILTERED JOBS:", filteredJobs.length);

renderJobs(filteredJobs);
}

function clearFilters() {
console.log("CLEAR FILTERS CLICKED");

document.getElementById("search").value = "";
document.getElementById("country").value = "";
document.getElementById("location").value = "";
document.getElementById("employmentType").value = "";
document.getElementById("experience").value = "";

renderJobs(allJobs);
}

document.addEventListener("DOMContentLoaded", function() {
console.log("RMW JOBS DOM READY");

var searchButton = document.getElementById("searchJobs");
var clearButton = document.getElementById("clearFilters");

console.log("SEARCH BUTTON:", searchButton);
console.log("CLEAR BUTTON:", clearButton);

if (searchButton) {
searchButton.onclick = applyFilters;
}

if (clearButton) {
clearButton.onclick = clearFilters;
}

document.getElementById("search").onkeydown = function(event) {
if (event.key === "Enter") {
event.preventDefault();
applyFilters();
}
};

document.getElementById("country").onkeydown = function(event) {
if (event.key === "Enter") {
event.preventDefault();
applyFilters();
}
};

document.getElementById("location").onkeydown = function(event) {
if (event.key === "Enter") {
event.preventDefault();
applyFilters();
}
};

loadJobs();
});
