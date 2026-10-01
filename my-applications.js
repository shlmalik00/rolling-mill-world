function showStatus(message) {

var element =
document.getElementById(
'statusMessage'
);

if (!element) {
return;
}

element.innerHTML = '';

var text =
document.createElement('span');

text.textContent =
message + ' ';

var button =
document.createElement('button');

button.type = 'button';
button.className = 'btn blue';
button.textContent = 'Sign In';

button.addEventListener(
'click',
function () {
if (typeof openAuth === 'function') {
openAuth('login');
} else {
console.error(
'openAuth() is not available.'
);
}
}
);

element.appendChild(text);
element.appendChild(button);

element.style.display = 'block';
}
