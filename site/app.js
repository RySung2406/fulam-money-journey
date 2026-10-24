import { normalizeSchoolEmail, normalizeOtp, isVerifiedSchoolUser, configurationIsReady, friendlyAuthError } from './auth-rules.js';

const $ = (id) => document.getElementById(id);
const config = window.FULIN_CONFIG || {};
let client;
let pendingEmail = '';
let cooldownUntil = 0;
let busy = false;
let cooldownTimer;
let view = 'email';
let transition = 0;

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
  $('send-button').querySelector('span').textContent = busy && view === 'email' ? '正在傳送…' : seconds > 0 && view === 'email' ? `請等候 ${seconds} 秒` : '傳送驗證碼';
  $('verify-button').disabled = busy || !client;
  $('verify-button').querySelector('span').textContent = busy && view === 'otp' ? '處理中…' : '驗證並登入';
  $('resend-button').disabled = busy || !client || seconds > 0;
  $('resend-button').textContent = seconds > 0 ? `${seconds} 秒後重寄` : '重新傳送';
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
  if (!client) { message('email-error', '登入服務尚未開放，請稍後再試。'); return; }
  if (remainingSeconds()) { message('email-error', '請稍候再要求驗證碼。'); return; }
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
    message('resend-status', '新的驗證碼已寄出，請使用最新一封電郵中的驗證碼。');
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
  try { token = normalizeOtp($('otp').value, config.otpLength || 6); }
  catch (error) { message('otp-error', error.message); $('otp').focus(); return; }
  busy = true; updateButtons();
  try {
    const { error } = await client.auth.verifyOtp({ email: pendingEmail, token, type: 'email' });
    if (error) throw error;
    await openVerifiedAccount();
  } catch (error) {
    if (error.message === 'profile-not-ready') {
      await client.auth.signOut({ scope: 'local' });
      showView('email');
      message('email-error', '電郵驗證已完成，但帳戶資料尚未準備好。請通知活動工作人員，稍後再要求驗證碼。');
    } else if (error.message === 'invalid-school-session') { showView('email'); message('email-error', '請使用已驗證的 HKU 學校電郵登入。'); }
    else message('otp-error', friendlyAuthError(error));
  } finally { busy = false; updateButtons(); }
});

function clearAccountScreen() {
  transition += 1;
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
  } catch (error) { message('member-error', '登出尚未完成，請檢查網絡後再試。共用裝置請關閉此分頁。'); }
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
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: window.sessionStorage, storageKey: 'fulin.auth.session' }
    });
    $('setup-notice').hidden = true;
    client.auth.onAuthStateChange((event) => {
      // Keep the callback synchronous to avoid an auth client lock deadlock.
      if (event === 'SIGNED_OUT') { clearAccountScreen(); updateButtons(); }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session) {
      try { await openVerifiedAccount(); }
      catch (error) {
        await client.auth.signOut({ scope: 'local' });
        message('email-error', error.message === 'profile-not-ready' ? '帳戶資料尚未準備好，請通知活動工作人員。' : '登入已失效，請重新驗證學校電郵。');
      }
    }
  } catch (error) {
    client = undefined;
    message('email-error', '登入服務暫時無法連接，請重新整理頁面或稍後再試。');
  } finally { busy = false; updateButtons(); }
}
init();
