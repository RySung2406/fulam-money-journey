import { normalizeSchoolEmail, normalizeOtp, isVerifiedSchoolUser, configurationIsReady, friendlyAuthError, sessionMustBeCleared } from './auth-rules.js';
import { persistentAuthOptions } from './auth-session.js';
import { createCheckInController } from './check-in.js';
import { CHECK_IN_DAYS } from './check-in-content.js';
import { checkInAction, renderQuestion, renderPublishedAnswer, selectableCheckInDay } from './check-in-screen.js';

const $ = (id) => document.getElementById(id);
const config = window.FULIN_CONFIG || {};
const REMEMBERED_EMAIL_KEY = 'fulam.auth.lastEmail';
const AUTH_STORAGE_KEY = 'fulin.auth.session';
let client;
let pendingEmail = '';
let cooldownUntil = 0;
let busy = false;
let cooldownTimer;
let view = 'email';
let transition = 0;
let accountUserId;
let initializing = true;
let restorePending = false;
const journeySteps = ['survey', 'community', 'dashboard', 'booth'];
const checkIns = createCheckInController({ getClient: () => client, onChange: renderCheckIns });
let storyDay = 0;
let questionOpen = false;
const draftChoices = new Map();
// A fresh Turnstile token is required for each email request, including resends.
const captcha = { api: null, tokens: { email: '', otp: '' }, ids: {}, failed: false };

function readRememberedEmail() {
  try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''; }
  catch { return ''; }
}
function rememberEmail(email) {
  try { localStorage.setItem(REMEMBERED_EMAIL_KEY, email); }
  catch { /* Prefill remains optional when storage is blocked. */ }
}
function hasStoredSession() {
  try { return Boolean(localStorage.getItem(AUTH_STORAGE_KEY)); }
  catch { return false; }
}
function setRestoreState(kind) {
  restorePending = kind === 'loading' || kind === 'failed';
  $('session-restore').hidden = kind !== 'loading';
  $('session-restore-failed').hidden = kind !== 'failed';
  $('email-form').hidden = kind === 'loading';
  if (kind !== 'loading' && kind !== 'failed') $('email-form').hidden = false;
}
function renderCaptcha(kind) {
  if (!captcha.api || !['email', 'otp'].includes(kind) || captcha.ids[kind] !== undefined) return;
  try {
    captcha.ids[kind] = captcha.api.render($(`captcha-${kind}`), {
      sitekey: config.turnstileSiteKey,
      callback: token => { captcha.tokens[kind] = token; $(`captcha-${kind}-status`).textContent = ''; updateButtons(); },
      'expired-callback': () => { captcha.tokens[kind] = ''; $(`captcha-${kind}-status`).textContent = '請完成安全驗證。'; updateButtons(); },
      'error-callback': () => { captcha.tokens[kind] = ''; $(`captcha-${kind}-status`).textContent = '安全驗證未能載入，請重新整理頁面再試。'; updateButtons(); }
    });
  } catch { captcha.failed = true; $(`captcha-${kind}-status`).textContent = '安全驗證未能載入，請重新整理頁面再試。'; }
}
function resetCaptcha(kind) {
  captcha.tokens[kind] = '';
  if (captcha.api && captcha.ids[kind] !== undefined) captcha.api.reset(captcha.ids[kind]);
}
function loadCaptcha() {
  if (!config.turnstileSiteKey) { captcha.failed = true; $('captcha-email-status').textContent = '安全驗證未能載入，請重新整理頁面再試。'; return; }
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.onload = () => { captcha.api = window.turnstile; renderCaptcha(view); updateButtons(); };
  script.onerror = () => { captcha.failed = true; for (const kind of ['email', 'otp']) $(`captcha-${kind}-status`).textContent = '安全驗證未能載入，請重新整理頁面再試。'; updateButtons(); };
  document.head.appendChild(script);
}


function questionAction(state, saving) {
  const nextDay = state.days.find(day => selectableCheckInDay(day.day_number, state.days) && !state.records.some(row => row.day_number === day.day_number))?.day_number;
  const reviewDay = [...state.days].reverse().find(day => selectableCheckInDay(day.day_number, state.days) && state.records.some(row => row.day_number === day.day_number))?.day_number;
  const openDay = questionOpen ? storyDay : 0;
  const record = state.records.find(row => row.day_number === openDay);
  return checkInAction({
    questionOpen, nextDay: questionOpen ? 0 : nextDay, reviewDay: questionOpen ? openDay : reviewDay,
    draftChoice: draftChoices.get(openDay) || '', savedChoice: record?.choice || '',
    phase: state.phase, busy, saving
  });
}
function updatePostSurvey(completed, rewardTarget, rewardKnown) {
  const url = typeof config.postSurveyUrl === 'string' ? config.postSurveyUrl.trim() : '';
  const unlocked = Boolean(url) && rewardKnown && completed >= rewardTarget;
  const remaining = Math.max(0, rewardTarget - completed);
  for (const open of document.querySelectorAll('[data-posttest-open]')) {
    open.hidden = !unlocked;
    if (unlocked) {
      open.href = url;
      open.setAttribute('aria-label', '填寫後測問卷（另開分頁）');
    } else {
      open.removeAttribute('href');
      open.removeAttribute('aria-label');
    }
  }
  for (const locked of document.querySelectorAll('[data-posttest-locked]')) {
    locked.hidden = unlocked;
    locked.textContent = !rewardKnown
      ? (checkIns.state.phase === 'loading' || checkIns.state.phase === 'idle' ? '正在載入…' : '暫未能確認打卡')
      : `未達 80% 打卡 · 還差 ${remaining} 天`;
    locked.setAttribute('aria-label', unlocked ? '後測問卷已開放' : `後測問卷需完成至少 ${rewardTarget} 天打卡`);
  }
  for (const hint of document.querySelectorAll('[data-posttest-hint]')) {
    hint.textContent = unlocked
      ? '已達 80% 打卡門檻，可以填寫後測問卷。'
      : !rewardKnown
        ? '正在確認你的打卡進度…'
        : `完成至少 ${rewardTarget} / 21 天打卡（80%）後可填寫。目前 ${completed} / 21 天。`;
  }
  if (typeof config.preSurveyUrl === 'string' && config.preSurveyUrl.trim()) {
    const pre = $('survey-link');
    if (pre) pre.href = config.preSurveyUrl.trim();
  }
}

function renderCheckIns(state = checkIns.state) {
  const loading = state.phase === 'idle' || state.phase === 'loading';
  const unavailable = state.phase === 'error' && state.days.length === 0;
  const saving = state.phase === 'submitting';
  const nextDay = state.days.find(day => day.is_open && !state.records.some(row => row.day_number === day.day_number))?.day_number;
  const openDays = state.days.filter(day => day.is_open);
  const completed = state.records.length;
  const rewardTarget = Math.ceil(21 * 0.8);
  const rewardKnown = !loading && state.phase !== 'error';
  updatePostSurvey(completed, rewardTarget, rewardKnown);
  $('rewards-progress-text').textContent = !rewardKnown
    ? (loading ? '正在載入紀錄…' : '暫未能載入紀錄')
    : completed >= rewardTarget ? `已達打卡門檻 · ${completed} / 21 天（仍須完成後測）` : `已完成 ${completed} / ${rewardTarget} 天 · 還差 ${rewardTarget - completed} 天`;
  const rewardBar = $('rewards-progress-bar');
  rewardBar.hidden = !rewardKnown;
  if (rewardKnown) {
    rewardBar.value = Math.min(completed, rewardTarget);
    rewardBar.setAttribute('aria-valuetext', `已完成 ${completed} 天，抽獎門檻為 ${rewardTarget} 天`);
  }
  $('check-in-status').textContent = loading ? '正在載入…' : state.phase === 'error' ? '暫未能載入' : nextDay ? `第 ${nextDay} 日已開放` : completed ? '打卡已記錄' : '暫未開放';
  $('check-in-description').textContent = '第 1 日和第 2 日已經開放。第 3 至 21 日在對應日期早上 6 時開放，直至 11 月 28 日；已開放的日子可隨時補做（香港時間）。點選日曆上已開放的日子，或按「開始打卡」，即可進入該日題目並選擇答案。第 1 日答案只向已完成的同學公布。';
  $('check-in-progress').textContent = loading ? '正在讀取你的紀錄…' : state.phase === 'error' ? '請重新載入紀錄' : `已完成 ${completed} / 21 天`;
  $('check-in-calendar').setAttribute('aria-label', `21 天打卡${loading ? '，正在載入' : unavailable ? '，暫未能載入紀錄' : `，已完成 ${completed} 天`}`);
  for (const cell of $('check-in-calendar').querySelectorAll('[data-check-in-day]')) {
    const day = Number(cell.dataset.checkInDay);
    const record = state.records.find(row => row.day_number === day);
    const isOpen = openDays.some(row => row.day_number === day);
    const label = record ? '已完成' : loading ? '載入中' : unavailable ? '未載入' : isOpen ? '可打卡' : '未開放';
    cell.dataset.state = record ? 'completed' : isOpen ? 'open' : 'locked';
    cell.querySelector('small').textContent = label;
    const opener = cell.querySelector('[data-open-day]');
    const selectable = selectableCheckInDay(day, state.days) && !loading && !unavailable;
    opener.disabled = !selectable;
    opener.setAttribute('aria-label', `第 ${day} 日：${label}`);
  }
  let action = questionAction(state, saving);
  if (questionOpen && !action.showQuestion) { questionOpen = false; action = questionAction(state, saving); }
  const panel = $('daily-check-in');
  if (action.showQuestion) panel.dataset.question = 'true';
  else delete panel.dataset.question;
  const button = $('check-in-button');
  button.textContent = action.label;
  button.disabled = action.disabled;
  button.setAttribute('aria-busy', String(saving));
  $('check-in-message').textContent = state.message;
  $('check-in-message').hidden = !state.message;
  $('check-in-message').classList.toggle('error', state.isError);
  $('check-in-retry').hidden = !state.isError;
  $('check-in-retry').disabled = busy || loading || saving;
  renderPublished(state);
  const story = $('check-in-story');
  if (!action.showQuestion) { story.hidden = true; story.replaceChildren(); return; }
  const day = CHECK_IN_DAYS.find(item => item.n === action.day);
  const record = state.records.find(row => row.day_number === action.day);
  const savedChoice = record?.choice || '';
  const reveal = (state.reveals || []).find(item => item.day_number === action.day);
  renderQuestion(story, {
    day, en: window.FuLamI18n?.getLanguage?.() === 'en',
    choice: savedChoice || draftChoices.get(action.day) || '',
    locked: Boolean(savedChoice),
    revealed: Boolean(reveal), reveal, submitted: Boolean(record), savedChoice
  });
}
function renderPublished(state) {
  const box = $('check-in-published');
  const en = window.FuLamI18n?.getLanguage?.() === 'en';
  const reveals = state.reveals || [];
  const published = CHECK_IN_DAYS.filter(day => {
    const record = state.records.find(row => row.day_number === day.n);
    return record && reveals.some(item => item.day_number === day.n);
  });
  box.replaceChildren();
  box.hidden = published.length === 0;
  for (const day of published) {
    const record = state.records.find(row => row.day_number === day.n);
    const section = document.createElement('section');
    renderPublishedAnswer(section, { day, en, savedChoice: record.choice, reveal: reveals.find(item => item.day_number === day.n) });
    box.append(section);
  }
}
function handleQuestionClick(event) {
  if (busy || view !== 'member') return;
  const opener = event.target.closest('[data-open-day]');
  if (opener && !opener.disabled) {
    const day = Number(opener.dataset.openDay);
    if (selectableCheckInDay(day, checkIns.state.days)) {
      questionOpen = true;
      storyDay = day;
      renderCheckIns();
      $('check-in-story')?.querySelector('h3')?.focus();
    }
    return;
  }
  const back = event.target.closest('[data-check-in-back]');
  const option = event.target.closest('[data-choice]');
  if (back) { questionOpen = false; renderCheckIns(); return; }
  if (!option || option.disabled) return;
  draftChoices.set(storyDay, option.dataset.choice);
  renderCheckIns();
}
$('daily-check-in').addEventListener('click', handleQuestionClick);
$('check-in-button').addEventListener('click', () => {
  if (busy || view !== 'member') return;
  const action = questionAction(checkIns.state, checkIns.state.phase === 'submitting');
  if (action.action === 'open') {
    questionOpen = true;
    storyDay = action.day;
    renderCheckIns();
    $('check-in-story')?.querySelector('h3')?.focus();
  } else if (action.action === 'close') {
    questionOpen = false;
    renderCheckIns();
  } else if (action.action === 'submit') {
    void checkIns.submit(action.day, draftChoices.get(action.day));
  }
});
document.addEventListener('fulam-language-change', () => renderCheckIns());
$('check-in-retry').addEventListener('click', () => { if (!busy && view === 'member') void checkIns.refresh(); });
// Refresh availability for members who keep the page open across 06:00.
setInterval(() => { if (view === 'member' && !busy && !document.hidden && checkIns.state.phase === 'ready') void checkIns.refresh(); }, 60000);

const translatedMessages = new Map([
  ['Enter your HKU email ending in @connect.hku.hk, @graduate.hku.hk or @hku.hk.', '請輸入 HKU 學生、校友或教職員電郵（@connect.hku.hk、@graduate.hku.hk、@hku.hk）。'],
  ['Enter your full HKU Connect email, such as yourname@connect.hku.hk.', '請輸入完整的 HKU Connect 電郵，例如 yourname@connect.hku.hk。'],
  ['Please complete the security check.', '請完成安全驗證。'],
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
  renderCaptcha(next);
  if (focus) $(next === 'email' ? 'email' : next === 'otp' ? 'otp' : 'member-title').focus();
}
function showOnboardingStep(step, focus = true) {
  const steps = journeySteps;
  const current = steps.includes(step) ? step : 'survey';
  for (const name of steps) {
    $(`${name}-step`).hidden = name !== current;
    $(`${name}-step-label`).removeAttribute('aria-current');
  }
  $(`${current}-step-label`).setAttribute('aria-current', 'step');
  $('member-screen').classList.toggle('show-dashboard', current === 'dashboard');
  $('member-screen').classList.toggle('show-booth', current === 'booth');
  $('member-title').textContent = current === 'dashboard' || current === 'booth' ? '你的 21 天理財旅程。' : '開始你的 21 天旅程。';
  if (focus) $({ survey: 'survey-title', community: 'community-card-title', dashboard: 'dashboard-title', booth: 'booth-title' }[current]).focus();
}
function savedJourneyStep() {
  const linkedStep = window.location.hash.slice(1);
  if (journeySteps.includes(linkedStep)) return linkedStep;
  try { return localStorage.getItem(`fulam.journey.view.${accountUserId}`) || 'survey'; }
  catch { return 'survey'; }
}
function navigateJourney(step) {
  if (busy || view !== 'member' || !accountUserId || !journeySteps.includes(step)) return;
  // This stores navigation only, never proof of Forms submission or community membership.
  try { localStorage.setItem(`fulam.journey.view.${accountUserId}`, step); }
  catch { /* The journey remains usable when browser storage is unavailable. */ }
  showOnboardingStep(step);
  window.history.replaceState(null, '', `#${step}`);
}
$('survey-continue').addEventListener('click', () => {
  navigateJourney('community');
});
$('survey-back').addEventListener('click', () => {
  navigateJourney('survey');
});
for (const step of journeySteps) {
  $(`${step}-step-label`).addEventListener('click', () => navigateJourney(step));
}
$('community-continue').addEventListener('click', () => navigateJourney('dashboard'));
$('dashboard-booth').addEventListener('click', () => navigateJourney('booth'));
$('booth-back').addEventListener('click', () => navigateJourney('dashboard'));
window.addEventListener('hashchange', () => navigateJourney(window.location.hash.slice(1)));
function clearMessages() { ['email-error', 'otp-error', 'member-error', 'resend-status'].forEach((id) => message(id)); }
function remainingSeconds() { return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)); }
function updateButtons() {
  const seconds = remainingSeconds();
  const restoreBusy = restorePending || (initializing && hasStoredSession());
  $('send-button').disabled = busy || restoreBusy || !client || seconds > 0 || !captcha.tokens.email;
  $('send-button').querySelector('span').textContent = initializing ? '正在連接…' : busy && view === 'email' ? '正在發送…' : seconds > 0 && view === 'email' ? `請等候 ${seconds} 秒` : '發送驗證碼';
  $('verify-button').disabled = busy || !client;
  $('verify-button').querySelector('span').textContent = busy && view === 'otp' ? '正在驗證…' : '驗證並登入';
  $('resend-button').disabled = busy || !client || seconds > 0 || !captcha.tokens.otp;
  $('resend-button').textContent = seconds > 0 ? `${seconds} 秒後可重發` : '重新發送';
  $('back-button').disabled = busy;
  $('session-retry').disabled = busy || initializing;
  $('email').readOnly = busy || restoreBusy;
  $('otp').readOnly = busy;
  $('signout-button').disabled = busy;
  $('email-form').setAttribute('aria-busy', String((busy && view === 'email') || restoreBusy));
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
async function requestCode(email, kind) {
  const token = captcha.tokens[kind];
  if (!token) throw new Error('captcha_required');
  try { const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, captchaToken: token } }); if (error) throw error; }
  finally { resetCaptcha(kind); }
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
  if (!captcha.tokens.email) { message('email-error', '請完成安全驗證。'); return; }
  busy = true; updateButtons();
  try {
    await requestCode(email, 'email');
    rememberEmail(email);
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
  if (busy || !client || !pendingEmail || remainingSeconds() || !captcha.tokens.otp) return;
  clearMessages(); busy = true; updateButtons();
  try {
    await requestCode(pendingEmail, 'otp');
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
  rememberEmail(data.user.email);
  $('member-email').textContent = data.user.email;
  $('participant-code').textContent = profile.participant_code;
  accountUserId = data.user.id;
  $('otp').value = '';
  pendingEmail = '';
  clearMessages();
  setRestoreState('idle');
  showOnboardingStep(savedJourneyStep(), false);
  showView('member', focus);
  void checkIns.setUser(accountUserId);
}

async function restoreSavedAccount(focus = false) {
  setRestoreState('loading');
  updateButtons();
  try {
    await openVerifiedAccount(focus);
  } catch (error) {
    if (sessionMustBeCleared(error)) {
      setRestoreState('idle');
      await client.auth.signOut({ scope: 'local' });
      showView('email', false);
      message('email-error', 'Your session has expired. Please verify your HKU email again.');
      return false;
    }
    setRestoreState('failed');
    message('email-error', '登入已保存，但暫時未能確認帳戶。請重新整理頁面，無需再索取驗證碼；或聯絡活動團隊。');
    return false;
  } finally {
    updateButtons();
  }
  return true;
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
  $('email').value = readRememberedEmail();
  $('otp').value = '';
  pendingEmail = '';
  clearMessages();
  setRestoreState('idle');
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

$('session-retry').addEventListener('click', async () => {
  if (busy || initializing || !client || view !== 'email') return;
  busy = true; updateButtons();
  try { await restoreSavedAccount(true); }
  finally { busy = false; updateButtons(); }
});

async function init() {
  const remembered = readRememberedEmail();
  if (remembered && !$('email').value) $('email').value = remembered;
  if (hasStoredSession()) setRestoreState('loading');
  updateButtons();
  if (!configurationIsReady(config)) {
    initializing = false;
    setRestoreState('idle');
    $('setup-notice').hidden = false;
    updateButtons();
    return;
  }
  busy = true; updateButtons();
  try {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: persistentAuthOptions()
    });
    $('setup-notice').hidden = true;
    client.auth.onAuthStateChange((event, session) => {
      // Keep the callback synchronous to avoid an auth client lock deadlock.
      // Ignore startup SIGNED_OUT noise while the stored session is still restoring.
      if (event === 'SIGNED_OUT' && !initializing) { clearAccountScreen(); updateButtons(); }
      if (event === 'SIGNED_IN' && accountUserId && session?.user?.id !== accountUserId) {
        clearAccountScreen();
        window.location.reload();
      }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session) await restoreSavedAccount(false);
    else setRestoreState('idle');
  } catch (error) {
    client = undefined;
    setRestoreState('idle');
    message('email-error', '暫時未能連接登入服務。請重新整理頁面，或稍後再試。');
  } finally { initializing = false; busy = false; updateButtons(); }
}
init();


loadCaptcha();
