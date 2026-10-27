import { normalizeSchoolEmail, normalizeOtp, isVerifiedSchoolUser, configurationIsReady, friendlyAuthError, sessionMustBeCleared } from './auth-rules.js';
import { persistentAuthOptions } from './auth-session.js';

const $ = (id) => document.getElementById(id);
const config = window.FULIN_CONFIG || {};
let client;
let pendingEmail = '';
let cooldownUntil = 0;
let busy = false;
let cooldownTimer;
let view = 'email';
let transition = 0;
let accountUserId;

window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

function message(id, text = '') {
  $(id).textContent = text;
  $(id).hidden = !text;
}
function showView(next, focus = true) {
  view = next;
  for (const name of ['email', 'otp', 'member']) $(`${name}-screen`).hidden = name !== next;
  if (focus) $(next === 'email' ? 'email' : next === 'otp' ? 'otp' : 'member-title').focus();
}
function clearMessages() { ['email-error', 'otp-error', 'member-error', 'resend-status'].forEach((id) => message(id)); }
function remainingSeconds() { return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)); }
function updateButtons() {
  const seconds = remainingSeconds();
  $('send-button').disabled = busy || !client || seconds > 0;
  $('send-button').querySelector('span').textContent = busy && view === 'email' ? 'Sending…' : seconds > 0 && view === 'email' ? `Please wait ${seconds}s` : 'Send verification code';
  $('verify-button').disabled = busy || !client;
  $('verify-button').querySelector('span').textContent = busy && view === 'otp' ? 'Verifying…' : 'Verify and sign in';
  $('resend-button').disabled = busy || !client || seconds > 0;
  $('resend-button').textContent = seconds > 0 ? `Resend in ${seconds}s` : 'Resend code';
  $('back-button').disabled = busy;
  $('email').readOnly = busy;
  $('otp').readOnly = busy;
  $('signout-button').disabled = busy;
  $('email-form').setAttribute('aria-busy', String(busy && view === 'email'));
  $('otp-form').setAttribute('aria-busy', String(busy && view === 'otp'));
}
function startCooldown() {
  cooldownUntil = Date.now() + 60_000;
  clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    updateButtons();
    if (!remainingSeconds()) clearInterval(cooldownTimer);
  }, 1000);
  updateButtons();
}
async function requestCode(email) {
  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

$('email').addEventListener('input', () => {
  $('email').removeAttribute('aria-invalid');
  message('email-error');
});
$('email').addEventListener('blur', () => {
  if (!$('email').value.trim()) return;
  try { normalizeSchoolEmail($('email').value); }
  catch (error) { $('email').setAttribute('aria-invalid', 'true'); message('email-error', error.message); }
});
$('email-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  clearMessages();
  let email;
  try { email = normalizeSchoolEmail($('email').value); }
  catch (error) { $('email').setAttribute('aria-invalid', 'true'); message('email-error', error.message); $('email').focus(); return; }
  if (!client) { message('email-error', 'Sign-in is not available yet. Please try again later.'); return; }
  if (remainingSeconds()) { message('email-error', 'Please wait before requesting another code.'); return; }
  busy = true; updateButtons();
  try {
    await requestCode(email);
    pendingEmail = email;
    $('sent-email').textContent = email;
    $('email').value = email;
    $('otp').value = '';
    startCooldown();
    showView('otp');
  } catch (error) { message('email-error', friendlyAuthError(error)); }
  finally { busy = false; updateButtons(); }
});

$('back-button').addEventListener('click', () => {
  if (busy) return;
  pendingEmail = '';
  $('otp').value = '';
  clearMessages();
  showView('email');
  updateButtons();
});
$('resend-button').addEventListener('click', async () => {
  if (busy || !client || !pendingEmail || remainingSeconds()) return;
  clearMessages(); busy = true; updateButtons();
  try {
    await requestCode(pendingEmail);
    startCooldown();
    message('resend-status', 'A new code has been sent. Use the code from the latest email.');
  } catch (error) { message('otp-error', friendlyAuthError(error)); }
  finally { busy = false; updateButtons(); }
});

async function openVerifiedAccount() {
  const attempt = ++transition;
  // getUser validates the session with the Auth server. Never trust only cached UI state.
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!isVerifiedSchoolUser(data.user)) {
    await client.auth.signOut({ scope: 'local' });
    throw new Error('invalid-school-session');
  }
  const { data: profile, error: profileError } = await client.from('profiles').select('participant_code').eq('id', data.user.id).single();
  if (attempt !== transition) return;
  if (profileError || !profile?.participant_code) throw new Error('profile-not-ready');
  $('member-email').textContent = data.user.email;
  $('participant-code').textContent = profile.participant_code;
  accountUserId = data.user.id;
  $('otp').value = '';
  pendingEmail = '';
  clearMessages();
  showView('member');
}

$('otp-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !client || !pendingEmail) return;
  clearMessages();
  let token;
  try { token = normalizeOtp($('otp').value, config.otpLength || 8); }
  catch (error) { message('otp-error', error.message); $('otp').focus(); return; }
  busy = true; updateButtons();
  let verified = false;
  try {
    const { error } = await client.auth.verifyOtp({ email: pendingEmail, token, type: 'email' });
    if (error) throw error;
    verified = true;
    await openVerifiedAccount();
  } catch (error) {
    if (verified && !sessionMustBeCleared(error)) {
      showView('email');
      message('email-error', 'Your sign-in is saved, but we could not load your account. Refresh to retry without requesting another code, or contact the activity team.');
    } else if (error.message === 'invalid-school-session') { showView('email'); message('email-error', 'Please sign in with a verified HKU email.'); }
    else if (verified && sessionMustBeCleared(error)) {
      await client.auth.signOut({ scope: 'local' });
      showView('email');
      message('email-error', 'Your session has expired. Please verify your HKU email again.');
    }
    else message('otp-error', friendlyAuthError(error));
  } finally { busy = false; updateButtons(); }
});

function clearAccountScreen() {
  transition += 1;
  accountUserId = undefined;
  $('member-email').textContent = '';
  $('participant-code').textContent = '—';
  $('email').value = '';
  $('otp').value = '';
  pendingEmail = '';
  clearMessages();
  showView('email', false);
}
$('signout-button').addEventListener('click', async () => {
  if (busy || !client) return;
  busy = true; updateButtons();
  try {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    clearAccountScreen();
    $('email').focus();
  } catch (error) { message('member-error', 'Sign-out could not be completed. Check your connection and try again. This browser is still signed in.'); }
  finally { busy = false; updateButtons(); }
});

const dialog = $('privacy-dialog');
$('privacy-open').addEventListener('click', () => dialog.showModal());
$('privacy-close').addEventListener('click', () => dialog.close());
$('privacy-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

async function init() {
  updateButtons();
  if (!configurationIsReady(config)) { $('setup-notice').hidden = false; return; }
  busy = true; updateButtons();
  try {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: persistentAuthOptions()
    });
    $('setup-notice').hidden = true;
    client.auth.onAuthStateChange((event, session) => {
      // Keep the callback synchronous to avoid an auth client lock deadlock.
      if (event === 'SIGNED_OUT') { clearAccountScreen(); updateButtons(); }
      if (event === 'SIGNED_IN' && accountUserId && session?.user?.id !== accountUserId) {
        clearAccountScreen();
        window.location.reload();
      }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session) {
      try { await openVerifiedAccount(); }
      catch (error) {
        if (sessionMustBeCleared(error)) {
          await client.auth.signOut({ scope: 'local' });
          message('email-error', 'Your session has expired. Please verify your HKU email again.');
        } else {
          message('email-error', 'Your sign-in is saved, but we could not verify your account right now. Refresh to retry without requesting another code, or contact the activity team.');
        }
      }
    }
  } catch (error) {
    client = undefined;
    message('email-error', 'We could not connect to the sign-in service. Refresh this page or try again later.');
  } finally { busy = false; updateButtons(); }
}
init();

