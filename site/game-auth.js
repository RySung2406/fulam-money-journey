import { createClient } from '@supabase/supabase-js';
import { configurationIsReady, sessionMustBeCleared } from './auth-rules.js';
import { persistentAuthOptions } from './auth-session.js';
import { verifyGameAccess } from './game-access.js';

const config = window.FULIN_CONFIG || {};
const status = document.getElementById('access-status');
const returnToAccount = () => window.location.replace('../account/');
let accountUserId;
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
    auth: persistentAuthOptions()
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      document.body.hidden = true;
      returnToAccount();
    }
    if (event === 'SIGNED_IN' && accountUserId && session?.user?.id !== accountUserId) {
      document.body.hidden = true;
      window.location.reload();
    }
  });
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) { returnToAccount(); return; }
    const user = await verifyGameAccess(client);
    accountUserId = user.id;
    window.startMoneyGame();
    document.getElementById('signout-game').hidden = false;
  } catch (error) {
    if (sessionMustBeCleared(error)) {
      await client.auth.signOut({ scope: 'local' });
      returnToAccount();
      return;
    }
    status.textContent = 'Your sign-in is saved, but we could not verify your account right now. Refresh to retry or return to your account.';
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

