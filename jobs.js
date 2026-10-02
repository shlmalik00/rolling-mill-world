console.log("RMW JOBS TEST JS LOADED");

document.addEventListener("DOMContentLoaded", function () {
console.log("RMW JOBS DOM READY");

var searchButton = document.getElementById("searchJobs");
var clearButton = document.getElementById("clearFilters");

console.log("SEARCH BUTTON:", searchButton);
console.log("CLEAR BUTTON:", clearButton);

if (searchButton) {
searchButton.onclick = function () {
alert("Search Jobs button is working");
};
}

if (clearButton) {
clearButton.onclick = function () {
alert("Clear Filters button is working");
};
}
});
