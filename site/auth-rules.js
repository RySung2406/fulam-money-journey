export const SCHOOL_DOMAIN = 'connect.hku.hk';

export function normalizeSchoolEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?@connect\.hku\.hk$/.test(email)) {
    throw new Error('Enter your full HKU Connect email, such as yourname@connect.hku.hk.');
  }
  return email;
}

export function isVerifiedSchoolUser(user) {
  try {
    return Boolean(user?.id && user.email_confirmed_at && !user.is_anonymous && normalizeSchoolEmail(user.email));
  } catch { return false; }
}

export function normalizeOtp(value, length = 8) {
  const code = String(value ?? '').trim().replace(/[\s-]/g, '');
  if (!Number.isInteger(length) || length < 6 || length > 10 || !new RegExp(`^[0-9]{${length}}$`).test(code)) {
    throw new Error(`Enter the ${length}-digit verification code from your email.`);
  }
  return code;
}

export function configurationIsReady(config) {
  if (!config || config.authReady !== true) return false;
  try {
    const url = new URL(config.supabaseUrl);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) return false;
    const key = config.supabasePublishableKey;
    if (typeof key !== 'string' || key.startsWith('sb_secret_')) return false;
    // Only modern publishable keys; legacy service-role JWTs cannot be accepted accidentally.
    return /^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(key);
  } catch { return false; }
}

export function sessionMustBeCleared(error) {
  return error?.message === 'invalid-school-session'
    || error?.name === 'AuthSessionMissingError'
    || ['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'user_not_found', 'user_banned', 'bad_jwt'].includes(error?.code)
    || error?.status === 401 || error?.status === 403;
}

export function friendlyAuthError(error) {
  const code = error?.code || '';
  if (['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) || error?.status === 429) return 'Too many code requests. Please try again later.';
  if (['otp_expired', 'invalid_credentials', 'otp_disabled'].includes(code)) return 'The code is incorrect or expired. Try again or request a new code.';
  if (code === 'email_address_not_authorized' || code === 'unexpected_failure') return 'We could not send your code. Try again later or contact the activity team.';
  if (['signup_disabled', 'email_provider_disabled', 'hook_payload_invalid_content_type', 'hook_timeout'].includes(code)) return 'Sign-in is not available yet. Please try again later.';
  if (code === 'session_not_found' || code === 'refresh_token_not_found') return 'Your session has expired. Please verify your HKU email again.';
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return 'The connection was interrupted. Check your internet connection and try again. Your last request may still be processing.';
  return 'We could not complete this step. Please try again later.';
}

