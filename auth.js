let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const configRes = await fetch('/api/config');
  if (!configRes.ok) throw new Error('Could not load Supabase configuration.');
  const config = await configRes.json();
  if (!config.url || !config.key) throw new Error('Supabase configuration is missing.');
  supabaseClient = window.supabase.createClient(config.url, config.key);
  return supabaseClient;
}

function showAuthMessage(text, ok = false) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text;
  el.className = ok ? 'authMsg ok' : 'authMsg';
}

function openAuth(mode = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('show');
  document.body.classList.add('modalOpen');
  setAuthMode(mode);
}

function closeAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('show');
  document.body.classList.remove('modalOpen');
  showAuthMessage('');
}

function setAuthMode(mode) {
  const isSignup = mode === 'signup';
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const submit = document.getElementById('authSubmit');
  const toggle = document.getElementById('authToggle');
  const name = document.getElementById('authName');
  if (title) title.textContent = isSignup ? 'Create your account' : 'Welcome back';
  if (subtitle) subtitle.textContent = isSignup ? 'Create a free Rolling Mill World account.' : 'Sign in to your Rolling Mill World account.';
  if (submit) submit.textContent = isSignup ? 'Create account' : 'Sign in';
  if (toggle) toggle.innerHTML = isSignup ? 'Already have an account? <button type="button" onclick="setAuthMode(\'login\')">Sign in</button>' : 'New to Rolling Mill World? <button type="button" onclick="setAuthMode(\'signup\')">Create an account</button>';
  if (name) name.style.display = isSignup ? 'block' : 'none';
  showAuthMessage('');
  document.getElementById('authMode').value = mode;
}

async function refreshAuthUI() {
  try {
    const sb = await getSupabaseClient();
    const { data } = await sb.auth.getSession();
    const loginBtn = document.getElementById('loginBtn');
    const accountBtn = document.getElementById('accountBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (data.session) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (accountBtn) { accountBtn.style.display = 'inline-flex'; accountBtn.textContent = data.session.user.email || 'My account'; }
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (accountBtn) accountBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  } catch (err) {
    console.warn(err);
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('authMode').value;
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const button = document.getElementById('authSubmit');
  button.disabled = true;
  showAuthMessage('Please wait…');
  try {
    const sb = await getSupabaseClient();
if (mode === 'signup') {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) throw error;

  if (data.session) {
    showAuthMessage('Account created successfully.', true);
    closeAuth();
  } else {
    showAuthMessage(
      'Account created. Please check your email to confirm your account.',
      true
    );
  }
} else {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  closeAuth();

  if (data && data.session) {
    const accountBtn = document.getElementById('accountBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) loginBtn.style.display = 'none';

    if (accountBtn) {
      accountBtn.style.display = 'inline-flex';
      accountBtn.textContent = 'My account';
    }

    if (logoutBtn) {
      logoutBtn.style.display = 'inline-flex';
    }
  }
}

await refreshAuthUI();
  try {
    const sb = await getSupabaseClient();
    sb.auth.onAuthStateChange(() => refreshAuthUI());
  } catch (err) {
    console.warn(err);
  }
});
