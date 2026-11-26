# 會員帳戶、每日打卡與攤位

## 參加者流程與資料去向

| 入口 | 運作方式 | 紀錄位置 |
| --- | --- | --- |
| `/account/` | 參加者以 `@connect.hku.hk`、`@graduate.hku.hk` 或 `@hku.hk` 電郵收取驗證碼。程式向 Supabase Auth 核實使用者，再讀取本人的參加者編號。 | Auth 保存電郵。`public.profiles` 保存使用者 ID、參加者編號及建立時間，以資料列層級安全性（RLS）限制本人讀取。電郵驗證只確認信箱使用權。 |
| `/account/#survey`、`#community` | 會員可在問卷、WhatsApp 社群、打卡及攤位四步之間切換。有效的直接連結優先，其次是上次瀏覽的步驟，首次預設為問卷。 | 瀏覽器按帳戶記住步驟。前、後測回覆由 Microsoft Forms 收集，前測表單負責人可查看姓名及電郵。網站只提供問卷及自願加入社群的連結。 |
| `/account/#daily-check-in`、`#member-rewards` | 選擇已開放的日子，提交 A、B 或 C。抽獎條件為完成最少 17／21 天打卡及後測問卷。畫面的進度按成功儲存的打卡日數計算。 | Supabase 的 `public.check_ins` 每位會員每日只有一筆紀錄。伺服器設定帳戶及提交時間，保存參加者聲明和首次選擇。重試會傳回已存紀錄。 |
| `/account/#booth`、`/booth/` | 會員頁列出活動日期、地點及獎品。遊戲站職員以入口密碼開站，按局為玩家登記 UID。 | 入口由 Supabase 發出有效期八小時的工作階段，存於該分頁的 `sessionStorage`。成績留在攤位裝置；職員用該裝置的 PIN 核對後測後，成績才列入該遊戲的排行榜。多部裝置可透過工作人員介面匯出及合併 CSV。 |

會員登入使用瀏覽器的 `localStorage` 並會自動更新有效的登入憑證。重新開頁時程式會呼叫 `getUser()` 並重新讀取個人資料。遇到短暫網絡錯誤可按重試，已失效的登入則須再次驗證電郵。在共用裝置請主動登出；瀏覽器仍會保留上次使用的電郵供下次預填。[帳戶程式](../site/app.js) · [登入儲存設定](../site/auth-session.js) · [攤位工作站](../site/booth/station.js)

## 建立新 Supabase 專案

本機開發伺服器會使用 `site/config.js` 指向的託管專案。以 repo 內的現有設定實際登入會寄出電郵，也可能建立正式帳戶。GitHub Pages 工作流程只發布網站，資料庫需獨立設定。[公開設定](../site/config.js) · [現有專案控制台](https://supabase.com/dashboard/project/tqkywfishsnhrhkhngym)

1. 在全新專案的 SQL Editor 執行一次 [001 帳戶結構](../supabase/001_school_auth.sql)，再執行 [002 驗證](../supabase/002_verify_access.sql)。然後套用 [003 HKU 電郵網域擴展](../supabase/003_hku_member_email_domains.sql)，並執行 [004 會員存取驗證](../supabase/004_verify_member_access.sql)。002、004 完成後會回滾測試帳戶並傳回 `PASS`。現有專案先核對已套用的版本，再套用缺少的更新。
2. 按檔名時間順序套用 [supabase/migrations](../supabase/migrations/) 內的 SQL，以建立打卡日曆、答題紀錄、解答讀取規則及攤位入口。攤位入口的密碼驗證使用 `extensions` schema 內的 `pgcrypto`。由管理員另行填入 `private.check_in_answers` 的解答，以及 `booth_private.entry_password` 的加鹽密碼雜湊；這些資料由活動團隊保管。
3. 在 Supabase Auth 啟用 Email 和電郵確認，停用匿名及其他登入方式。在 **Before User Created** hook 選擇 `public.hku_email_signup_hook`，將 Site URL 設為該環境的網站網址。
4. 將電郵驗證碼設為 **8 位數字、有效 600 秒**。在 **Magic Link** 及 **Confirm signup** 模板使用 [電郵模板](../supabase/email-template.html)，保留 `{{ .Token }}`。設定自訂 SMTP；活動前核對郵件供應商與 Supabase Auth 的傳送限額。
5. 為網站網域設定 Cloudflare Turnstile，在 Supabase Auth 的 CAPTCHA 設定選擇 Turnstile 並填入對應的 secret。在前端設定 `supabaseUrl`、`supabasePublishableKey`（`sb_publishable_…`）、`turnstileSiteKey` 及 `otpLength`。服務就緒後將 `authReady` 設為 `true`。首次寄信和重發均需要新的 Turnstile 驗證。SMTP 密碼、Turnstile secret 及後端私鑰只放在各服務的管理設定。

## 更新活動內容

- **問卷與社群。** 帳戶頁讀取 `preSurveyUrl`、`postSurveyUrl` 及 `whatsappCommunityUrl`。更換表單時，同步核對公開問卷頁、帳戶頁的預設連結、攤位工作站的後測連結及 QR 碼。社群接受 `https://chat.whatsapp.com/` 的參加者邀請連結。[問卷頁](../site/questionnaire/index.html) · [帳戶頁](../site/account/index.html) · [攤位後測 QR 碼](../site/booth/post-test-qr.svg)
- **每日打卡。** 雙語題目和選項放在公開題庫，答案及解說由資料庫按個人打卡紀錄傳回。2026 年 11 月活動以香港時間計算，開放後可補打卡至 **11 月 29 日 00:00 前**。第 1 日提交後即可看解答，其餘日子在該題原定日期翌日 06:00 起可看解答。更換活動日期時，需一併檢查日曆、提交及解答三個資料庫函式。[公開題庫](../site/check-in-days.js) · [開放及提交時間](../supabase/migrations/20261119175409_open_check_in_through_day_17.sql) · [解答讀取規則](../supabase/migrations/20261109070000_check_in_reveals.sql)

## 驗證

`npm test` 包括電郵及驗證碼規則、登入憑證更新與登出、打卡重試及攤位工作階段。登入測試模擬儲存及網絡回應，攤位入口測試使用本機 PGlite。[登入測試](../tests/auth-session.test.mjs) · [打卡測試](../tests/check-in.test.mjs) · [攤位入口測試](../tests/booth-entry.test.mjs)

核實實際寄送及瀏覽器行為時，使用獲授權的 HKU 測試信箱完成 Turnstile、收取並輸入驗證碼，記下參加者編號。重新整理及關閉後重開瀏覽器，核對編號一致；在同一瀏覽器開兩個分頁，從其中一個登出後檢查另一頁。測試新活動的打卡時間、答案發放及工作站成績時，使用測試專案與測試裝置。
