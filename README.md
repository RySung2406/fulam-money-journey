# The Money Journey · Fulin One Slice

An HKU email sign-in portal with the English edition of Fulin One Slice, the money-bag slicing game.

## Game

- Sign in with your HKU Connect email, then select **Play the money challenge**. Direct visits to `game/` return signed-out visitors to the account page.
- The game validates the user with Supabase Auth and reads their own RLS-protected profile before starting. No additional account or payment service is needed.
- Five rounds cover financial tools, investing, insurance, borrowing and scam awareness: 60 choices in total, with Easy, Medium and Hard speeds.
- One to three bags fly along random sideways arcs. Drag or swipe to slice; keyboard players can Tab to an active bag and press Enter or Space. Pause, mute, fullscreen, reviews, replay and copying results are supported.
- Correct slices earn 100 points plus combo bonuses; wrong slices lose 150. Reviews distinguish correct slices, wrong slices, avoided choices and missed choices.
- Results stay in memory and reset on leaving or reloading the game. Only sound and difficulty preferences are saved locally. This deployment does not collect scores or provide a leaderboard.
- Adapted from the user-selected game at https://fulam-one-slice.ryantw2406.chatgpt.site/, version 7, source commit `2530d8cbb3a045445a52f955898c60bdf06660b5`. The original Site is unchanged. All interface text, questions, explanations and resource labels in this edition are English.

## Deployment status

- Website: https://rysung2406.github.io/fulin-money-journey/
- Supabase project, school-domain enforcement, signup hook, and row-level security are configured.
- Brevo custom SMTP is configured on the free plan.
- English email templates and SMTP are configured. Sign-in is enabled. A real HKU mailbox test passed: code delivery, user-entered OTP verification, profile creation/read, session restoration after refresh, and sign-out. The same participant ID was retained after refresh.
- Database checks in `supabase/002_verify_access.sql` passed: profile creation, exact-domain enforcement, cross-account isolation, unverified-account denial, and write restrictions. The transaction is rolled back without keeping test users.
- HKU Connect email verification establishes mailbox access, not current enrollment. It does not retrieve a student's name, ID, faculty, or year.

## Deployment

The GitHub Actions workflow installs locked dependencies, checks syntax, runs authentication and game tests, bundles both entry points, and deploys `site/` to GitHub Pages. Runtime scripts and game assets are served locally; no third-party CDN is required.

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

The 13 automated checks cover email/OTP rules, server-validated game access, rejected identities, profile failures, score deduplication, combo penalties, review categories, swipe collisions and random wave/trajectory bounds. Browser QA covered signed-out redirects, desktop and phone-width layouts, keyboard practice, pause/resume, all five rounds, results and mistake reviews. The new production sign-in-to-game journey still needs a user-entered OTP check after deployment; the earlier sign-in flow already passed a real mailbox test.

GitHub Pages serves public static files, including game source and questions. The login gate controls the normal play flow; it does not make static game assets private. Supabase Auth and RLS protect account data.
