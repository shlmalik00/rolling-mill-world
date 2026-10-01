console.log('MY APPLICATIONS JS v16 LOADED');

document.addEventListener(
  'DOMContentLoaded',
  async function () {

    console.log(
      'MY APPLICATIONS DOM READY'
    );

    try {

      await refreshAuthUI();

      await loadMyApplications();

      var sb =
        await getSupabaseClient();

      sb.auth.onAuthStateChange(
        async function (event, session) {

          console.log(
            'AUTH EVENT:',
            event
          );

          if (
            event === 'SIGNED_IN' &&
            session
          ) {
            await loadMyApplications();
          }

          if (event === 'SIGNED_OUT') {
            await loadMyApplications();
          }

        }
      );

    } catch (error) {

      console.error(
        'MY APPLICATIONS ERROR:',
        error
      );

      hideLoading();

      showStatus(
        error.message ||
        'Could not load your applications.'
      );
    }
  }
);
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
