# 富臨錢進號 · HKU 電郵登入

此版本只有登入介面、電郵 OTP 驗證及最小帳戶資料表，沒有遊戲或活動內容。

## 狀態

- 前端及 SQL 已準備；`site/config.js` 預設 `authReady: false`。
- 未設定真實 Supabase 專案及正式寄信服務前，網站不會寄出驗證碼或模擬登入。
- HKU Connect 電郵只證明信箱持有權，不代表現時在讀身份；亦不會自動取得姓名、學號、學院或年級。

## 免費 GitHub Pages 部署

將 `site/` 內的檔案發布為靜態網站。GitHub Pages 可選擇 GitHub Actions 執行 `.github/workflows/pages.yml`；Cloudflare Pages 則將輸出目錄設定為 `site`，毋須 build command。網站所需程式都在 `site/`，沒有執行期 CDN 依賴。

## Supabase 設定（新專案）

1. 建立 Free 專案，不啟用任何付費功能。
2. 在 SQL editor 執行 `supabase/001_school_auth.sql` **一次**。它限制帳戶網域、建立 profiles 及啟用 RLS。用戶不能直接新增、修改或刪除 profiles，亦不能讀取他人資料。
3. Authentication → Hooks → Before User Created，選擇 `public.hku_email_signup_hook`。即使 hook 未開啟，資料庫 trigger 仍限制新帳戶及後續更改電郵的網域。
4. Authentication → Email：啟用 Email，確認 email confirmation 開啟，停用其他登入方式及匿名登入。本網站不提供更改電郵功能。
5. 設定 Email OTP 長度 **6**、有效期 **600 秒**，將 Magic Link email template 改為 `supabase/email-template.html`（使用 `{{ .Token }}`）。不要把它配置成要求密碼的註冊流程。
6. 將 Site URL 設為部署後的確實網址。僅允許該網址作 redirect；本頁不處理 URL 中的 access token。
7. 配置自訂 SMTP。Supabase 預設 SMTP 僅限專案團隊測試，不能作正式活動寄信。須確認所選服務的免費配額、網域及每小時限制；本專案不自動購買服務或訂閱。
8. 在 `site/config.js` 填寫公開 Project URL 及 `sb_publishable_...` key。不得填入 service_role、secret、SMTP 密碼或資料庫密碼。
9. 確認寄信及後端限制完成後才設定 `authReady: true`，重新部署。

## 帳戶及資料

- Email OTP 由 Supabase Auth 產生及核對；前端不保存驗證碼。
- 登入憑證使用分頁的 `sessionStorage`，登出會清除本地 session。
- `profiles` 只保存 Auth UUID、隨機參與編號及建立時間；電郵由 Auth 管理。
- 每次恢復登入會經 `getUser()` 向伺服器驗證；資料庫同時核對真實 email confirmation 及學校網域。
- 未驗證、非學校帳戶、匿名用戶及其他人的資料一律不通過 RLS。
- 不應以帳戶數直接宣稱不重複在讀學生人數，學校信箱別名及畢業生均需另行處理。

## 開發與驗證

```sh
npm ci
npm run bundle
npm test
npm run check
```

對有真實連接的部署，另測試：正確電郵 OTP、錯誤／過期 OTP、重寄冷卻、重整、登出、另一裝置登入、不同帳戶 RLS、未驗證帳戶、非 HKU 網域 signup 及更改電郵。沒有真實寄信前不應宣稱端對端登入已通過。

## 開放前檢查

- 兩個真實測試帳戶完成寄信、驗證、profiles 讀取及資料隔離。
- 按活動需要確認帳戶刪除聯絡方式及資料保留安排，再對外招募。
- 測試 Safari/Chrome 手機及共用平板，完成後登出。
- 確認免費專案沒有暫停，SMTP 配額符合活動高峰。

使用 GitHub Pages 的頁面本身屬公開靜態檔案；資料存取由 Supabase Auth + RLS 保護。
