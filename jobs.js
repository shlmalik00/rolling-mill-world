console.log("RMW JOBS TEST v9 LOADED");

document.addEventListener("DOMContentLoaded", function () {
console.log("RMW JOBS DOM READY");

var searchButton = document.getElementById("searchJobs");
var clearButton = document.getElementById("clearFilters");

console.log("SEARCH BUTTON:", searchButton);
console.log("CLEAR BUTTON:", clearButton);

searchButton.onclick = function () {
console.log("SEARCH BUTTON CLICKED");
alert("Search button works");
};

clearButton.onclick = function () {
console.log("CLEAR BUTTON CLICKED");
alert("Clear button works");
};
});
