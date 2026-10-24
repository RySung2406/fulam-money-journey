import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSchoolEmail, isVerifiedSchoolUser, normalizeOtp, configurationIsReady, friendlyAuthError } from '../site/auth-rules.js';

test('only an exact HKU Connect email domain passes; deceptive domains and display-name syntax fail', () => {
  assert.equal(normalizeSchoolEmail('  Student.Name@CONNECT.HKU.HK '), 'student.name@connect.hku.hk');
  for (const input of ['student@gmail.com','student@hku.hk','student@connect.hku.hk.attacker.com','student@evilconnect.hku.hk','student@sub.connect.hku.hk','student@connect.hku.hk\n@example.com','Name <student@connect.hku.hk>','student@@connect.hku.hk','@connect.hku.hk','student+other@connect.hku.hk']) assert.throws(() => normalizeSchoolEmail(input), input);
});
test('a school-looking address without verified server identity never passes', () => {
  const user = { id: 'user-1', email: 'student@connect.hku.hk', email_confirmed_at: '2026-10-24T00:00:00Z', is_anonymous: false };
  assert.equal(isVerifiedSchoolUser(user), true);
  assert.equal(isVerifiedSchoolUser({...user,email_confirmed_at:null}), false);
  assert.equal(isVerifiedSchoolUser({...user,is_anonymous:true}), false);
  assert.equal(isVerifiedSchoolUser({...user,email:'student@example.com'}), false);
  assert.equal(isVerifiedSchoolUser(null), false);
});
test('OTP preserves leading zeroes and rejects malformed input', () => {
  assert.equal(normalizeOtp('012 345'), '012345');
  assert.equal(normalizeOtp('012-345'), '012345');
  for (const code of ['12345','1234567','12345x','<script>','１２３４５６']) assert.throws(() => normalizeOtp(code));
});
test('unconfigured, secret-key, and untrusted URL configurations remain disabled', () => {
  const good = {authReady:true,supabaseUrl:'https://abcxyz.supabase.co',supabasePublishableKey:'sb_publishable_abcdefghijklmnopqrstuv'};
  assert.equal(configurationIsReady(good), true);
  for (const config of [{}, {...good,authReady:false}, {...good,supabasePublishableKey:'sb_secret_abcdefghijklmnop'}, {...good,supabasePublishableKey:'eyJhbGciOiJIUzI1NiJ9.service_role'}, {...good,supabaseUrl:'http://abcxyz.supabase.co'}, {...good,supabaseUrl:'https://abcxyz.supabase.co.evil.com'}, {...good,supabaseUrl:'https://abcxyz.supabase.co/?foo=bar'}]) assert.equal(configurationIsReady(config), false);
});
test('provider errors are translated without leaking server details', () => {
  assert.match(friendlyAuthError({code:'otp_expired'}), /過期/);
  assert.match(friendlyAuthError({status:429}), /頻密/);
  assert.ok(!friendlyAuthError({message:'secret database connection string'}).includes('secret'));
});
