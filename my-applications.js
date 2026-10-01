console.log("MY APPLICATIONS JS v19 LOADED");

document.addEventListener("DOMContentLoaded", function () {
console.log("MY APPLICATIONS DOM READY");
initMyApplications();
});

async function initMyApplications() {
try {
await refreshAuthUI();

```
await loadMyApplications();

var sb = await getSupabaseClient();

sb.auth.onAuthStateChange(function (event, session) {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_IN" && session) {
    loadMyApplications();
  }

  if (event === "SIGNED_OUT") {
    loadMyApplications();
  }
});
```

} catch (error) {
console.error("MY APPLICATIONS ERROR:", error);
hideLoading();
showStatus(error.message || "Could not load your applications.");
}
}

async function loadMyApplications() {
var loading = document.getElementById("loadingMessage");

if (loading) {
loading.textContent = "Checking your sign-in...";
loading.style.display = "block";
}

var sb = await getSupabaseClient();
var result = await sb.auth.getSession();

if (result.error) {
throw result.error;
}

var session = result.data.session;

console.log("SESSION:", session ? "SIGNED IN" : "SIGNED OUT");

if (!session) {
hideLoading();
showStatus("Please sign in to view your job applications.");
return;
}

clearStatus();

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
showStatus("No Job Seeker profile was found for this account.");
return;
}

if (loading) {
loading.textContent = "Loading your applications...";
}

var applicationsResult = await sb
.from("job_applications")
.select("id, job_id, status, created_at")
.eq("job_seeker_id", seeker.id)
.order("created_at", { ascending: false });

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
showNoApplications(list);
return;
}

var jobIds = applications.map(function (item) {
return item.job_id;
});

var jobsResult = await sb
.from("jobs")
.select("id, title, location, country, employment_type, experience_required")
.in("id", jobIds);

if (jobsResult.error) {
throw jobsResult.error;
}

var jobs = jobsResult.data || [];
var jobMap = {};

jobs.forEach(function (job) {
jobMap[job.id] = job;
});

list.innerHTML = "";

applications.forEach(function (application) {
var job = jobMap[application.job_id];

```
if (!job) {
  addMissingJob(list, application);
  return;
}

addApplicationCard(list, application, job);
```

});
}

function showNoApplications(list) {
var card = document.createElement("div");
card.className = "card";

var title = document.createElement("h3");
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

function addMissingJob(list, application) {
var card = document.createElement("div");
card.className = "card";

var title = document.createElement("h3");
title.textContent = "Job no longer available";

var text = document.createElement("p");
text.textContent =
"Status: " + (application.status || "submitted");

card.appendChild(title);
card.appendChild(text);

list.appendChild(card);
}

function addApplicationCard(list, application, job) {
var card = document.createElement("div");
card.className = "card applicationCard";

var title = document.createElement("h3");
title.textContent = job.title || "Job";

var location = "";

if (job.location) {
location = job.location;
}

if (job.country) {
if (location) {
location += ", ";
}

```
location += job.country;
```

}

var locationText = document.createElement("p");
locationText.textContent = location;

var employment = document.createElement("p");
employment.innerHTML =
"<strong>Employment:</strong> " +
escapeHtml(job.employment_type || "");

var experience = document.createElement("p");
experience.innerHTML =
"<strong>Experience:</strong> " +
escapeHtml(job.experience_required || "");

var applied = document.createElement("p");
applied.innerHTML =
"<strong>Applied:</strong> " +
new Date(application.created_at).toLocaleDateString();

var status = document.createElement("p");
status.innerHTML =
"<strong>Status:</strong> " +
escapeHtml(application.status || "submitted");

var link = document.createElement("a");
link.className = "btn blue";
link.href =
"job-details.html?id=" +
encodeURIComponent(job.id);
link.textContent = "View Job";

card.appendChild(title);
card.appendChild(locationText);
card.appendChild(employment);
card.appendChild(experience);
card.appendChild(applied);
card.appendChild(status);
card.appendChild(link);

list.appendChild(card);
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
