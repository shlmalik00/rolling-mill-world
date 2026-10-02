console.log("RMW JOBS v11 LOADED");

var jobsClient = null;

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
console.log("STARTING JOB LOAD");

getJobsClient().then(function(client) {
console.log("SUPABASE CLIENT READY");

```
return client
  .from("jobs")
  .select("*")
  .eq("status", "published");
```

}).then(function(response) {

```
console.log("SUPABASE RESPONSE:", response);

if (response.error) {
  console.error("DATABASE ERROR:", response.error);
  return;
}

var jobs = response.data || [];

console.log("NUMBER OF JOBS:", jobs.length);

var count = document.getElementById("jobsCount");
var results = document.getElementById("jobsResults");

count.textContent = jobs.length + " jobs found";

if (jobs.length === 0) {
  results.textContent = "No published jobs found.";
  return;
}

results.textContent =
  "First job: " +
  jobs[0].title;
```

}).catch(function(error) {

```
console.error("JOB LOAD FAILED:", error);
```

});
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
