# The Money Journey · HKU Email Sign-In

A login-only website with email verification codes and a minimal account profile. Activity and game content is not included.

## Deployment status

- Website: https://rysung2406.github.io/fulin-money-journey/
- Supabase project, school-domain enforcement, signup hook, and row-level security are configured.
- Brevo custom SMTP is configured on the free plan.
- English email templates and SMTP are configured. Sign-in is enabled. A real OTP request succeeded for the project owner; mailbox verification and the signed-in profile check are still pending.
- Database checks in `supabase/002_verify_access.sql` passed: profile creation, exact-domain enforcement, cross-account isolation, unverified-account denial, and write restrictions. The transaction is rolled back without keeping test users.
- HKU Connect email verification establishes mailbox access, not current enrollment. It does not retrieve a student's name, ID, faculty, or year.

## Deployment

The GitHub Actions workflow installs locked dependencies, checks syntax, runs authentication rule tests, bundles the application, and deploys `site/` to GitHub Pages. Runtime scripts are bundled locally; no third-party CDN is required.

## Supabase configuration for a new project

1. Create a Free project without paid add-ons.
2. Run `supabase/001_school_auth.sql` once. This creates profiles, enables RLS, and restricts account email domains. Clients cannot insert, update, or delete profile records.
3. Under Authentication → Hooks → Before User Created, enable `public.hku_email_signup_hook`. A database trigger also restricts inserts and subsequent email changes.
4. Enable Email with email confirmation. Leave anonymous and other sign-in providers disabled. This website does not offer email changes or password-based sign-up.
5. Set Email OTP length to **8** and expiration to **600 seconds**. Use `supabase/email-template.html` for Magic link or OTP and Confirm sign up. The template must contain `{{ .Token }}`.
6. Set Site URL to the deployed website. Do not add unrelated redirect URLs. This application does not process access tokens from URLs.
7. Configure a custom SMTP provider. Supabase's default SMTP is for limited team testing. Check the provider's free allowance and the project's hourly email limit before an event.
8. Put only the public project URL and modern `sb_publishable_...` key in `site/config.js`. Never add service-role keys, secret keys, SMTP passwords, or database credentials to this repository.
9. Enable `authReady` only when the backend and email configuration are ready. Deploy and complete a real email verification test before inviting participants.

## Account data and security

- Supabase Auth generates and verifies codes. The frontend does not persist them.
- Session credentials use tab-scoped `sessionStorage`. Signing out clears the local session.
- Profiles contain only the Auth UUID, a generated participant code, and the creation time. Auth manages email addresses.
- Restored sessions are validated with server-side `getUser()`. RLS checks the actual user's email confirmation and exact school domain.
- Unverified, non-school, and anonymous users cannot read profiles. Verified users can read only their own profile.
- Account counts do not establish unique currently enrolled students; mailbox aliases and alumni need separate handling.

## Development and verification

```sh
npm ci
npm run bundle
npm test
npm run check
```

Run `supabase/002_verify_access.sql` in the SQL editor for repeatable database checks. Success returns PASS; all synthetic users and profiles are rolled back. This does not send email or replace an end-to-end sign-in test.

Before participant access, test real code delivery and verification, incorrect/expired codes, resend cooldown, refresh, sign-out, another device, profile reads, and two-account isolation. Confirm the deletion contact and retention arrangements, check phone/shared-device layouts, and ensure free quotas cover the event peak.

GitHub Pages serves public static files. Supabase Auth and RLS protect account data.
