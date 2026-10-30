import { normalizeSchoolEmail, normalizeOtp, isVerifiedSchoolUser, configurationIsReady, friendlyAuthError, sessionMustBeCleared } from './auth-rules.js';
import { persistentAuthOptions } from './auth-session.js';
import { createCheckInController } from './check-in.js';

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
let initializing = true;
const checkIns = createCheckInController({ getClient: () => client, onChange: renderCheckIns });

function renderCheckIns(state = checkIns.state) {
  const loading = state.phase === 'idle' || state.phase === 'loading';
  const unavailable = state.phase === 'error' && state.days.length === 0;
  const saving = state.phase === 'submitting';
  const nextDay = state.days.find(day => day.is_open && !state.records.some(row => row.day_number === day.day_number))?.day_number;
  const openDays = state.days.filter(day => day.is_open);
  const completed = state.records.length;
  $('check-in-status').textContent = loading ? '正在載入…' : state.phase === 'error' ? '暫未能載入' : nextDay ? `第 ${nextDay} 日已開放` : completed ? '打卡已記錄' : '暫未開放';
  $('check-in-description').textContent = '題目與題解在 WhatsApp，打卡紀錄保存在這裡。';
  $('check-in-progress').textContent = loading ? '正在讀取你的紀錄…' : state.phase === 'error' ? '請重新載入紀錄' : `已完成 ${completed} / 21 天`;
  $('check-in-calendar').setAttribute('aria-label', `21 天打卡${loading ? '，正在載入' : unavailable ? '，暫未能載入紀錄' : `，已完成 ${completed} 天`}`);
  for (const cell of $('check-in-calendar').querySelectorAll('[data-check-in-day]')) {
    const day = Number(cell.dataset.checkInDay);
    const record = state.records.find(row => row.day_number === day);
    const isOpen = openDays.some(row => row.day_number === day);
    const label = record ? '已完成' : loading ? '載入中' : unavailable ? '未載入' : isOpen ? '可打卡' : '未開放';
    cell.dataset.state = record ? 'completed' : isOpen ? 'open' : 'locked';
    cell.querySelector('small').textContent = label;
    cell.setAttribute('aria-label', `第 ${day} 日：${label}`);
  }
  const button = $('check-in-button');
  button.textContent = saving ? '正在保存…' : loading ? '正在載入…' : state.phase === 'error' ? '暫未能打卡' : nextDay ? `第 ${nextDay} 日打卡` : completed ? '已完成打卡 ✓' : '尚未開放打卡';
  button.disabled = busy || state.phase !== 'ready' || !nextDay || !state.studentConfirmed;
  button.setAttribute('aria-busy', String(saving));
  $('check-in-eligibility').hidden = !nextDay || loading || state.phase === 'error';
  $('student-confirmation').checked = state.studentConfirmed;
  $('student-confirmation').disabled = busy || saving || loading;
  $('check-in-message').textContent = state.message;
  $('check-in-message').hidden = !state.message;
  $('check-in-message').classList.toggle('error', state.isError);
  $('check-in-retry').hidden = !state.isError;
  $('check-in-retry').disabled = busy || loading || saving;
}
$('student-confirmation').addEventListener('change', (event) => checkIns.setStudentConfirmed(event.target.checked));
$('check-in-button').addEventListener('click', () => { if (!busy && view === 'member') void checkIns.submit(); });
$('check-in-retry').addEventListener('click', () => { if (!busy && view === 'member') void checkIns.refresh(); });

const translatedMessages = new Map([
  ['Enter your HKU email ending in @connect.hku.hk, @graduate.hku.hk or @hku.hk.', '請輸入 HKU 學生、校友或教職員電郵（@connect.hku.hk、@graduate.hku.hk、@hku.hk）。'],
  ['Enter your full HKU Connect email, such as yourname@connect.hku.hk.', '請輸入完整的 HKU Connect 電郵，例如 yourname@connect.hku.hk。'],
  ['Too many code requests. Please try again later.', '驗證碼要求過於頻繁，請稍後再試。'],
  ['The code is incorrect or expired. Try again or request a new code.', '驗證碼不正確或已過期。請檢查最新電郵，或重新索取驗證碼。'],
  ['We could not send your code. Try again later or contact the activity team.', '暫時未能發送驗證碼，請稍後再試或聯絡活動團隊。'],
  ['Sign-in is not available yet. Please try again later.', '登入服務暫時未能使用，請稍後再試。'],
  ['Your session has expired. Please verify your HKU email again.', '登入已失效，請再次驗證 HKU 電郵。'],
  ['The connection was interrupted. Check your internet connection and try again. Your last request may still be processing.', '連線中斷。請檢查網絡後再試；剛才的要求可能仍在處理中。'],
  ['We could not complete this step. Please try again later.', '暫時未能完成這一步，請稍後再試。']
]);

window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

function message(id, text = '') {
  const otpError = text.match(/^Enter the (\d+)-digit verification code from your email\.$/);
  $(id).textContent = translatedMessages.get(text) || (otpError ? `請輸入電郵內的 ${otpError[1]} 位數字驗證碼。` : text);
  $(id).hidden = !text;
}
function showView(next, focus = true) {
  view = next;
  document.body.dataset.authView = next;
  for (const name of ['email', 'otp', 'member']) $(`${name}-screen`).hidden = name !== next;
  if (focus) $(next === 'email' ? 'email' : next === 'otp' ? 'otp' : 'member-title').focus();
}
function showOnboardingStep(step, focus = true) {
  const steps = ['survey', 'community', 'dashboard'];
  const current = steps.includes(step) ? step : 'survey';
  for (const name of steps) {
    $(`${name}-step`).hidden = name !== current;
    $(`${name}-step-label`).removeAttribute('aria-current');
  }
  $(`${current}-step-label`).setAttribute('aria-current', 'step');
  $('member-screen').classList.toggle('show-dashboard', current === 'dashboard');
  $('member-title').textContent = current === 'dashboard' ? '你的 21 天理財旅程。' : '開始你的 21 天旅程。';
  if (focus) $({ survey: 'survey-title', community: 'community-card-title', dashboard: 'dashboard-title' }[current]).focus();
}
function savedJourneyStep() {
  try { return localStorage.getItem(`fulam.journey.view.${accountUserId}`) || 'survey'; }
  catch { return 'survey'; }
}
function navigateJourney(step) {
  if (busy || view !== 'member' || !accountUserId) return;
  // This stores navigation only, never proof of Forms submission or community membership.
  try { localStorage.setItem(`fulam.journey.view.${accountUserId}`, step); }
  catch { /* The journey remains usable when browser storage is unavailable. */ }
  showOnboardingStep(step);
}
$('survey-continue').addEventListener('click', () => {
  navigateJourney('community');
});
$('survey-back').addEventListener('click', () => {
  navigateJourney('survey');
});
for (const step of ['survey', 'community', 'dashboard']) {
  $(`${step}-step-label`).addEventListener('click', () => navigateJourney(step));
}
$('community-continue').addEventListener('click', () => navigateJourney('dashboard'));
$('onboarding-review').addEventListener('click', () => navigateJourney('survey'));
function clearMessages() { ['email-error', 'otp-error', 'member-error', 'resend-status'].forEach((id) => message(id)); }
function remainingSeconds() { return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)); }
function updateButtons() {
  const seconds = remainingSeconds();
  $('send-button').disabled = busy || !client || seconds > 0;
  $('send-button').querySelector('span').textContent = initializing ? '正在連接…' : busy && view === 'email' ? '正在發送…' : seconds > 0 && view === 'email' ? `請等候 ${seconds} 秒` : '發送驗證碼';
  $('verify-button').disabled = busy || !client;
  $('verify-button').querySelector('span').textContent = busy && view === 'otp' ? '正在驗證…' : '驗證並登入';
  $('resend-button').disabled = busy || !client || seconds > 0;
  $('resend-button').textContent = seconds > 0 ? `${seconds} 秒後可重發` : '重新發送';
  $('back-button').disabled = busy;
  $('email').readOnly = busy;
  $('otp').readOnly = busy;
  $('signout-button').disabled = busy;
  $('email-form').setAttribute('aria-busy', String(busy && view === 'email'));
  $('otp-form').setAttribute('aria-busy', String(busy && view === 'otp'));
  renderCheckIns();
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
  if (remainingSeconds()) { message('email-error', '請稍候，再要求另一個驗證碼。'); return; }
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
    message('resend-status', '新驗證碼已發送，請使用最新電郵內的驗證碼。');
  } catch (error) { message('otp-error', friendlyAuthError(error)); }
  finally { busy = false; updateButtons(); }
});

async function openVerifiedAccount(focus = true) {
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
  showOnboardingStep(savedJourneyStep(), false);
  showView('member', focus);
  void checkIns.setUser(accountUserId);
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
      message('email-error', '登入已保存，但暫時未能載入帳戶。請重新整理頁面，無需再索取驗證碼；或聯絡活動團隊。');
    } else if (error.message === 'invalid-school-session') { showView('email'); message('email-error', '請以已驗證的 HKU 電郵登入。'); }
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
  void checkIns.setUser(undefined);
  showOnboardingStep('survey', false);
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
  } catch (error) { message('member-error', '未能完成登出，請檢查網絡後再試。此瀏覽器目前仍維持登入。'); }
  finally { busy = false; updateButtons(); }
});

const dialog = $('privacy-dialog');
$('privacy-open').addEventListener('click', () => dialog.showModal());
$('privacy-close').addEventListener('click', () => dialog.close());
$('privacy-done').addEventListener('click', () => dialog.close());
if (window.location.hash === '#privacy') dialog.showModal();
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

async function init() {
  updateButtons();
  if (!configurationIsReady(config)) { initializing = false; $('setup-notice').hidden = false; updateButtons(); return; }
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
      try { await openVerifiedAccount(false); }
      catch (error) {
        if (sessionMustBeCleared(error)) {
          await client.auth.signOut({ scope: 'local' });
          message('email-error', 'Your session has expired. Please verify your HKU email again.');
        } else {
          message('email-error', '登入已保存，但暫時未能確認帳戶。請重新整理頁面，無需再索取驗證碼；或聯絡活動團隊。');
        }
      }
    }
  } catch (error) {
    client = undefined;
    message('email-error', '暫時未能連接登入服務。請重新整理頁面，或稍後再試。');
  } finally { initializing = false; busy = false; updateButtons(); }
}
init();

