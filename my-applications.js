console.log("MY APPLICATIONS JS v17 LOADED");

document.addEventListener("DOMContentLoaded", async function () {
console.log("MY APPLICATIONS DOM READY");

try {
await refreshAuthUI();
await loadMyApplications();


var sb = await getSupabaseClient();

sb.auth.onAuthStateChange(async function (event, session) {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_IN" && session) {
    await loadMyApplications();
  }

  if (event === "SIGNED_OUT") {
    await loadMyApplications();
  }
});


} catch (error) {
console.error("MY APPLICATIONS ERROR:", error);


hideLoading();

showStatus(
  error.message || "Could not load your applications."
);


}
});

async function loadMyApplications() {
var loading = document.getElementById("loadingMessage");

if (loading) {
loading.textContent = "Checking your sign-in...";
loading.style.display = "block";
}

var sb = await getSupabaseClient();

var sessionResult = await sb.auth.getSession();

if (sessionResult.error) {
throw sessionResult.error;
}

var session = sessionResult.data.session;

console.log(
"SESSION:",
session ? "SIGNED IN" : "SIGNED OUT"
);

if (!session) {
hideLoading();


showStatus(
  "Please sign in to view your job applications."
);

return;


}

clearStatus();

if (loading) {
loading.textContent = "Loading your Job Seeker profile...";
}

var seekerResult = await sb
.from("job_seekers")
.select("id, full_name, professional_title")
.eq("user_id", session.user.id)
.maybeSingle();

if (seekerResult.error) {
throw seekerResult.error;
}

var seeker = seekerResult.data;

console.log("JOB SEEKER:", seeker);

if (!seeker) {
hideLoading();


showStatus(
  "No Job Seeker profile was found for this account."
);

return;


}

if (loading) {
loading.textContent = "Loading your applications...";
}

var applicationsResult = await sb
.from("job_applications")
.select("id, job_id, status, created_at")
.eq("job_seeker_id", seeker.id)
.order("created_at", {
ascending: false
});

if (applicationsResult.error) {
throw applicationsResult.error;
}

var applications = applicationsResult.data || [];

console.log("APPLICATIONS:", applications);

hideLoading();

var content = document.getElementById("applicationsContent");
var list = document.getElementById("applicationList");

if (!content || !list) {
throw new Error(
"Application page elements were not found."
);
}

content.style.display = "block";

if (applications.length === 0) {
list.innerHTML =
'<div class="card">' +
"<h3>No applications yet</h3>" +
"<p>You have not applied for any jobs yet.</p>" +
'<a class="btn blue" href="jobs.html">Find Jobs</a>' +
"</div>";


return;


}

var jobIds = applications.map(function (application) {
return application.job_id;
});

var jobsResult = await sb
.from("jobs")
.select(
"id, title, location, country, employment_type, experience_required"
)
.in("id", jobIds);

if (jobsResult.error) {
throw jobsResult.error;
}

var jobs = jobsResult.data || [];
var jobMap = {};

jobs.forEach(function (job) {
jobMap[job.id] = job;
});

list.innerHTML = applications
.map(function (application) {
var job = jobMap[application.job_id];


  if (!job) {
    return (
      '<div class="card">' +
      "<h3>Job no longer available</h3>" +
      "<p>Status: " +
      escapeHtml(application.status || "submitted") +
      "</p>" +
      "</div>"
    );
  }

  var location = job.location || "";

  if (job.country) {
    if (location) {
      location += ", ";
    }

    location += job.country;
  }

  var appliedDate = new Date(
    application.created_at
  ).toLocaleDateString();

  return (
    '<div class="card applicationCard">' +
    "<h3>" +
    escapeHtml(job.title) +
    "</h3>" +
    "<p>" +
    escapeHtml(location) +
    "</p>" +
    "<p><strong>Employment:</strong> " +
    escapeHtml(job.employment_type || "") +
    "</p>" +
    "<p><strong>Experience:</strong> " +
    escapeHtml(job.experience_required || "") +
    "</p>" +
    "<p><strong>Applied:</strong> " +
    escapeHtml(appliedDate) +
    "</p>" +
    "<p><strong>Status:</strong> " +
    escapeHtml(application.status || "submitted") +
    "</p>" +
    '<a class="btn blue" href="job-details.html?id=' +
    encodeURIComponent(job.id) +
    '">View Job</a>' +
    "</div>"
  );
})
.join("");


}

function showStatus(message) {
var element = document.getElementById("statusMessage");

if (!element) {
return;
}

element.innerHTML = "";

var text = document.createElement("span");
text.textContent = message + " ";

var button = document.createElement("button");

button.type = "button";
button.className = "btn blue";
button.textContent = "Sign In";

button.addEventListener("click", function () {
if (typeof openAuth === "function") {
openAuth("login");
} else {
console.error("openAuth() is not available.");
}
});

element.appendChild(text);
element.appendChild(button);

element.style.display = "block";
}

function clearStatus() {
var element = document.getElementById("statusMessage");

if (!element) {
return;
}

element.innerHTML = "";
element.style.display = "none";
}

function hideLoading() {
var element = document.getElementById("loadingMessage");

if (element) {
element.style.display = "none";
}
}

function escapeHtml(value) {
return String(value == null ? "" : value)
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}
