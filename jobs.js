console.log("RMW JOBS v10 LOADED");

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

function loadJobs() {
var results = document.getElementById("jobsResults");
var count = document.getElementById("jobsCount");

results.innerHTML = "<p>Loading jobs...</p>";

getJobsClient()
.then(function(sb) {
return sb
.from("jobs")
.select("*")
.eq("status", "published")
.order("created_at", {
ascending: false
});
})
.then(function(response) {
if (response.error) {
throw response.error;
}

```
  allJobs = response.data || [];

  console.log("PUBLISHED JOBS:", allJobs);

  if (count) {
    count.textContent =
      allJobs.length + " jobs found";
  }

  if (allJobs.length === 0) {
    results.innerHTML =
      "<section class=\"card\">" +
      "<h2>No jobs found</h2>" +
      "<p>There are currently no published jobs.</p>" +
      "</section>";

    return;
  }

  var html = "";
  var i;

  for (i = 0; i < allJobs.length; i++) {
    html +=
      "<section class=\"card\">" +
      "<h2>" +
      (allJobs[i].title || "Untitled Job") +
      "</h2>" +
      "<p><strong>Location:</strong> " +
      (allJobs[i].location || "") +
      ", " +
      (allJobs[i].country || "") +
      "</p>" +
      "<p><strong>Employment:</strong> " +
      (allJobs[i].employment_type || "") +
      "</p>" +
      "<p><strong>Experience:</strong> " +
      (allJobs[i].experience_required || "") +
      "</p>" +
      "</section>";
  }

  results.innerHTML = html;
})
.catch(function(error) {
  console.error("LOAD JOBS ERROR:", error);

  results.innerHTML =
    "<section class=\"card\">" +
    "<h2>Could not load jobs</h2>" +
    "<p>" +
    (error.message || "Unknown error") +
    "</p>" +
    "</section>";
});
```

}

document.addEventListener("DOMContentLoaded", function() {
console.log("RMW JOBS DOM READY");

var searchButton =
document.getElementById("searchJobs");

var clearButton =
document.getElementById("clearFilters");

searchButton.onclick = function() {
console.log("SEARCH JOBS CLICKED");
};

clearButton.onclick = function() {
console.log("CLEAR FILTERS CLICKED");
};

loadJobs();
});
