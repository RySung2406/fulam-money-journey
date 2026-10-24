import { createClient } from '@supabase/supabase-js';
import { configurationIsReady } from './auth-rules.js';
import { verifyGameAccess } from './game-access.js';

const config = window.FULIN_CONFIG || {};
const status = document.getElementById('access-status');
const returnToAccount = () => window.location.replace('../');
window.addEventListener('pageshow', (event) => {
  // A back/forward cache restore must recheck access after sign-out.
  if (event.persisted) window.location.reload();
});

async function initGame() {
  if (!configurationIsReady(config)) {
    status.textContent = 'The sign-in service is not ready. Please return to your account and try again later.';
    return;
  }
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
      storage: window.sessionStorage, storageKey: 'fulin.auth.session' }
  });
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      document.body.hidden = true;
      returnToAccount();
    }
  });
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) { returnToAccount(); return; }
    await verifyGameAccess(client);
    window.startMoneyGame();
    document.getElementById('signout-game').hidden = false;
  } catch (error) {
    if (error.message === 'invalid-school-session' || error.status === 401 || error.status === 403) {
      await client.auth.signOut({ scope: 'local' });
      returnToAccount();
      return;
    }
    status.textContent = 'We could not verify your account. Return to your account to sign in again, or refresh to retry.';
  }
  document.getElementById('signout-game').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) {
      button.disabled = false;
      document.getElementById('announcer').textContent = 'Sign-out failed. Return to your account and try again.';
    } else returnToAccount();
  });
}
initGame();
