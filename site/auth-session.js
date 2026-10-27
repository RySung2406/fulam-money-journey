// Both entry points share one browser-persistent session and refresh-token lock.
export function persistentAuthOptions(storage = window.localStorage) {
  return {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
    storageKey: 'fulin.auth.session'
  };
}
