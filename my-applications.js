console.log("MY APPLICATIONS JS v22 LOADED");

document.addEventListener("DOMContentLoaded", function () {
console.log("MY APPLICATIONS DOM READY");
initApplications();
});

async function initApplications() {
try {
var sb = await getSupabaseClient();


var result = await sb.auth.getSession();

if (result.error) {
  throw result.error;
}

var session = result.data.session;

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

await loadApplications(sb, session);

sb.auth.onAuthStateChange(function (event, newSession) {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_IN" && newSession) {
    loadApplications(sb, newSession);
  }

  if (event === "SIGNED_OUT") {
    hideLoading();
    showStatus(
      "Please sign in to view your job applications."
    );
  }
});


} catch (error) {
console.error("MY APPLICATIONS ERROR:", error);


hideLoading();

showStatus(
  error.message || "Could not load your applications."
);


}
}

async function loadApplications(sb, session) {
var loading = document.getElementById("loadingMessage");

if (loading) {
loading.textContent = "Loading your Job Seeker profile...";
loading.style.display = "block";
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
throw new Error("Application page elements were not found.");
}

content.style.display = "block";

if (applications.length === 0) {
renderEmptyState(list);
return;
}

var jobIds = [];

applications.forEach(function (application) {
if (application.job_id) {
jobIds.push(application.job_id);
}
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

console.log("JOBS:", jobs);

var jobMap = {};

jobs.forEach(function (job) {
jobMap[job.id] = job;
});

list.innerHTML = "";

applications.forEach(function (application) {
var job = jobMap[application.job_id];


if (job) {
  renderApplication(list, application, job);
} else {
  renderMissingJob(list, application);
}


});
}

function renderEmptyState(list) {
var card = document.createElement("div");
card.className = "empty-state";

var title = document.createElement("h2");
title.textContent = "No applications yet";

var text = document.createElement("p");
text.textContent = "You have not applied for any jobs yet.";

var link = document.createElement("a");
link.className = "btn blue";
link.href = "jobs.html";
link.textContent = "Find Jobs";

card.appendChild(title);
card.appendChild(text);
card.appendChild(link);

list.appendChild(card);
}

function renderMissingJob(list, application) {
var card = document.createElement("div");
card.className = "application-item";

var title = document.createElement("h2");
title.textContent = "Job no longer available";

var status = document.createElement("p");
status.textContent =
"Status: " + (application.status || "submitted");

card.appendChild(title);
card.appendChild(status);

list.appendChild(card);
}

function renderApplication(list, application, job) {
var card = document.createElement("div");
card.className = "application-item";

var title = document.createElement("h2");
title.textContent = job.title || "Job";

var location = document.createElement("div");
location.className = "application-company";

var locationText = job.location || "";

if (job.country) {
if (locationText) {
locationText += ", ";
}


locationText += job.country;


}

location.textContent = locationText;

var meta = document.createElement("div");
meta.className = "application-meta";

addMetaLine(
meta,
"Employment",
job.employment_type
);

addMetaLine(
meta,
"Experience",
job.experience_required
);

addMetaLine(
meta,
"Applied",
formatDate(application.created_at)
);

var status = document.createElement("span");
status.className = "application-status";
status.textContent =
application.status || "submitted";

var actions = document.createElement("div");
actions.className = "application-actions";

var viewButton = document.createElement("a");
viewButton.className = "btn blue";
viewButton.href =
"job-details.html?id=" +
encodeURIComponent(job.id);
viewButton.textContent = "View Job";

actions.appendChild(viewButton);

card.appendChild(title);
card.appendChild(location);
card.appendChild(meta);
card.appendChild(status);
card.appendChild(actions);

list.appendChild(card);
}

function addMetaLine(container, label, value) {
var line = document.createElement("div");

var strong = document.createElement("strong");
strong.textContent = label + ": ";

var text = document.createTextNode(
value || "Not specified"
);

line.appendChild(strong);
line.appendChild(text);

container.appendChild(line);
}

function formatDate(value) {
if (!value) {
return "Not available";
}

var date = new Date(value);

if (isNaN(date.getTime())) {
return "Not available";
}

return date.toLocaleDateString();
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

function hideLoading() {
var element = document.getElementById("loadingMessage");

if (element) {
element.style.display = "none";
}
}

