# 2026 年 10 月網站改版紀錄

以下保留當時的介面設計和測試結果。現行參加流程請見[會員帳戶及打卡指南](../account.md)。

| 版本 | 當時的畫面 |
| --- | --- |
| 首次改版 | [首頁桌面版](screenshots/redesign-desktop.jpg) |
| 社群優先版本 | [調整後的首頁](screenshots/fulam-refinement-desktop.jpg) |
| 加入社群邀請後 | [WhatsApp 邀請畫面](screenshots/fulam-community-invitation.jpg) |

當時的 FuLam One Slice 英文版改編自原作第 7 版，來源 commit 為 `2530d8cbb3a045445a52f955898c60bdf06660b5`。[遊戲原作](https://fulam-one-slice.ryantw2406.chatgpt.site/) · [整理前的完整 README](https://github.com/RySung2406/fulam-money-journey/blob/6cba73e08798c00e136b8162f3af4d0dfefa9a17/README.md)

## Earlier redesign validation

For the earlier redesign, the 17 auth/session/game tests and the JavaScript syntax/build checks passed. Public navigation, mobile content filters/dialogs, pretest entry and the signed-out game route were checked in a browser. Responsive layouts were inspected at 320, 390 and desktop widths; automated accessibility checks covered the public, login and then-current My Journey fixture states. The My Journey visual check used a local fixture, not a live signed-in account. Real OTP delivery and cross-device session behavior were not repeated for that visual update. These results describe the earlier dashboard, not validation of the subsequent onboarding layout.

## Earlier community-first refinement (October 2026)

The earlier signed-in My Journey dashboard started with the WhatsApp community invitation. The survey-first flow described below now replaces that dashboard. Questions, explanations, original content and discussion happen in WhatsApp; games and future check-in submissions remain on this website. Microsoft Forms collects the first questionnaire independently; website-side completion verification is not implemented.

The HKU student team 搏富臨 created the project. The archived [programme references](../programme-logos/README.md) record the institutional roles.

UI UX Pro Max guidance informed that refinement's larger body typography, contrast, spacing, responsive card layout and restrained motion. Its desktop body text was generally 18–20px and mobile body text 17–18px. Existing authentication, database policies and gameplay mechanics were preserved.

Validation for that refinement: 17 existing auth/session/game tests passed; invitation-link checks covered missing, valid, deceptive-host, script and credential-bearing URLs. Browser checks covered the homepage, filters/dialog, login, programme logos, a signed-in visual fixture, and 320/390/768px layouts. The authenticated visual state was a local fixture; no real OTP was sent for that visual update.

## Survey-first onboarding (October 2026)

After a successful HKU email sign-in or restoration of a saved session, `/account/` starts at the survey step. The primary link opens the existing Microsoft Forms questionnaire in a new tab, with its 10–12 minute estimate, HKU Connect sign-in requirement and name/email disclosure. Participants return to the account page and select the submission-confirmation button to reveal the WhatsApp invitation and the `@fulam_money` Instagram profile. A back button returns to the survey step; account details and sign-out remain available in both steps.

The confirmation is the participant's own statement, not verification from Microsoft Forms. Step selection exists only in the current page's memory: reloading or reopening the account page starts at the survey again. No completion flag is stored in the browser or database, and questionnaire responses are not collected by this website. The flow neither verifies WhatsApp membership nor marks an invitation click as a successful join. It does not change authentication, profile access, database policies or game access.

Set `whatsappCommunityUrl` in `site/config.js` to the verified participant community invitation (not the internal team chat). The project owner's invitation remains configured. Empty or invalid invitations show a clear pending message; only HTTPS `chat.whatsapp.com` invitations enable the external link. Joining is voluntary. The homepage and existing game routes remain available through the normal site navigation.

Validation: all 17 existing tests, JavaScript syntax checks and both browser builds passed. Local browser fixtures exercised fresh OTP sign-in, saved-session restoration, survey opening without advancing, explicit continuation, back navigation, sign-out/reset, invalid invitation handling and profile-load failure. Layouts were inspected at 320 px, 390 px and 1280 px; a narrow-header overflow was corrected. Auth responses and external destinations were mocked, so these checks sent no real OTP, submitted no questionnaire and joined no group.
