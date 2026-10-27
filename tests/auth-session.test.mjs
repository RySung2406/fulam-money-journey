import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { persistentAuthOptions } from '../site/auth-session.js';
import { sessionMustBeCleared } from '../site/auth-rules.js';
import { verifyGameAccess } from '../site/game-access.js';

// All identities, credentials and responses in this file are synthetic. Every
// SDK request goes through the mock transport; nothing reaches an email server.
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'test.participant@connect.hku.hk',
  email_confirmed_at: '2026-10-27T00:00:00Z',
  is_anonymous: false,
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-10-27T00:00:00Z'
};
const participantCode = 'TEST-001';
const secondsNow = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' }
});

class MemoryStorage {
  #items = new Map();
  getItem(key) { return this.#items.get(key) ?? null; }
  setItem(key, value) { this.#items.set(key, String(value)); }
  removeItem(key) { this.#items.delete(key); }
}

function session(expiresAt = secondsNow() + 3600) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: expiresAt })}.test-only-signature`,
    refresh_token: 'test-only-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user
  };
}

function newPageOptions(browserStorage) {
  // A new page has fresh tab storage, but shares the browser's persistent store.
  // Resolve the production default rather than injecting a storage override.
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: browserStorage, sessionStorage: new MemoryStorage() }
  });
  try { return persistentAuthOptions(); }
  finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
}

function setup(t) {
  const storage = new MemoryStorage();
  const calls = { otp: 0, verify: 0, refresh: 0, user: 0, profile: 0, logout: 0 };
  const clients = [];
  async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.pathname === '/auth/v1/otp') { calls.otp += 1; return json({}); }
    if (url.pathname === '/auth/v1/verify') { calls.verify += 1; return json(session()); }
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
      calls.refresh += 1;
      return json(session());
    }
    if (url.pathname === '/auth/v1/user') { calls.user += 1; return json(user); }
    if (url.pathname === '/auth/v1/logout') { calls.logout += 1; return json({}); }
    if (url.pathname === '/rest/v1/profiles') {
      calls.profile += 1;
      assert.equal(url.searchParams.get('id'), `eq.${user.id}`);
      return json({ participant_code: participantCode });
    }
    throw new Error(`Unexpected mock endpoint: ${url.pathname}`);
  }
  function openPage() {
    const authOptions = newPageOptions(storage);
    const client = createClient('https://test-project.supabase.co', 'sb_publishable_test_only_key_123456789', {
      auth: authOptions,
      global: { fetch: fetchMock }
    });
    clients.push(client);
    return { client, storageKey: authOptions.storageKey };
  }
  async function signIn(client) {
    const requested = await client.auth.signInWithOtp({ email: user.email });
    assert.equal(requested.error, null);
    const verified = await client.auth.verifyOtp({ email: user.email, token: '12345678', type: 'email' });
    assert.equal(verified.error, null);
    assert.equal(verified.data.user.id, user.id);
  }
  async function readParticipant(client) {
    const verifiedUser = await verifyGameAccess(client);
    assert.equal(verifiedUser.id, user.id);
    const result = await client.from('profiles').select('participant_code').eq('id', verifiedUser.id).single();
    assert.equal(result.error, null);
    return result.data.participant_code;
  }
  t.after(async () => {
    for (const client of clients) await client.auth.stopAutoRefresh();
  });
  return { storage, calls, openPage, signIn, readParticipant };
}

test('closing a page preserves the verified account and participant without another email code', async (t) => {
  const { storage, calls, openPage, signIn, readParticipant } = setup(t);
  const first = openPage();
  await signIn(first.client);
  assert.ok(storage.getItem(first.storageKey), 'verification should persist the session in browser storage');
  const originalParticipant = await readParticipant(first.client);
  await first.client.auth.stopAutoRefresh();

  const reopened = openPage();
  const restored = await reopened.client.auth.getSession();
  assert.equal(restored.error, null);
  assert.equal(restored.data.session?.user.id, user.id);
  assert.equal(await readParticipant(reopened.client), originalParticipant);
  assert.equal(calls.otp, 1);
  assert.equal(calls.verify, 1);
  assert.equal(calls.refresh, 0);
});

test('a reopened page refreshes an expired access token without requesting another email code', async (t) => {
  const { storage, calls, openPage, signIn, readParticipant } = setup(t);
  const first = openPage();
  await signIn(first.client);
  await first.client.auth.stopAutoRefresh();
  storage.setItem(first.storageKey, JSON.stringify(session(secondsNow() - 300)));

  const reopened = openPage();
  const restored = await reopened.client.auth.getSession();
  assert.equal(restored.error, null);
  assert.equal(restored.data.session?.user.id, user.id);
  assert.ok(restored.data.session.expires_at > secondsNow());
  assert.equal(await readParticipant(reopened.client), participantCode);
  assert.equal(calls.refresh, 1);
  assert.equal(calls.otp, 1);
  assert.equal(calls.verify, 1);
});

test('explicit sign-out clears persistent access and a new page does not restore the account', async (t) => {
  const { storage, calls, openPage, signIn } = setup(t);
  const first = openPage();
  await signIn(first.client);
  const result = await first.client.auth.signOut({ scope: 'local' });
  assert.equal(result.error, null);
  assert.equal(storage.getItem(first.storageKey), null);
  await first.client.auth.stopAutoRefresh();

  const reopened = openPage();
  const restored = await reopened.client.auth.getSession();
  assert.equal(restored.error, null);
  assert.equal(restored.data.session, null);
  assert.equal(calls.logout, 1);
  assert.equal(calls.refresh, 0);
  assert.equal(calls.otp, 1);
});

test('temporary connectivity and profile failures preserve sign-in; confirmed auth failures clear it', () => {
  for (const error of [
    new TypeError('Failed to fetch'),
    { name: 'AuthRetryableFetchError', status: 503 },
    { status: 429 },
    { status: 500 },
    new Error('profile-not-ready')
  ]) assert.equal(sessionMustBeCleared(error), false);

  for (const error of [
    new Error('invalid-school-session'),
    { name: 'AuthSessionMissingError' },
    { code: 'refresh_token_not_found' },
    { code: 'session_not_found' },
    { status: 401 },
    { status: 403 }
  ]) assert.equal(sessionMustBeCleared(error), true);
});
