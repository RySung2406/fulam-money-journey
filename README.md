# The Money Journey · FuLam One Slice

A Traditional Chinese financial-education website with an editorial content hub, persistent HKU email sign-in and the English edition of FuLam One Slice.

## Game

- Sign in with your HKU Connect email, then open the game from the homepage or visit `game/`. Direct visits to `game/` return signed-out visitors to the account page; the account page now shows survey-first onboarding instead of a game dashboard.
- The game validates the user with Supabase Auth and reads their own RLS-protected profile before starting. No additional account or payment service is needed.
- Five rounds cover financial tools, investing, insurance, borrowing and scam awareness: 60 choices in total, with Easy, Medium and Hard speeds.
- One to three bags fly along random sideways arcs. Drag or swipe to slice; keyboard players can Tab to an active bag and press Enter or Space. Pause, mute, fullscreen, reviews, replay and copying results are supported.
- Correct slices earn 100 points plus combo bonuses; wrong slices lose 150. Reviews distinguish correct slices, wrong slices, avoided choices and missed choices.
- Results stay in memory and reset on leaving or reloading the game. Only sound and difficulty preferences are saved locally. This deployment does not collect scores or provide a leaderboard.
- Adapted from the user-selected game at https://fulam-one-slice.ryantw2406.chatgpt.site/, version 7, source commit `2530d8cbb3a045445a52f955898c60bdf06660b5`. The original Site is unchanged. All interface text, questions, explanations and resource labels in this edition are English.

## Website and content (October 2026 redesign)

- `/`: public homepage, game introduction, four content categories, pretest entrance and community introduction. Warm ivory, forest green and amber, optimized hero image and locally hosted Lucide icons.
- `/account/`: the existing OTP flow and persistent sign-in, followed by a compact two-step journey: the Microsoft Forms survey first, then the WhatsApp invitation after the participant confirms submission. Email and participant code remain available under account details, with a visible sign-out control. The previous dashboard, progress list and game cards are no longer shown here.
- `/questionnaire/`: links to the HKU student pre-survey on Microsoft Forms. HKU Connect sign-in is required; Microsoft Forms says the form owner can see respondents’ names and email addresses. The website does not verify form completion or store its responses.
- `/hub/`: daily check-in, community, leaderboard, rewards and supporters. Existing hash URLs remain usable. These features are not yet collecting data or awarding points.
- `/game/`: existing English game, now returning to `/account/` for sign-in and account links. Authentication and database policies are unchanged.

### Adding original content

The public content area has four categories: street interviews, explainers, AI videos and interviews. Each is honestly marked coming soon until a real release is supplied. `site/content-data.js` holds each category's first release title, description and URL. Set `url` to a verified HTTPS destination (for example, the team's published video) to enable the “watch” link in its detail dialog. The link opens in a new tab; no third-party player or tracking is loaded automatically. Update the matching title/copy in `site/index.html` when publishing a particular episode. Extend the catalogue and cards together for multiple releases per category. Do not label unreviewed uploads as published.

The category filter is keyboard operable and persisted in the URL (`?content=street#stories`). Dialogs support Escape and restore focus to their trigger. Most content is readable without JavaScript. Motion is limited to a brief initial entrance, button feedback and a 240ms filter transition; `prefers-reduced-motion` disables nonessential movement. No ongoing animation loop or animation dependency is loaded.

### Still pending

Before adding website-side questionnaire storage or activating check-ins, implement verified-account storage, RLS, safe submission retries, unique submission constraints, and disclosure/retention details. Microsoft Forms collects the linked pre-survey independently. The participant community invitation is configured. Before rewards activation, supply eligibility, scoring and redemption rules. This link does not change Supabase schema, permissions or SMTP limits.

## Deployment status

- Website: https://rysung2406.github.io/fulam-money-journey/
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
- Session credentials use browser-persistent `localStorage`, shared by the account and game pages. Closing a tab or restarting the browser keeps the session; Supabase refreshes valid sessions automatically. Signing out clears this browser's session and notifies other open tabs. Private browsing, clearing site data, or a revoked/expired session can require verification again. Users on the previous tab-only version need to sign in once after updating; old tab sessions are not migrated, so stale tabs cannot restore a signed-out account.
- A temporary network or profile-load failure keeps the saved session and asks the participant to refresh. Server-validated HKU identity and profile checks still gate account and game access. Sign out explicitly on shared devices.
- Profiles contain only the Auth UUID, a generated participant code, and the creation time. Auth manages email addresses.
- Restored sessions are validated with server-side `getUser()`. RLS checks the actual user's email confirmation and exact school domain.
- Unverified, non-school, and anonymous users cannot read profiles. Verified users can read only their own profile.
- Account counts do not establish unique currently enrolled students; mailbox aliases and alumni need separate handling.

## Development and verification

Use Node.js 22 or later. Open `fulam-money-journey.code-workspace` in VS Code, then use its terminal:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/fulam-money-journey/**. The server listens only on this PC, preserves the GitHub Pages subdirectory, and rebuilds JavaScript in memory when source files change. Refresh the browser to see edits. Stop it with **Ctrl+C**. If the port is busy, use `npm run dev -- --port 5174` and open the matching URL.

After installing dependencies, **F5** runs the `FuLam: open local website` configuration in Microsoft Edge. The VS Code **Terminal → Run Task** menu also offers start, build, test and syntax-check tasks. If a development server is already running on port 5173, stop it before starting another through F5.

For Codex, install the recommended **OpenAI Codex** extension (`openai.chatgpt`), open its sidebar, and sign in with your ChatGPT account if prompted. OpenAI's [official extension guide](https://learn.chatgpt.com/docs/codex/ide) explains the editor setup.

### Local website and database

The local website uses the same hosted Supabase project as the published website, through the public configuration in `site/config.js`. Authentication and profile records remain online; running the website locally does not create a separate database on your PC. Real sign-ins use the existing email provider and create real accounts. No database password or service-role key is needed to run this frontend.

The existing database schema is in `supabase/001_school_auth.sql`; it is a **one-time setup for a new empty project**. Do not rerun it against the already configured production project. Open the existing project in the Supabase dashboard to manage database settings. A separate local Supabase environment requires additional CLI and Docker setup and its own local auth/configuration.

Existing project: [Supabase dashboard](https://supabase.com/dashboard/project/tqkywfishsnhrhkhngym), [database tables](https://supabase.com/dashboard/project/tqkywfishsnhrhkhngym/editor). Dashboard administration requires your Supabase account; frontend development uses only the public client configuration.

### Publish and verify

The published URL is **https://rysung2406.github.io/fulam-money-journey/**. Local changes appear online after they are committed and pushed to `main` and the **Deploy The Money Journey to GitHub Pages** workflow succeeds. Review the change and run the checks before pushing. GitHub Pages hosts the static website; Supabase continues to host authentication and the database. The workflow does not apply database migrations.

```sh
npm run bundle
npm test
npm run check
```

Run `supabase/002_verify_access.sql` in the SQL editor for repeatable database checks. Success returns PASS; all synthetic users and profiles are rolled back. This does not send email or replace an end-to-end sign-in test.

Before participant access, test real code delivery and verification, incorrect/expired codes, resend cooldown, refresh, sign-out, another device, profile reads, and two-account isolation. Confirm the deletion contact and retention arrangements, check phone/shared-device layouts, and ensure free quotas cover the event peak.

Automated checks cover email/OTP rules, server-validated game access, rejected identities, profile failures, browser-persistent sign-in across new clients, expired-token refresh without another OTP, sign-out persistence, temporary error handling, score deduplication, combo penalties, review categories, swipe collisions and random wave/trajectory bounds. Session lifecycle tests use the real Supabase client with simulated storage and network responses. Earlier browser QA covered signed-out redirects, desktop and phone-width layouts, keyboard practice, pause/resume, all five rounds, results and mistake reviews. After this persistence update, a real browser sign-in, close/reopen and cross-tab sign-out check still needs a user-entered OTP; the earlier sign-in flow already passed a real mailbox test.

GitHub Pages serves public static files, including game source and questions. The login gate controls the normal play flow; it does not make static game assets private. Supabase Auth and RLS protect account data.


### Earlier redesign validation

For the earlier redesign, the 17 auth/session/game tests and the JavaScript syntax/build checks passed. Public navigation, mobile content filters/dialogs, pretest entry and the signed-out game route were checked in a browser. Responsive layouts were inspected at 320, 390 and desktop widths; automated accessibility checks covered the public, login and then-current My Journey fixture states. The My Journey visual check used a local fixture, not a live signed-in account. Real OTP delivery and cross-device session behavior were not repeated for that visual update. These results describe the earlier dashboard, not validation of the subsequent onboarding layout.

### Earlier community-first refinement (October 2026)

The earlier signed-in My Journey dashboard started with the WhatsApp community invitation. The survey-first flow described below now replaces that dashboard. Questions, explanations, original content and discussion happen in WhatsApp; games and future check-in submissions remain on this website. Microsoft Forms collects the first questionnaire independently; website-side completion verification is not implemented.

The homepage and activity hub show the supplied official partner strip unchanged, with the official programme name and separate co-organizer/funder credits. Source: https://www.ifec.org.hk/web/tc/other-resources/activities-and-events/personal-finance-ambassador-programme-2627-application.page . The project is created by the HKU student team 搏富臨; these are programme-level institutional roles.

UI UX Pro Max guidance informed that refinement's larger body typography, contrast, spacing, responsive card layout and restrained motion. Its desktop body text was generally 18–20px and mobile body text 17–18px. Existing authentication, database policies and gameplay mechanics were preserved.

Validation for that refinement: 17 existing auth/session/game tests passed; invitation-link checks covered missing, valid, deceptive-host, script and credential-bearing URLs. Browser checks covered the homepage, filters/dialog, login, programme logos, a signed-in visual fixture, and 320/390/768px layouts. The authenticated visual state was a local fixture; no real OTP was sent for that visual update.

### Survey-first onboarding (October 2026)

After a successful HKU email sign-in or restoration of a saved session, `/account/` starts at the survey step. The primary link opens the existing Microsoft Forms questionnaire in a new tab, with its 10–12 minute estimate, HKU Connect sign-in requirement and name/email disclosure. Participants return to the account page and select the submission-confirmation button to reveal the WhatsApp invitation and the `@fulam_money` Instagram profile. A back button returns to the survey step; account details and sign-out remain available in both steps.

The confirmation is the participant's own statement, not verification from Microsoft Forms. Step selection exists only in the current page's memory: reloading or reopening the account page starts at the survey again. No completion flag is stored in the browser or database, and questionnaire responses are not collected by this website. The flow neither verifies WhatsApp membership nor marks an invitation click as a successful join. It does not change authentication, profile access, database policies or game access.

Set `whatsappCommunityUrl` in `site/config.js` to the verified participant community invitation (not the internal team chat). The project owner's invitation remains configured. Empty or invalid invitations show a clear pending message; only HTTPS `chat.whatsapp.com` invitations enable the external link. Joining is voluntary. The homepage and existing game routes remain available through the normal site navigation.

Validation: all 17 existing tests, JavaScript syntax checks and both browser builds passed. Local browser fixtures exercised fresh OTP sign-in, saved-session restoration, survey opening without advancing, explicit continuation, back navigation, sign-out/reset, invalid invitation handling and profile-load failure. Layouts were inspected at 320 px, 390 px and 1280 px; a narrow-header overflow was corrected. Auth responses and external destinations were mocked, so these checks sent no real OTP, submitted no questionnaire and joined no group.
