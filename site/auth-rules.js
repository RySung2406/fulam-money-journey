export const SCHOOL_DOMAIN = 'connect.hku.hk';

export function normalizeSchoolEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?@connect\.hku\.hk$/.test(email)) {
    throw new Error('請輸入完整的 HKU Connect 電郵，例如 yourname@connect.hku.hk。');
  }
  return email;
}

export function isVerifiedSchoolUser(user) {
  try {
    return Boolean(user?.id && user.email_confirmed_at && !user.is_anonymous && normalizeSchoolEmail(user.email));
  } catch { return false; }
}

export function normalizeOtp(value, length = 6) {
  const code = String(value ?? '').trim().replace(/[\s-]/g, '');
  if (!Number.isInteger(length) || length < 6 || length > 10 || !new RegExp(`^[0-9]{${length}}$`).test(code)) {
    throw new Error(`請輸入電郵中的 ${length} 位數字驗證碼。`);
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

export function friendlyAuthError(error) {
  const code = error?.code || '';
  if (['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) || error?.status === 429) return '驗證碼要求太頻密，請稍後再試。';
  if (['otp_expired', 'invalid_credentials', 'otp_disabled'].includes(code)) return '驗證碼不正確或已過期。請重新輸入，或要求新的驗證碼。';
  if (code === 'email_address_not_authorized' || code === 'unexpected_failure') return '暫時未能寄出驗證碼。請稍後再試，或通知活動工作人員。';
  if (['signup_disabled', 'email_provider_disabled', 'hook_payload_invalid_content_type', 'hook_timeout'].includes(code)) return '登入服務暫未開放，請稍後再試。';
  if (code === 'session_not_found' || code === 'refresh_token_not_found') return '登入已失效，請重新驗證學校電郵。';
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return '連線未完成。請檢查網絡後再試，已提交的要求可能仍在處理中。';
  return '暫時未能完成這個步驟，請稍後再試。';
}
