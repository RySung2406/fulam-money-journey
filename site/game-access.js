import { isVerifiedSchoolUser } from './auth-rules.js';

// Validate with the Auth server and read the same RLS-protected profile used by
// the account page. Cached session data alone never opens the game UI.
export async function verifyGameAccess(client) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!isVerifiedSchoolUser(data?.user)) throw new Error('invalid-school-session');
  const { data: profile, error: profileError } = await client.from('profiles')
    .select('participant_code').eq('id', data.user.id).single();
  if (profileError) throw profileError;
  if (!profile?.participant_code) throw new Error('profile-not-ready');
  return data.user;
}
