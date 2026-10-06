console.log("RMW JOBS v13 LOADED");

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

function setCount(number) {
var count = document.getElementById("jobsCount");

if (!count) {
return;
}

if (number === 1) {
count.textContent = "1 job found";
} else {
count.textContent = number + " jobs found";
}
}

function addField(parent, label, value) {
if (!value) {
return;
}

var p = document.createElement("p");
var strong = document.createElement("strong");

strong.textContent = label + ": ";

p.appendChild(strong);
p.appendChild(document.createTextNode(String(value)));

parent.appendChild(p);
}

function makeLocation(job) {
var value = job.location || "";

if (job.country) {
if (value) {
value += ", ";
}


value += job.country;


}

return value;
}

function renderJobs(jobs) {
var results = document.getElementById("jobsResults");

if (!results) {
return;
}

setCount(jobs.length);

results.innerHTML = "";

if (jobs.length === 0) {
var empty = document.createElement("section");


empty.className = "card";

empty.innerHTML =
  "<h2>No jobs found</h2>" +
  "<p>No published jobs match your search.</p>";

results.appendChild(empty);

return;


}

var i;

for (i = 0; i < jobs.length; i++) {
var job = jobs[i];


var card = document.createElement("section");

card.className = "card";

var title = document.createElement("h2");

title.textContent = job.title || "Untitled Job";

card.appendChild(title);

addField(
  card,
  "Location",
  makeLocation(job)
);

addField(
  card,
  "Employment",
  job.employment_type
);

addField(
  card,
  "Experience",
  job.experience_required
);

addField(
  card,
  "Salary",
  job.salary_range
);

addField(
  card,
  "Skills",
  job.skills_required
);

addField(
  card,
  "Accommodation",
  job.accommodation
);

if (job.description) {
  var description = document.createElement("p");

  description.textContent = job.description;

  card.appendChild(description);
}

addField(
  card,
  "Application deadline",
  job.application_deadline
);

var link = document.createElement("a");

link.className = "btn blue";

link.href =
  "job-details.html?id=" +
  encodeURIComponent(job.id);

link.textContent = "View Job";

card.appendChild(link);

results.appendChild(card);


}
}

function loadJobs() {
var results =
document.getElementById("jobsResults");

if (results) {
results.textContent = "Loading jobs...";
}

getJobsClient()
.then(function(client) {


  return client
    .from("jobs")
    .select(
      "id,title,description,location,country,employment_type,experience_required,skills_required,salary_range,accommodation,application_deadline,created_at"
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

  console.log(
    "PUBLISHED JOBS:",
    allJobs.length
  );

  renderJobs(allJobs);

})
.catch(function(error) {

  console.error(
    "JOB LOAD ERROR:",
    error
  );

  var results =
    document.getElementById("jobsResults");

  if (results) {
    results.textContent =
      "Could not load jobs: " +
      (error.message || "Unknown error");
  }
});


}

function matchesExperience(value, selected) {
var match =
String(value || "").match(/[0-9]+/);

if (!match) {
return false;
}

var years =
parseInt(match[0], 10);

if (selected === "0") {
return years <= 2;
}

if (selected === "3") {
return years >= 3 && years <= 5;
}

if (selected === "6") {
return years >= 6 && years <= 10;
}

if (selected === "11") {
return years >= 11;
}

return true;
}

function applyFilters() {
console.log("SEARCH JOBS CLICKED");

var search =
document.getElementById("search")
.value
.trim()
.toLowerCase();

var country =
document.getElementById("country")
.value
.trim()
.toLowerCase();

var location =
document.getElementById("location")
.value
.trim()
.toLowerCase();

var employment =
document.getElementById("employmentType")
.value;

var experience =
document.getElementById("experience")
.value;

var filtered = [];

var i;

for (i = 0; i < allJobs.length; i++) {
var job = allJobs[i];


var text = [
  job.title,
  job.description,
  job.skills_required,
  job.experience_required,
  job.location,
  job.country
]
  .join(" ")
  .toLowerCase();

if (
  search &&
  text.indexOf(search) === -1
) {
  continue;
}

if (
  country &&
  String(job.country || "")
    .toLowerCase()
    .indexOf(country) === -1
) {
  continue;
}

if (
  location &&
  String(job.location || "")
    .toLowerCase()
    .indexOf(location) === -1
) {
  continue;
}

if (
  employment &&
  job.employment_type !== employment
) {
  continue;
}

if (
  experience &&
  !matchesExperience(
    job.experience_required,
    experience
  )
) {
  continue;
}

filtered.push(job);


}

console.log(
"FILTERED JOBS:",
filtered.length
);

renderJobs(filtered);
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

document.addEventListener(
"DOMContentLoaded",
function() {


console.log("RMW JOBS DOM READY");

document.getElementById(
  "searchJobs"
).onclick = applyFilters;

document.getElementById(
  "clearFilters"
).onclick = clearFilters;

document.getElementById(
  "search"
).onkeydown = function(event) {

  if (event.key === "Enter") {
    event.preventDefault();
    applyFilters();
  }
};

document.getElementById(
  "country"
).onkeydown = function(event) {

  if (event.key === "Enter") {
    event.preventDefault();
    applyFilters();
  }
};

document.getElementById(
  "location"
).onkeydown = function(event) {

  if (event.key === "Enter") {
    event.preventDefault();
    applyFilters();
  }
};

loadJobs();


}
);
